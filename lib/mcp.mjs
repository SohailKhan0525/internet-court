import { Buffer } from 'node:buffer';
import { SCOPES, verifyAccess } from './oauth.mjs';

const UPSTREAM = 'https://www.kaggle.com/mcp';
const METADATA = '/.well-known/oauth-protected-resource';
const MAX_BYTES = 4_500_000;
const METHODS = 'GET, POST, DELETE, OPTIONS';
const REQUEST_HEADERS = new Set([
  'mcp-protocol-version', 'mcp-session-id', 'last-event-id', 'mcp-method', 'mcp-name'
]);
const RESPONSE_HEADERS = ['mcp-session-id', 'mcp-protocol-version', 'retry-after', 'allow'];

function allowedHeader(name) {
  return REQUEST_HEADERS.has(name) || /^mcp-param-[a-z0-9-]+$/.test(name);
}

function errorResponse(status, message, headers) {
  return Response.json({ error: message }, { status, headers });
}

class SizeLimit extends Error {}

async function readRequest(request) {
  if (Number(request.headers.get('content-length')) > MAX_BYTES) throw new SizeLimit();
  if (!request.body) return Buffer.alloc(0);
  const reader = request.body.getReader();
  const chunks = [];
  let size = 0;
  try {
    for (;;) {
      const { value, done } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > MAX_BYTES) {
        await reader.cancel();
        throw new SizeLimit();
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }
  return Buffer.concat(chunks, size);
}

// Kaggle is the only recipient of the service credential. Fail closed even if
// a response unexpectedly echoes it, including across stream chunk boundaries.
function protectedStream(body, token) {
  const secret = Buffer.from(token);
  let pending = Buffer.alloc(0);
  let size = 0;
  return body.pipeThrough(new TransformStream({
    transform(chunk, controller) {
      size += chunk.byteLength;
      if (size > MAX_BYTES) throw new Error('Upstream response exceeded limit');
      const bytes = pending.length ? Buffer.concat([pending, chunk]) : Buffer.from(chunk);
      if (bytes.includes(secret)) throw new Error('Unsafe upstream response');
      // Forward complete SSE events promptly. Hold only a suffix which could
      // become the credential if the next chunk completes it.
      let start = Math.max(0, bytes.length - secret.length + 1);
      while (start < bytes.length) {
        start = bytes.indexOf(secret[0], start);
        if (start < 0) { start = bytes.length; break; }
        if (secret.subarray(0, bytes.length - start).equals(bytes.subarray(start))) break;
        start++;
      }
      if (start) controller.enqueue(bytes.subarray(0, start));
      pending = bytes.subarray(start);
    },
    flush(controller) {
      if (pending.length) controller.enqueue(pending);
    }
  }));
}

export async function mcp(request, { origin, signingKey, kaggleToken, fetchImpl = fetch }) {
  const path = new URL(request.url).pathname;
  const headers = new Headers({
    'cache-control': 'private, no-store, no-transform',
    'x-content-type-options': 'nosniff',
    'vary': 'Origin'
  });
  const resource = origin + '/mcp';
  if (path === METADATA || path === METADATA + '/mcp') {
    headers.set('access-control-allow-origin', '*');
    if (request.method !== 'GET' && request.method !== 'HEAD') {
      headers.set('allow', 'GET, HEAD');
      return errorResponse(405, 'Method not allowed', headers);
    }
    const metadata = {
      resource,
      resource_name: 'Kaggle MCP bridge',
      authorization_servers: [origin],
      scopes_supported: SCOPES,
      bearer_methods_supported: ['header']
    };
    headers.set('content-type', 'application/json');
    return new Response(request.method === 'HEAD' ? null : JSON.stringify(metadata), { headers });
  }
  if (path !== '/mcp') return errorResponse(404, 'Not found', headers);
  const callerOrigin = request.headers.get('origin');
  if (callerOrigin !== null) {
    if (callerOrigin !== origin && callerOrigin !== 'https://gemini.google.com') {
      return errorResponse(403, 'Origin is not allowed', headers);
    }
    headers.set('access-control-allow-origin', callerOrigin);
    headers.set('access-control-expose-headers', 'WWW-Authenticate, Mcp-Session-Id, Mcp-Protocol-Version, Retry-After');
  }
  if (request.method === 'OPTIONS') {
    const requested = (request.headers.get('access-control-request-headers') || '')
      .split(',').map(x => x.trim().toLowerCase()).filter(Boolean);
    if (requested.some(name => !['accept', 'authorization', 'content-type'].includes(name) && !allowedHeader(name))) {
      return errorResponse(403, 'Header is not allowed', headers);
    }
    headers.set('access-control-allow-methods', METHODS);
    headers.set('access-control-allow-headers', requested.join(', '));
    return new Response(null, { status: 204, headers });
  }
  if (!['GET', 'POST', 'DELETE'].includes(request.method)) {
    headers.set('allow', METHODS);
    return errorResponse(405, 'Method not allowed', headers);
  }
  const authorization = request.headers.get('authorization') || '';
  const bearer = authorization.length <= 8192 && /^Bearer ([A-Za-z0-9._~+/=-]+)$/i.exec(authorization);
  if (!bearer || !verifyAccess(bearer[1], { origin, signingKey })) {
    const challenge = 'Bearer resource_metadata="' + origin + METADATA + '/mcp", scope="kaggle"';
    headers.set('www-authenticate', authorization ? challenge + ', error="invalid_token"' : challenge);
    return errorResponse(401, 'Authorization required', headers);
  }
  if (!kaggleToken || /[^\x21-\x7e]/.test(kaggleToken)) {
    return errorResponse(503, 'Kaggle credentials are unavailable', headers);
  }
  const upstreamHeaders = new Headers({
    'authorization': 'Bearer ' + kaggleToken,
    'accept': request.method === 'GET' ? 'text/event-stream' : 'application/json, text/event-stream'
  });
  for (const [name, value] of request.headers) {
    if (allowedHeader(name)) upstreamHeaders.set(name, value);
  }
  let body;
  if (request.method === 'POST') {
    const type = request.headers.get('content-type')?.split(';')[0].trim().toLowerCase();
    const encoding = request.headers.get('content-encoding')?.toLowerCase();
    if (type !== 'application/json' || (encoding && encoding !== 'identity')) {
      return errorResponse(415, 'Expected an uncompressed application/json body', headers);
    }
    upstreamHeaders.set('content-type', 'application/json');
    try {
      body = await readRequest(request);
    } catch (error) {
      return error instanceof SizeLimit
        ? errorResponse(413, 'Request exceeds the hosting limit', headers)
        : errorResponse(400, 'Could not read request', headers);
    }
  }
  const deadline = AbortSignal.timeout(55_000);
  let upstream;
  try {
    upstream = await fetchImpl(UPSTREAM, {
      method: request.method, headers: upstreamHeaders, body,
      redirect: 'error', cache: 'no-store',
      signal: AbortSignal.any([request.signal, deadline])
    });
  } catch {
    return errorResponse(deadline.aborted ? 504 : 502, 'Kaggle MCP is unavailable', headers);
  }
  const type = upstream.headers.get('content-type')?.split(';')[0].trim().toLowerCase();
  const safeType = type === 'application/json' || type === 'text/event-stream';
  if (upstream.status === 401 || upstream.status === 403 || (upstream.status >= 300 && upstream.status < 400)) {
    await upstream.body?.cancel();
    return errorResponse(502, 'Kaggle declined the upstream request', headers);
  }
  for (const name of RESPONSE_HEADERS) {
    const value = upstream.headers.get(name);
    if (value && !value.includes(kaggleToken)) headers.set(name, value);
  }
  if (!upstream.body || (upstream.status === 202 && !type) || upstream.headers.get('content-length') === '0') {
    await upstream.body?.cancel();
    return new Response(null, { status: upstream.status, headers });
  }
  if (!safeType || Number(upstream.headers.get('content-length')) > MAX_BYTES) {
    await upstream.body.cancel();
    return errorResponse(upstream.ok ? 502 : upstream.status, 'Kaggle returned an unsupported response', headers);
  }
  headers.set('content-type', type + '; charset=utf-8');
  return new Response(protectedStream(upstream.body, kaggleToken), { status: upstream.status, headers });
}
