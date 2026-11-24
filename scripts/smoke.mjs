// Run with Node 24. Supply the owner password through stdin or BRIDGE_OWNER_PASSWORD.
import { createHash, randomBytes } from 'node:crypto';

const origin = 'https://internet-court-tau.vercel.app';
const resource = origin + '/mcp';
const callback = 'https://oauth-redirect.googleusercontent.com/r/kaggle-bridge-smoke-test';
const metadata = '/.well-known/oauth-protected-resource/mcp';
const random = () => randomBytes(32).toString('base64url');
const json = { 'content-type': 'application/json' };
let stage = 'public discovery';
let httpStatus;
class SmokeFailure extends Error {}

function check(condition, reason = 'unexpected response') {
  if (!condition) throw new SmokeFailure(reason);
}
function start(name) {
  stage = name;
  httpStatus = undefined;
}
function pass(detail = '') {
  console.log(`${stage} passed${detail ? ' (' + detail + ')' : ''}`);
}
async function request(path, init = {}) {
  const target = new URL(path, origin);
  check(target.origin === origin, 'unexpected destination');
  httpStatus = undefined;
  const response = await fetch(target, {
    ...init, redirect: 'manual', signal: AbortSignal.timeout(35_000),
  });
  httpStatus = response.status;
  return response;
}
async function getJson(response, status) {
  check(response.status === status);
  return response.json();
}

async function discovery() {
  const denied = await request('/mcp');
  check(denied.status === 401);
  check(denied.headers.get('www-authenticate')?.includes('resource_metadata="' + origin + metadata + '"'));
  for (const path of [metadata, '/.well-known/oauth-protected-resource']) {
    const data = await getJson(await request(path), 200);
    check(data.resource === resource && data.authorization_servers?.includes(origin));
    check(data.scopes_supported?.includes('kaggle'));
  }
  const auth = await getJson(await request('/.well-known/oauth-authorization-server'), 200);
  check(auth.issuer === origin && auth.registration_endpoint === origin + '/oauth/register'
    && auth.authorization_endpoint === origin + '/oauth/authorize'
    && auth.token_endpoint === origin + '/oauth/token' && auth.code_challenge_methods_supported?.includes('S256'));
  pass();
}

async function ownerPassword() {
  const fromEnv = process.env.BRIDGE_OWNER_PASSWORD;
  if (fromEnv) return fromEnv;
  check(!process.stdin.isTTY, 'supply the owner password through stdin or the environment');
  let buffer = '';
  for await (const chunk of process.stdin) {
    buffer += chunk.toString('utf8');
    check(buffer.length <= 512, 'invalid password input');
  }
  const value = buffer.trimEnd();
  check(value.length > 0, 'missing owner password');
  return value;
}

async function authorize() {
  start('client registration');
  const client = await getJson(await request('/oauth/register', {
    method: 'POST', headers: json, body: JSON.stringify({
      client_name: 'Kaggle bridge smoke test', redirect_uris: [callback],
      grant_types: ['authorization_code'], response_types: ['code'],
      token_endpoint_auth_method: 'client_secret_basic',
    }),
  }), 201);
  check(client.client_id && client.client_secret);
  pass();

  start('owner consent');
  const verifier = random();
  const state = random();
  const params = new URLSearchParams({
    client_id: client.client_id, redirect_uri: callback, state, resource,
    response_type: 'code', scope: 'ACCESS_VIEW_MANAGE_MCP_CONTENT', code_challenge_method: 'S256',
    code_challenge: createHash('sha256').update(verifier).digest('base64url'),
  });
  const page = await request('/oauth/authorize?' + params);
  check(page.status === 200);
  const cookie = page.headers.get('set-cookie');
  const transaction = /name="transaction" value="([\w.-]+)"/.exec(await page.text())?.[1];
  check(transaction && cookie?.startsWith('__Host-') && /; Secure\b/i.test(cookie) && /; HttpOnly\b/i.test(cookie));
  const response = await request('/oauth/authorize', {
    method: 'POST', headers: { origin, cookie: cookie.split(';')[0] },
    body: new URLSearchParams({ transaction, decision: 'allow', password: await ownerPassword() }),
  });
  check(response.status === 303);
  // Inspect the redirect locally. No request is ever sent to the callback.
  const redirected = new URL(response.headers.get('location'));
  const code = redirected.searchParams.get('code');
  check(redirected.origin + redirected.pathname === callback && redirected.searchParams.get('state') === state && code);
  pass();

  const basic = Buffer.from(client.client_id + ':' + client.client_secret).toString('base64');
  const exchange = codeVerifier => request('/oauth/token', {
    method: 'POST', headers: { authorization: 'Basic ' + basic },
    body: new URLSearchParams({ grant_type: 'authorization_code', code, code_verifier: codeVerifier, redirect_uri: callback, resource }),
  });
  start('PKCE verification');
  const invalid = await getJson(await exchange(random()), 400);
  check(invalid.error === 'invalid_grant');
  const grant = await getJson(await exchange(verifier), 200);
  check(grant.access_token && grant.token_type?.toLowerCase() === 'bearer' && grant.expires_in > 0);
  pass();
  start('authorization code replay rejection');
  const replay = await getJson(await exchange(verifier), 400);
  check(replay.error === 'invalid_grant');
  pass();
  return grant.access_token;
}

// Kaggle can return one or more SSE events before closing its stream. Stop
// when the correlated result arrives, without waiting for a server heartbeat.
async function rpcResult(response, id) {
  const type = response.headers.get('content-type')?.split(';')[0];
  if (type === 'application/json') return response.json();
  check(type === 'text/event-stream');
  const reader = response.body.pipeThrough(new TextDecoderStream()).getReader();
  let buffer = '';
  let seen = 0;
  try {
    for (;;) {
      const { value, done } = await reader.read();
      if (done) break;
      seen += value.length;
      check(seen <= 4_500_000, 'MCP response too large');
      buffer += value;
      let boundary;
      while ((boundary = /\r?\n\r?\n/.exec(buffer))) {
        const event = buffer.slice(0, boundary.index);
        buffer = buffer.slice(boundary.index + boundary[0].length);
        const data = event.split(/\r?\n/).filter(line => line.startsWith('data:'))
          .map(line => line.slice(5).replace(/^ /, '')).join('\n');
        if (data) {
          const msg = JSON.parse(data);
          if (msg.id === id) return msg;
        }
      }
    }
    throw new SmokeFailure('MCP response missing');
  } finally {
    await reader.cancel();
  }
}

async function probeTools(access) {
  let sequence = 0;
  let protocol;
  let session;
  async function rpc(method, params, notification = false) {
    const id = notification ? undefined : ++sequence;
    const headers = { ...json, authorization: 'Bearer ' + access, accept: 'application/json, text/event-stream' };
    if (protocol) headers['mcp-protocol-version'] = protocol;
    if (session) headers['mcp-session-id'] = session;
    const response = await request('/mcp', {
      method: 'POST', headers, body: JSON.stringify({ jsonrpc: '2.0', id, method, params }),
    });
    if (response.status === 503) {
      const body = await response.json().catch(() => ({}));
      if (body.error === 'Kaggle credentials are unavailable') {
        throw new SmokeFailure('KAGGLE_API_TOKEN is missing or malformed in production');
      }
    }
    if (response.status === 502) throw new SmokeFailure('upstream Kaggle request failed');
    if (notification) {
      check(response.status === 202 || response.status === 204);
      return;
    }
    check(response.status === 200);
    const msg = await rpcResult(response, id);
    check(msg.jsonrpc === '2.0' && msg.id === id && !msg.error && msg.result && !msg.result.isError, 'MCP operation failed');
    session = response.headers.get('mcp-session-id') || session;
    return msg.result;
  }

  start('MCP initialization');
  const server = await rpc('initialize', {
    protocolVersion: '2025-11-25', capabilities: {}, clientInfo: { name: 'bridge-smoke-test', version: '1.0' },
  });
  protocol = server.protocolVersion;
  check(['2025-11-25', '2025-06-18', '2025-03-26'].includes(protocol) && server.capabilities?.tools);
  await rpc('notifications/initialized', {}, true);
  pass();

  start('complete tool discovery');
  const tools = new Map();
  const cursors = new Set();
  let cursor;
  do {
    const page = await rpc('tools/list', cursor ? { cursor } : {});
    check(Array.isArray(page.tools));
    for (const tool of page.tools) {
      check(typeof tool.name === 'string' && !tools.has(tool.name));
      tools.set(tool.name, tool);
    }
    cursor = page.nextCursor;
    if (cursor) {
      check(typeof cursor === 'string' && !cursors.has(cursor) && cursors.size < 128, 'invalid catalog pagination');
      cursors.add(cursor);
    }
  } while (cursor);
  check(tools.size > 0);
  pass(tools.size + ' tools');

  start('authenticated read-only Kaggle call');
  const quota = tools.get('get_accelerator_quota');
  const search = tools.get('search_competitions');
  check(quota || search, 'authenticated test tool unavailable');
  const tool = quota || search;
  const args = quota ? {} : { group: 'COMPETITION_LIST_TAB_ENTERED', page: 1, pageSize: 1 };
  const wrapped = tool.inputSchema?.properties?.request;
  const result = await rpc('tools/call', { name: tool.name, arguments: wrapped ? { request: args } : args });
  // HTTP 200 and a text item can both represent Kaggle errors. Require the
  // expected data shape and report only success, never the account's values.
  const structured = [];
  if (result.structuredContent) structured.push(result.structuredContent);
  for (const item of result.content || []) {
    if (item.type === 'text') {
      const value = item.text.trim().replace(/^```(?:json)?\s*|\s*```$/g, '');
      if (/^[\[{]/.test(value)) structured.push(JSON.parse(value));
    }
  }
  check(structured.some(value => {
    if (!value || typeof value !== 'object' || value.error || value.errorMessage || value.error_message) return false;
    if (!quota) return Array.isArray(value.competitions) || Array.isArray(value);
    return /"(?:[^"]*(?:quota|accelerator|gpu|tpu)[^"]*)"\s*:/i.test(JSON.stringify(value));
  }), 'Kaggle account result could not be verified');
  pass();
}

try {
  await discovery();
  await probeTools(await authorize());
} catch (error) {
  // Network, parse and assertion exceptions can include credentials, request
  // URLs or provider data. Print only our own fixed diagnostic messages.
  const reason = error instanceof SmokeFailure ? error.message : 'request or response processing failed';
  console.error(`${stage} failed${httpStatus ? ' (HTTP ' + httpStatus + ')' : ''}: ${reason}`);
  process.exitCode = 1;
}
