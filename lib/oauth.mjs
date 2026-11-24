import { createHash, createHmac, randomBytes, timingSafeEqual } from 'node:crypto';

export const SCOPES = Object.freeze(['kaggle', 'ACCESS_VIEW_MANAGE_MCP_CONTENT']);
const AUTH_METHODS = ['client_secret_basic', 'client_secret_post', 'none'];
const ACCESS_SECONDS = 15 * 60;
const REFRESH_SECONDS = 30 * 24 * 60 * 60;
const MAX_BODY = 24 * 1024;
const CONSENT_STYLE = `
  :root { color-scheme: light dark; font: 100%/1.55 system-ui, sans-serif; }
  body { margin: 0; padding: clamp(1rem, 5vw, 5rem) 1rem; }
  main { max-width: 33rem; margin: 0 auto; }
  h1 { font-size: 1.85rem; line-height: 1.2; }
  code { display: block; overflow-wrap: anywhere; padding: .6rem; border: 1px solid GrayText; }
  label { display: block; font-weight: 600; }
  input { box-sizing: border-box; width: 100%; padding: .65rem; }
  button { margin: .25rem .5rem .25rem 0; padding: .6rem 1rem; cursor: pointer; }
  button, input { font: inherit; }
`;
const STYLE_HASH = createHash('sha256').update(CONSENT_STYLE).digest('base64');
const NO_STORE = {
  'cache-control': 'no-store',
  'pragma': 'no-cache',
  'referrer-policy': 'no-referrer',
  'x-content-type-options': 'nosniff',
  'x-frame-options': 'DENY',
};

const now = () => Math.floor(Date.now() / 1000);
const nonce = () => randomBytes(16).toString('base64url');
const digest = (value) => createHash('sha256').update(value).digest('base64url');
const secureEqual = (a, b) => typeof a === 'string' && typeof b === 'string' &&
  timingSafeEqual(createHash('sha256').update(a).digest(), createHash('sha256').update(b).digest());

function json(value, status = 200, headers = {}) {
  return Response.json(value, { status, headers: { ...NO_STORE, ...headers } });
}

class OAuthError extends Error {
  constructor(code, status = 400) {
    super(code);
    this.status = status;
  }
}

function requireValue(condition, code = 'invalid_request', status = 400) {
  if (!condition) throw new OAuthError(code, status);
}

function mac(config, type, data) {
  return createHmac('sha256', config.signingKey)
    .update(config.origin).update('\0').update(type).update('\0').update(data)
    .digest('base64url');
}

function seal(config, type, data) {
  const body = Buffer.from(JSON.stringify(data)).toString('base64url');
  return body + '.' + mac(config, type, body);
}

function open(config, type, token) {
  if (typeof token !== 'string' || token.length > 16384) return null;
  const parts = /^([A-Za-z0-9_-]+)\.([A-Za-z0-9_-]{43})$/.exec(token);
  if (!parts || !secureEqual(parts[2], mac(config, type, parts[1]))) return null;
  try {
    const data = JSON.parse(Buffer.from(parts[1], 'base64url').toString('utf8'));
    if (data.exp !== undefined && (!Number.isSafeInteger(data.exp) || data.exp <= now())) return null;
    return data;
  } catch {
    return null;
  }
}

function validSecret(value) {
  return typeof value === 'string' && /^[A-Za-z0-9_-]{43,256}$/.test(value);
}

function validOrigin(origin) {
  try {
    const url = new URL(origin);
    return url.protocol === 'https:' && url.origin === origin;
  } catch {
    return false;
  }
}

async function readBody(request, type) {
  requireValue(request.headers.get('content-type')?.split(';')[0].trim().toLowerCase() === type,
    'invalid_request', 415);
  requireValue(Number(request.headers.get('content-length') || 0) <= MAX_BODY, 'invalid_request', 413);
  const reader = request.body?.getReader();
  requireValue(reader);
  const chunks = [];
  let size = 0;
  for (;;) {
    const { value, done } = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > MAX_BODY) {
      await reader.cancel();
      throw new OAuthError('invalid_request', 413);
    }
    chunks.push(value);
  }
  return Buffer.concat(chunks, size).toString('utf8');
}

function uniqueParams(params) {
  const seen = new Set();
  for (const key of params.keys()) {
    requireValue(!seen.has(key));
    seen.add(key);
  }
  return params;
}

async function form(request) {
  return uniqueParams(new URLSearchParams(await readBody(request, 'application/x-www-form-urlencoded')));
}

function metadata({ origin }) {
  return {
    issuer: origin,
    authorization_endpoint: origin + '/oauth/authorize',
    token_endpoint: origin + '/oauth/token',
    registration_endpoint: origin + '/oauth/register',
    response_types_supported: ['code'],
    grant_types_supported: ['authorization_code', 'refresh_token'],
    token_endpoint_auth_methods_supported: AUTH_METHODS,
    code_challenge_methods_supported: ['S256'],
    scopes_supported: SCOPES,
  };
}

function googleRedirect(uri) {
  if (typeof uri !== 'string' || uri.length > 512) return false;
  try {
    const url = new URL(uri);
    return url.href === uri && url.protocol === 'https:' && !url.port && !url.username &&
      !url.password && !url.search && !url.hash &&
      /^oauth-redirect(?:-test|-sandbox)?\.googleusercontent\.com$/.test(url.hostname) &&
      /^\/(?:r|a)\/(?:[A-Za-z0-9._~-]+\/)*[A-Za-z0-9._~-]+$/.test(url.pathname);
  } catch {
    return false;
  }
}

function scopeValue(value) {
  if (value === null || value === undefined) return SCOPES[0];
  requireValue(typeof value === 'string' && value.length > 0 && value.length <= 128, 'invalid_scope');
  const parts = value.split(' ');
  requireValue(parts.every(scope => SCOPES.includes(scope)), 'invalid_scope');
  return [...new Set(parts)].join(' ');
}

async function register(request, config) {
  const raw = await readBody(request, 'application/json');
  let data;
  try { data = JSON.parse(raw); } catch { throw new OAuthError('invalid_client_metadata'); }
  requireValue(data && typeof data === 'object' && !Array.isArray(data), 'invalid_client_metadata');
  const redirects = data.redirect_uris;
  requireValue(Array.isArray(redirects) && redirects.length > 0 && redirects.length <= 8 &&
    redirects.every(googleRedirect) && new Set(redirects).size === redirects.length, 'invalid_redirect_uri');
  const auth = data.token_endpoint_auth_method ?? 'client_secret_basic';
  requireValue(AUTH_METHODS.includes(auth), 'invalid_client_metadata');
  const grants = data.grant_types ?? ['authorization_code'];
  requireValue(Array.isArray(grants) && grants.includes('authorization_code') &&
    grants.every(value => value === 'authorization_code' || value === 'refresh_token'), 'invalid_client_metadata');
  const responses = data.response_types ?? ['code'];
  requireValue(Array.isArray(responses) && responses.length === 1 && responses[0] === 'code', 'invalid_client_metadata');
  const scope = data.scope === undefined ? SCOPES.join(' ') : scopeValue(data.scope);
  const refresh = grants.includes('refresh_token') && auth !== 'none';
  const clientId = seal(config, 'client', { id: nonce(), redirects, auth, refresh, scope });
  const result = {
    client_id: clientId,
    client_id_issued_at: now(),
    redirect_uris: redirects,
    token_endpoint_auth_method: auth,
    grant_types: refresh ? ['authorization_code', 'refresh_token'] : ['authorization_code'],
    response_types: ['code'],
    scope,
  };
  if (auth !== 'none') {
    result.client_secret = mac(config, 'client-secret', clientId);
    result.client_secret_expires_at = 0;
  }
  return json(result, 201);
}

function requireTarget(value, config) {
  // There is exactly one resource. Bind the same audience when the client omits resource.
  requireValue(value === null || value === config.origin + '/mcp', 'invalid_target');
}

function cookieName(id) {
  return '__Host-kaggle-consent-' + id;
}

function cookie(id, value, age) {
  return cookieName(id) + '=' + value + '; Path=/; Secure; HttpOnly; SameSite=Lax; Max-Age=' + age;
}

function clientScope(requested, client) {
  const value = requested === null ? client.scope.split(' ')[0] : scopeValue(requested);
  requireValue(value.split(' ').every(scope => client.scope.split(' ').includes(scope)), 'invalid_scope');
  return value;
}

function escapeHtml(value) {
  return value.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
}

function consentPage(request, config) {
  const p = uniqueParams(new URL(request.url).searchParams);
  const client = open(config, 'client', p.get('client_id'));
  requireValue(client, 'invalid_client');
  requireValue(client.redirects.includes(p.get('redirect_uri')), 'invalid_redirect_uri');
  requireValue(p.get('response_type') === 'code', 'unsupported_response_type');
  requireValue(p.get('code_challenge_method') === 'S256' && /^[A-Za-z0-9_-]{43}$/.test(p.get('code_challenge') ?? ''));
  requireTarget(p.get('resource'), config);
  const state = p.get('state');
  requireValue(state === null || state.length <= 2048);
  const id = nonce();
  const proof = randomBytes(32).toString('base64url');
  const transaction = seal(config, 'consent', {
    id, exp: now() + 600, cookieHash: digest(proof), client: digest(p.get('client_id')),
    redirect: p.get('redirect_uri'), challenge: p.get('code_challenge'),
    scope: clientScope(p.get('scope'), client), state,
  });
  return renderConsent(transaction, p.get('redirect_uri'), { 'set-cookie': cookie(id, proof, 600) });
}

function renderConsent(transaction, redirect, headers = {}, retry = false) {
  const page = `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>Connect Kaggle to Gemini</title><style>${CONSENT_STYLE}</style></head><body>
<main><h1>Connect Kaggle to Gemini</h1>
<p>Approve only a connection you started in Gemini. Approval gives this connection access to every tool available to your Kaggle account, including tools that create, change, or delete Kaggle resources.</p>
<p>Google callback for this connection <code>${escapeHtml(redirect)}</code></p>
<form method="post" action="/oauth/authorize">
<input type="hidden" name="transaction" value="${transaction}">
${retry ? '<p role="alert">The password did not match. Copy the value of BRIDGE_OWNER_PASSWORD from the Production environment in Vercel, then try again.</p>' : ''}
<p><label>Bridge owner password <input type="password" name="password" autocomplete="current-password" required></label></p>
<button type="submit" name="decision" value="allow">Allow access</button>
<button type="submit" name="decision" value="deny" formnovalidate>Cancel</button>
</form></main></body></html>`;
  return new Response(page, { status: retry ? 403 : 200, headers: {
    ...NO_STORE, 'content-type': 'text/html; charset=utf-8',
    // Native HTML form POSTs need a non-opaque Origin. Send no URL path or query as referrer.
    'referrer-policy': 'strict-origin',
    // Gemini's callback navigates across Google origins after form submission.
    'content-security-policy': "default-src 'none'; base-uri 'none'; frame-ancestors 'none'; style-src 'sha256-" + STYLE_HASH + "'",
    ...headers,
  } });
}

function redirectResult(tx, params) {
  const target = new URL(tx.redirect);
  for (const [key, value] of Object.entries(params)) target.searchParams.set(key, value);
  if (tx.state !== null) target.searchParams.set('state', tx.state);
  return new Response(null, { status: 303, headers: {
    ...NO_STORE, location: target.href, 'set-cookie': cookie(tx.id, '', 0),
  } });
}

async function decideConsent(request, config) {
  requireValue(request.headers.get('origin') === config.origin, 'access_denied', 403);
  const p = await form(request);
  const transaction = p.get('transaction');
  const tx = open(config, 'consent', transaction);
  requireValue(tx, 'access_denied', 403);
  const prefix = cookieName(tx.id) + '=';
  const matches = (request.headers.get('cookie') ?? '').split(';').map(s => s.trim()).filter(s => s.startsWith(prefix));
  requireValue(matches.length === 1 && secureEqual(tx.cookieHash, digest(matches[0].slice(prefix.length))), 'access_denied', 403);
  const decision = p.get('decision');
  requireValue(decision === 'allow' || decision === 'deny');
  if (decision === 'deny') return redirectResult(tx, { error: 'access_denied' });
  if (!secureEqual(p.get('password')?.trim(), config.ownerPassword)) {
    if (request.headers.get('accept')?.includes('text/html')) {
      return renderConsent(transaction, tx.redirect, {}, true);
    }
    throw new OAuthError('access_denied', 403);
  }
  requireValue(await config.consume('consent:' + tx.id, tx.exp), 'access_denied', 403);
  const code = seal(config, 'code', {
    id: nonce(), exp: now() + 120, client: tx.client, redirect: tx.redirect,
    challenge: tx.challenge, scope: tx.scope, aud: config.origin + '/mcp',
  });
  return redirectResult(tx, { code });
}

function tokenClient(request, p, config) {
  let id = p.get('client_id');
  let secret = p.get('client_secret');
  let method = secret === null ? 'none' : 'client_secret_post';
  const header = request.headers.get('authorization');
  if (header !== null) {
    requireValue(secret === null, 'invalid_client', 401);
    const match = /^Basic ([A-Za-z0-9+/]+=*)$/i.exec(header);
    requireValue(match, 'invalid_client', 401);
    const raw = Buffer.from(match[1], 'base64').toString('utf8');
    const split = raw.indexOf(':');
    requireValue(split > 0, 'invalid_client', 401);
    // Issued client IDs and secrets contain only unreserved characters.
    const basicId = raw.slice(0, split);
    requireValue(id === null || id === basicId, 'invalid_client', 401);
    id = basicId;
    secret = raw.slice(split + 1);
    method = 'client_secret_basic';
  }
  const client = open(config, 'client', id);
  requireValue(client && client.auth === method, 'invalid_client', 401);
  if (method !== 'none') requireValue(secureEqual(secret, mac(config, 'client-secret', id)), 'invalid_client', 401);
  return { ...client, hash: digest(id) };
}

function accessToken(config, scope, client) {
  return seal(config, 'access', { exp: now() + ACCESS_SECONDS, aud: config.origin + '/mcp', client, scope, jti: nonce() });
}

export function verifyAccess(token, { origin, signingKey }) {
  if (!validOrigin(origin) || !validSecret(signingKey)) return false;
  const value = open({ origin, signingKey }, 'access', token);
  return Boolean(value && value.aud === origin + '/mcp' && Number.isSafeInteger(value.exp) &&
    typeof value.scope === 'string' && value.scope.split(' ').every(scope => SCOPES.includes(scope)));
}

async function exchange(request, config) {
  const p = await form(request);
  const client = tokenClient(request, p, config);
  requireTarget(p.get('resource'), config);
  const aud = config.origin + '/mcp';
  let scope;
  let refresh;
  if (p.get('grant_type') === 'authorization_code') {
    const code = open(config, 'code', p.get('code'));
    const verifier = p.get('code_verifier') ?? '';
    requireValue(code && code.client === client.hash && code.aud === aud &&
      code.redirect === p.get('redirect_uri') && /^[A-Za-z0-9._~-]{43,128}$/.test(verifier) &&
      secureEqual(digest(verifier), code.challenge), 'invalid_grant');
    requireValue(await config.consume('code:' + code.id, code.exp), 'invalid_grant');
    scope = code.scope;
    if (client.refresh) {
      refresh = seal(config, 'refresh', { exp: now() + REFRESH_SECONDS, client: client.hash, aud, scope, jti: nonce() });
    }
  } else if (p.get('grant_type') === 'refresh_token') {
    requireValue(client.refresh, 'unauthorized_client');
    refresh = p.get('refresh_token');
    const grant = open(config, 'refresh', refresh);
    requireValue(grant && grant.aud === aud && grant.client === client.hash, 'invalid_grant');
    scope = p.has('scope') ? scopeValue(p.get('scope')) : grant.scope;
    requireValue(scope.split(' ').every(item => grant.scope.split(' ').includes(item)), 'invalid_scope');
  } else {
    throw new OAuthError('unsupported_grant_type');
  }
  return json({
    access_token: accessToken(config, scope, client.hash), token_type: 'Bearer', expires_in: ACCESS_SECONDS,
    scope, ...(refresh ? { refresh_token: refresh } : {}),
  });
}

export async function oauth(request, config) {
  try {
    requireValue(validOrigin(config.origin) && validSecret(config.signingKey) && validSecret(config.ownerPassword) &&
      typeof config.consume === 'function', 'temporarily_unavailable', 503);
    const path = new URL(request.url).pathname;
    const methods = {
      '/.well-known/oauth-authorization-server': 'GET, HEAD',
      '/oauth/register': 'POST', '/oauth/authorize': 'GET, POST', '/oauth/token': 'POST',
    };
    const allow = methods[path];
    if (!allow) return json({ error: 'not_found' }, 404);
    if (!allow.split(', ').includes(request.method)) return json({ error: 'invalid_request' }, 405, { allow });
    if (path === '/.well-known/oauth-authorization-server') {
      const response = json(metadata(config), 200, { 'access-control-allow-origin': '*' });
      return request.method === 'HEAD' ? new Response(null, { headers: response.headers }) : response;
    }
    if (path === '/oauth/register') return await register(request, config);
    if (path === '/oauth/token') return await exchange(request, config);
    return request.method === 'GET' ? consentPage(request, config) : await decideConsent(request, config);
  } catch (error) {
    if (error instanceof OAuthError) {
      const headers = error.status === 401 ? { 'www-authenticate': 'Basic realm="Kaggle MCP"' } : {};
      return json({ error: error.message }, error.status, headers);
    }
    return json({ error: 'temporarily_unavailable' }, 503);
  }
}
