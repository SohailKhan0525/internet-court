import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const SITE_URL = Deno.env.get("SITE_URL") ?? "https://loopproof.me";

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[char] as string));
}

function emailShell(bodyHtml: string) {
  return `
  <div style="background:#fdfdfb;padding:32px 16px;font-family:Georgia,serif;">
    <div style="max-width:480px;margin:0 auto;background:#ffffff;border:1px solid #e4e2dc;border-radius:4px;overflow:hidden;">
      <div style="padding:20px 24px;border-bottom:1px solid #e4e2dc;">
        <span style="font-size:20px;vertical-align:middle;">\u2696\uFE0F</span>
        <span style="font-size:15px;font-weight:600;letter-spacing:-0.01em;color:#1a1a1a;vertical-align:middle;margin-left:8px;">INTERNET COURT</span>
      </div>
      <div style="padding:24px;font-size:15px;line-height:1.6;color:#1a1a1a;">
        ${bodyHtml}
      </div>
    </div>
  </div>`;
}

// Best-effort confirmation email. Never blocks or fails case creation --
// filing the case is the thing that matters; the email is a nice-to-have.
async function sendConfirmationEmail(to: string, title: string, slug: string) {
  const apiKey = Deno.env.get("RESEND_API_KEY");
  if (!apiKey) return;
  const caseUrl = `${SITE_URL}/c/${slug}`;
  try {
    await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: "Internet Court <no-reply@loopproof.me>",
        to: [to],
        subject: "Your case is filed",
        html: emailShell(`
          <p style="margin:0 0 16px;">Your case is live:</p>
          <p style="margin:0 0 16px;font-size:18px;font-weight:600;">${escapeHtml(title)}</p>
          <p style="margin:0 0 20px;"><a href="${caseUrl}" style="color:#1a1a1a;">${caseUrl}</a></p>
          <p style="margin:0;font-size:13px;color:#6b6b66;">Share the link to get real votes. The verdict is just the honest count — nothing is seeded.</p>
        `),
        text: `Your case is live:\n\n${title}\n\n${caseUrl}\n\nShare the link to get real votes. The verdict is just the honest count — nothing is seeded.`,
      }),
    });
  } catch (error) {
    console.error("Confirmation email failed", error);
  }
}

// No Turnstile here by design: this action already requires a signed-in
// session (checked below), and the account itself was already verified by
// Turnstile at sign-in. Abuse from real accounts is handled by
// create_case()'s own rate limiting in the database.
Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return Response.json({ error: "Method not allowed" }, { status: 405, headers: corsHeaders });
  const auth = req.headers.get("Authorization");
  if (!auth) return Response.json({ error: "Authentication required" }, { status: 401, headers: corsHeaders });
  const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!, { global: { headers: { Authorization: auth } } });
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return Response.json({ error: "Authentication required" }, { status: 401, headers: corsHeaders });
  const body = await req.json().catch(() => null);
  const title = typeof body?.title === "string" ? body.title : "";
  const argument = typeof body?.argument === "string" ? body.argument : "";
  const visibility = body?.visibility === "unlisted" || body?.visibility === "private" ? body.visibility : "public";
  const { data, error } = await supabase.rpc("create_case", { p_title: title, p_argument: argument, p_visibility: visibility });
  if (error) return Response.json({ error: error.message }, { status: 400, headers: corsHeaders });
  const created = Array.isArray(data) ? data[0] : data;
  if (user.email && created?.slug && created?.title) {
    await sendConfirmationEmail(user.email, created.title, created.slug);
  }
  return Response.json({ case: data }, { status: 201, headers: corsHeaders });
});
