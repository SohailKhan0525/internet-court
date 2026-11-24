import { consume } from '../lib/consume.mjs';
import { mcp } from '../lib/mcp.mjs';
import { oauth } from '../lib/oauth.mjs';

// Production is a single OAuth issuer. Never build endpoints from request headers.
const origin = 'https://internet-court-tau.vercel.app';
const mcpPaths = new Set([
  '/mcp',
  '/.well-known/oauth-protected-resource',
  '/.well-known/oauth-protected-resource/mcp',
]);

export default {
  async fetch(request) {
    const url = new URL(request.url);
    if (url.origin !== origin) {
      return new Response('Use the production URL.', { status: 404 });
    }
    const signingKey = process.env.BRIDGE_SIGNING_KEY;
    const ownerPassword = process.env.BRIDGE_OWNER_PASSWORD;
    if (!signingKey || !ownerPassword || signingKey.length < 43 || ownerPassword.length < 43) {
      return Response.json({ error: 'service_unavailable' }, {
        status: 503, headers: { 'Cache-Control': 'no-store' },
      });
    }
    try {
      if (mcpPaths.has(url.pathname)) {
        return await mcp(request, { origin, signingKey, kaggleToken: process.env.KAGGLE_API_TOKEN });
      }
      return await oauth(request, { origin, signingKey, ownerPassword, consume });
    } catch {
      // Avoid reflecting upstream responses, cookie values, credentials or stacks on failure.
      return Response.json({ error: 'temporarily_unavailable' }, {
        status: 503, headers: { 'Cache-Control': 'no-store' },
      });
    }
  },
};
