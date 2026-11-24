# Kaggle MCP bridge for Gemini

This personal MCP server connects Gemini to the owner's Kaggle account. It forwards MCP requests to Kaggle's official server at `https://www.kaggle.com/mcp`. Tool discovery, pagination and calls use Kaggle's live catalog. This includes tools that modify or delete resources and start notebook jobs.

## Connect from Gemini

1. Open **Settings → Connected Apps → Custom apps** in the [Gemini web app](https://gemini.google.com/).
2. Add `https://internet-court-tau.vercel.app/mcp`. Leave both OAuth credential fields blank. Gemini registers its own OAuth client.
3. On the bridge consent page, enter the separate `BRIDGE_OWNER_PASSWORD` from [Vercel project settings](https://vercel.com/qofenoai7093/internet-court/settings/environment-variables) and approve the connection. Only enter this password on the production bridge origin.

The bridge serves protected resource metadata at `/.well-known/oauth-protected-resource/mcp` and authorization server metadata at `/.well-known/oauth-authorization-server`. Registration, authorization and token exchange use `/oauth/register`, `/oauth/authorize` and `/oauth/token`. The primary scope is `kaggle`. Google chooses its callback when registering.

## Production settings

| Vercel setting | Purpose |
| --- | --- |
| `KAGGLE_API_TOKEN` | Kaggle's KGAT bearer token. Store as a Sensitive Production variable. Only the upstream HTTP authorization header uses it. |
| `BRIDGE_OWNER_PASSWORD` | A separate randomly generated 32-byte base64url secret. The project owner can reveal it in Vercel when granting access. |
| `BRIDGE_SIGNING_KEY` | A separate random base64url signing key, at least 32 bytes. Store as a Sensitive Production variable. |
| Connected private Vercel Blob store | The Blob SDK uses the project connection to atomically consume approved consent transactions and authorization codes. |

Redeploy Production after changing any environment variable. Rotating the signing key and redeploying invalidates all issued bridge credentials. Rotating only the owner password affects future consent. Access tokens last 15 minutes. Confidential clients registering for refresh receive a client-bound refresh token valid for 30 days.

The service runs in one Node.js 24 Vercel Function. Replay markers store a fixed byte under a hashed name and expire after one day. The server uses no cron or background worker. OAuth registration is stateless. Normal tool calls do not access Blob storage. The bridge enforces a 4.5 MB message limit and a 55-second upstream deadline. Kaggle applies its own account and compute quotas.

## Verify

Use Node.js 24 and run `npm ci` and `npm test`. Unit tests use disposable credentials and a simulated upstream.

For a production check, run `node scripts/smoke.mjs` with the bridge owner password on standard input or in the process environment as `BRIDGE_OWNER_PASSWORD`. The check registers an ephemeral client, stops at the Google callback, and uses the issued code to verify PKCE, replay protection, tool discovery and a read-only Kaggle call. It prints status messages without account data.

References: [Gemini custom apps](https://support.google.com/gemini/answer/17209137), [Google OAuth guide](https://developers.google.com/connected-apps/mcp/oauth), [Kaggle MCP documentation](https://www.kaggle.com/docs/mcp.md), [Vercel Hobby allowances](https://vercel.com/docs/plans/hobby).
