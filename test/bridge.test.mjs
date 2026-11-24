import assert from 'node:assert/strict';
import { createHash, randomBytes } from 'node:crypto';
import test from 'node:test';
import { mcp } from '../lib/mcp.mjs';
import { oauth, verifyAccess } from '../lib/oauth.mjs';

const origin = 'https://bridge.example';
const resource = origin + '/mcp';
const redirect = 'https://oauth-redirect.googleusercontent.com/r/test-client';
const protocol = '2025-03-26';
const tools = [
  { name: 'first_upstream_tool', inputSchema: { type: 'object' } },
  { name: 'future_upstream_tool', inputSchema: { type: 'object' } },
];
const rpc = (id, method, params = {}) => ({ jsonrpc: '2.0', id, method, params });
const formHeaders = { 'content-type': 'application/x-www-form-urlencoded' };

function fixture() {
  const used = new Set();
  return {
    origin,
    signingKey: randomBytes(32).toString('base64url'),
    ownerPassword: randomBytes(32).toString('base64url'),
    kaggleToken: 'synthetic-' + randomBytes(32).toString('base64url'),
    consume: async (id, exp) => {
      assert.ok(exp > Date.now() / 1000);
      if (used.has(id)) return false;
      used.add(id);
      return true;
    },
  };
}

function request(path, method = 'GET', headers = {}, body) {
  return new Request(new URL(path, origin), { method, headers, body });
}

async function register(context, overrides = {}) {
  return oauth(request('/oauth/register', 'POST', { 'content-type': 'application/json' }, JSON.stringify({
    client_name: 'Gemini',
    token_endpoint_auth_method: 'client_secret_post',
    redirect_uris: [redirect],
    grant_types: ['authorization_code'],
    response_types: ['code'],
    ...overrides,
  })), context);
}

async function begin(context, registration = {}) {
  const registered = await register(context, registration);
  assert.equal(registered.status, 201);
  const client = await registered.json();
  const verifier = randomBytes(32).toString('base64url');
  const query = new URLSearchParams({
    client_id: client.client_id, redirect_uri: redirect, response_type: 'code',
    scope: 'kaggle', resource, state: 'opaque-state-from-gemini',
    code_challenge: createHash('sha256').update(verifier).digest('base64url'),
    code_challenge_method: 'S256',
  });
  const consent = await oauth(request('/oauth/authorize?' + query), context);
  assert.equal(consent.status, 200);
  assert.equal(consent.headers.get('referrer-policy'), 'strict-origin');
  const cookie = consent.headers.get('set-cookie');
  assert.match(cookie, /HttpOnly/i);
  assert.match(cookie, /Secure/i);
  const html = await consent.text();
  assert.ok(!html.includes(context.ownerPassword));
  const fields = {};
  let passwordName;
  for (const [input] of html.matchAll(/<input\b[^>]*>/gi)) {
    const attributes = Object.fromEntries(Array.from(input.matchAll(/([\w-]+)="([^"]*)"/g), m => [m[1], m[2]]));
    if (attributes.type === 'hidden') fields[attributes.name] = attributes.value;
    if (attributes.type === 'password') passwordName = attributes.name;
  }
  assert.ok(passwordName);
  return { client, verifier, query, fields, passwordName, cookie: cookie.split(';')[0] };
}

async function approve(context, flow, override = {}) {
  return oauth(request('/oauth/authorize', 'POST', {
    ...formHeaders, origin, cookie: flow.cookie, ...override.headers,
  }, new URLSearchParams({
    ...flow.fields, [flow.passwordName]: context.ownerPassword, decision: 'allow',
    ...override.form,
  })), context);
}

async function authorize(context, registration = {}) {
  const flow = await begin(context, registration);
  const allowed = await approve(context, flow);
  assert.equal(allowed.status, 303);
  const location = new URL(allowed.headers.get('location'));
  assert.equal(location.origin + location.pathname, redirect);
  assert.equal(location.searchParams.get('state'), flow.query.get('state'));
  const code = location.searchParams.get('code');
  assert.ok(code);
  return { ...flow, code };
}

function exchange(context, flow, fields = {}) {
  return oauth(request('/oauth/token', 'POST', formHeaders, new URLSearchParams({
    grant_type: 'authorization_code', code: flow.code, redirect_uri: redirect,
    client_id: flow.client.client_id, client_secret: flow.client.client_secret,
    code_verifier: flow.verifier, resource, ...fields,
  })), context);
}

async function authenticatedFixture() {
  const context = fixture();
  const access = await exchange(context, await authorize(context));
  assert.equal(access.status, 200);
  const { access_token: token } = await access.json();
  assert.ok(token);
  return { context, token };
}

test('public discovery agrees with the unauthenticated MCP challenge', async () => {
  const context = fixture();
  context.fetchImpl = () => assert.fail('Unauthenticated traffic reached Kaggle');
  const denied = await mcp(request('/mcp'), context);
  assert.equal(denied.status, 401);
  assert.match(denied.headers.get('www-authenticate'), /Bearer .*resource_metadata=/);
  const link = /resource_metadata="([^"]+)"/.exec(denied.headers.get('www-authenticate'))[1];
  for (const path of [link, '/.well-known/oauth-protected-resource']) {
    const discovery = await mcp(request(path), context);
    assert.equal(discovery.status, 200);
    const info = await discovery.json();
    assert.equal(info.resource, resource);
    assert.deepEqual(info.authorization_servers, [origin]);
    assert.ok(info.scopes_supported.includes('kaggle'));
  }
  const as = await oauth(request('/.well-known/oauth-authorization-server'), context);
  const info = await as.json();
  assert.equal(info.issuer, origin);
  assert.equal(info.registration_endpoint, origin + '/oauth/register');
  assert.deepEqual(info.code_challenge_methods_supported, ['S256']);
  assert.equal((await mcp(request('/mcp', 'GET', { authorization: 'Bearer fake' }), context)).status, 401);
});

test('only registered Google callbacks and PKCE S256 are accepted', async () => {
  const context = fixture();
  const bad = await register(context, { redirect_uris: ['https://example.org/callback'] });
  assert.equal(bad.status, 400);
  const flow = await begin(context);
  for (const overrides of [
    { code_challenge_method: 'plain' },
    { code_challenge: '' },
    { redirect_uri: 'https://oauth-redirect.googleusercontent.com/r/different' },
    { resource: origin + '/unrelated' },
  ]) {
    const params = new URLSearchParams(flow.query);
    for (const [name, value] of Object.entries(overrides)) params.set(name, value);
    const result = await oauth(request('/oauth/authorize?' + params), context);
    assert.equal(result.status, 400);
  }
});

test('consent requires the owner password, correct origin and matching browser cookie', async () => {
  const context = fixture();
  for (const mode of ['password', 'origin', 'cookie']) {
    const flow = await begin(context);
    const wrong = mode === 'password' ? { form: { [flow.passwordName]: 'incorrect' } }
      : { headers: mode === 'origin' ? { origin: 'https://foreign.example' } : { cookie: '' } };
    const denied = await approve(context, flow, wrong);
    assert.ok(denied.status >= 400);
    assert.equal(denied.headers.get('location'), null);
  }
  const flow = await authorize(context);
  const replay = await approve(context, flow);
  assert.ok(replay.status >= 400);
});

test('a browser can retry a pasted password while opaque origins still fail closed', async () => {
  const context = fixture();
  const flow = await begin(context);
  const headers = { accept: 'text/html' };
  const opaque = await approve(context, flow, { headers: { ...headers, origin: 'null' } });
  assert.equal(opaque.status, 403);
  assert.equal(opaque.headers.get('location'), null);

  const failed = await approve(context, flow, { headers, form: { password: 'wrong-owner-password' } });
  assert.equal(failed.status, 403);
  assert.equal(failed.headers.get('referrer-policy'), 'strict-origin');
  const html = await failed.text();
  assert.match(html, /role="alert"/);
  assert.ok(html.includes(flow.fields.transaction));
  assert.ok(!html.includes('wrong-owner-password'));
  assert.ok(!html.includes(context.ownerPassword));

  const retry = await approve(context, flow, {
    headers, form: { password: ' ' + context.ownerPassword + '\n' },
  });
  assert.equal(retry.status, 303);
  assert.equal(retry.headers.get('referrer-policy'), 'no-referrer');
});

test('code and access token bind client, PKCE and resource and redeem once', async () => {
  const context = fixture();
  const flow = await authorize(context);
  for (const fields of [
    { client_secret: 'incorrect' },
    { code_verifier: randomBytes(32).toString('base64url') },
    { resource: 'https://another.example/mcp' },
    { redirect_uri: 'https://oauth-redirect.googleusercontent.com/r/wrong' },
  ]) {
    const denied = await exchange(context, flow, fields);
    assert.ok(denied.status >= 400);
    assert.ok(!(await denied.text()).includes('access_token'));
  }
  const redeemed = await Promise.all([exchange(context, flow), exchange(context, flow)]);
  assert.deepEqual(redeemed.map(r => r.status).sort(), [200, 400]);
  const issued = await redeemed.find(r => r.ok).json();
  assert.ok(issued.expires_in > 0);
  assert.equal(issued.token_type.toLowerCase(), 'bearer');
  assert.equal(verifyAccess(issued.access_token, context), true);
  assert.equal(verifyAccess(issued.access_token, { ...context, origin: 'https://other.example' }), false);
  assert.equal(verifyAccess(issued.access_token + 'x', context), false);
});

test('authenticated relay forwards the upstream catalog, pagination and new tool calls', async () => {
  const { context, token } = await authenticatedFixture();
  const requests = [
    rpc(1, 'tools/list', { cursor: 'next' }),
    rpc(2, 'tools/call', { name: 'future_upstream_tool', arguments: { arbitrary: true } }),
  ];
  for (const body of requests) {
    const clientHeaders = {
      authorization: 'Bearer ' + token, 'content-type': 'application/json',
      'mcp-session-id': 'kaggle-session', 'mcp-protocol-version': protocol,
      cookie: 'private-cookie=sent-by-browser', 'x-forwarded-host': 'untrusted.example',
    };
    const result = body.method === 'tools/list' ? { tools, nextCursor: 'later' }
      : { content: [{ type: 'text', text: 'ok' }] };
    context.fetchImpl = async (url, init) => {
      assert.equal(url, 'https://www.kaggle.com/mcp');
      assert.equal(init.redirect, 'error');
      assert.equal(init.headers.get('authorization'), 'Bearer ' + context.kaggleToken);
      assert.equal(init.headers.get('mcp-session-id'), 'kaggle-session');
      assert.equal(init.headers.get('mcp-protocol-version'), protocol);
      assert.equal(init.headers.get('cookie'), null);
      assert.equal(init.headers.get('x-forwarded-host'), null);
      assert.deepEqual(JSON.parse(init.body.toString()), body);
      return Response.json({ jsonrpc: '2.0', id: body.id, result }, { headers: {
        'set-cookie': 'upstream-session=secret', 'mcp-session-id': 'session2',
        'x-debug': context.kaggleToken,
      } });
    };
    const response = await mcp(request('/mcp?ignored=1', 'POST', clientHeaders, JSON.stringify(body)), context);
    assert.equal(response.status, 200);
    assert.equal(response.headers.get('mcp-session-id'), 'session2');
    assert.equal(response.headers.get('set-cookie'), null);
    assert.equal(response.headers.get('x-debug'), null);
    assert.deepEqual((await response.json()).result, result);
  }
});

test('SSE, upstream authentication errors and split credential echoes', async () => {
  const { context, token } = await authenticatedFixture();
  const client = () => request('/mcp', 'GET', { authorization: 'Bearer ' + token, 'last-event-id': '17' });
  const event = 'id: 18\nevent: message\ndata: {"ok":true}\n\n';
  context.fetchImpl = async (_url, init) => {
    assert.equal(init.headers.get('accept'), 'text/event-stream');
    assert.equal(init.headers.get('last-event-id'), '17');
    return new Response(event, { headers: { 'content-type': 'text/event-stream' } });
  };
  const stream = await mcp(client(), context);
  assert.match(stream.headers.get('content-type'), /^text\/event-stream/);
  assert.equal(await stream.text(), event);

  context.fetchImpl = () => new Response(context.kaggleToken, { status: 401, headers: {
    'www-authenticate': 'Bearer ' + context.kaggleToken,
  } });
  const error = await mcp(client(), context);
  assert.equal(error.status, 502);
  assert.equal(error.headers.get('www-authenticate'), null);
  assert.ok(!(await error.text()).includes(context.kaggleToken));

  context.fetchImpl = () => new Response(new ReadableStream({
    start(controller) {
      controller.enqueue(Buffer.from('data: ' + context.kaggleToken.slice(0, 12)));
      controller.enqueue(Buffer.from(context.kaggleToken.slice(12) + '\n\n'));
      controller.close();
    },
  }), { headers: { 'content-type': 'text/event-stream', 'mcp-session-id': context.kaggleToken } });
  const unsafe = await mcp(client(), context);
  assert.equal(unsafe.headers.get('mcp-session-id'), null);
  const reader = unsafe.body.getReader();
  const seen = [];
  await assert.rejects(async () => {
    for (;;) {
      const { value, done } = await reader.read();
      if (done) break;
      seen.push(value);
    }
  });
  assert.ok(!Buffer.concat(seen).toString().includes(context.kaggleToken));
});

test('confidential client can refresh after access expiry, within its original grant', async (t) => {
  const context = fixture();
  const flow = await authorize(context, { grant_types: ['authorization_code', 'refresh_token'] });
  const issued = await (await exchange(context, flow)).json();
  assert.ok(issued.refresh_token);
  assert.equal(verifyAccess(issued.refresh_token, context), false);
  const later = Date.now() + (issued.expires_in + 1) * 1000;
  t.mock.method(Date, 'now', () => later);
  assert.equal(verifyAccess(issued.access_token, context), false);
  const refresh = fields => oauth(request('/oauth/token', 'POST', formHeaders, new URLSearchParams({
    grant_type: 'refresh_token', refresh_token: issued.refresh_token, client_id: flow.client.client_id,
    client_secret: flow.client.client_secret, resource, ...fields,
  })), context);
  const renewed = await refresh({});
  assert.equal(renewed.status, 200);
  assert.equal(verifyAccess((await renewed.json()).access_token, context), true);
  const freshClient = await (await register(context, { grant_types: ['authorization_code', 'refresh_token'] })).json();
  for (const wrong of [
    { client_id: freshClient.client_id, client_secret: freshClient.client_secret },
    { resource: 'https://other.example/mcp' },
    { scope: 'new_scope' },
  ]) {
    const denied = await refresh(wrong);
    assert.ok(denied.status >= 400);
  }
});
