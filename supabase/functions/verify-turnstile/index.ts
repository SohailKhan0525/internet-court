import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

async function verifyTurnstile(token: string, req: Request) {
  const secret = Deno.env.get("TURNSTILE_SECRET_KEY");
  if (!secret) throw new Error("Turnstile is not configured");
  const formData = new FormData();
  formData.append("secret", secret);
  formData.append("response", token);
  const ip = req.headers.get("CF-Connecting-IP");
  if (ip) formData.append("remoteip", ip);
  const response = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", { method: "POST", body: formData });
  if (!response.ok) throw new Error("Turnstile verification request failed");
  return response.json() as Promise<{ success: boolean }>;
}

// Public endpoint (no JWT) — called before a visitor is authenticated, to confirm
// they passed a Turnstile challenge before we let them start the Google OAuth flow
// or request a magic link. This does not itself grant access to anything; it only
// gates the client-side "you may now attempt sign in" state. Every real mutation
// (create_case, cast_vote, submit_report) still enforces its own auth + rate limits
// independently in the database.
Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return Response.json({ error: "Method not allowed" }, { status: 405, headers: corsHeaders });
  const body = await req.json().catch(() => null);
  const token = typeof body?.turnstile_token === "string" ? body.turnstile_token : "";
  if (!token) return Response.json({ verified: false, error: "Security verification required" }, { status: 400, headers: corsHeaders });
  const result = await verifyTurnstile(token, req).catch(() => null);
  if (!result?.success) return Response.json({ verified: false, error: "Security verification failed" }, { status: 403, headers: corsHeaders });
  return Response.json({ verified: true }, { headers: corsHeaders });
});
