import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Content-Type": "application/json",
};

const SUPPORT_INBOX = "sohailkhannn.0525@gmail.com";
const FROM_ADDRESS = "Internet Court <support@loopproof.me>";

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: corsHeaders });
}

function required(name: string) {
  const value = Deno.env.get(name);
  if (!value) throw new Error(`Missing required secret: ${name}`);
  return value;
}

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

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  try {
    const body = await req.json().catch(() => null);
    const name = typeof body?.name === "string" ? body.name.trim().slice(0, 120) : "";
    const email = typeof body?.email === "string" ? body.email.trim().slice(0, 254) : "";
    const message = typeof body?.message === "string" ? body.message.trim().slice(0, 4000) : "";
    const honeypot = typeof body?.website === "string" ? body.website.trim() : "";

    if (honeypot) return json({ sent: true }); // bot tripped the honeypot -- report success, do nothing
    if (!name || !email || !message) return json({ error: "Name, email, and message are required" }, 400);
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return json({ error: "Enter a valid email address" }, 400);

    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${required("RESEND_API_KEY")}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: FROM_ADDRESS,
        to: [SUPPORT_INBOX],
        reply_to: email,
        subject: `[Contact] ${name} \u2014 Internet Court`,
        html: emailShell(`
          <p style="margin:0 0 4px;font-size:13px;color:#6b6b66;">New contact form submission</p>
          <p style="margin:0 0 16px;"><strong>${escapeHtml(name)}</strong> &lt;${escapeHtml(email)}&gt;</p>
          <p style="margin:0 0 20px;white-space:pre-wrap;">${escapeHtml(message)}</p>
          <p style="margin:0;padding-top:16px;border-top:1px dashed #e4e2dc;font-size:12px;color:#8a8880;">Reply directly to this email to respond to ${escapeHtml(name)} \u2014 it goes straight to them.</p>
        `),
        text: `New contact form submission\n\nFrom: ${name} <${email}>\n\n${message}\n\n---\nReply directly to this email to respond to ${name} — it goes straight to them.`,
      }),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      console.error("Resend send failed", response.status, errorBody);
      return json({ error: "The message could not be sent. Please try again." }, 502);
    }

    return json({ sent: true });
  } catch (error) {
    console.error(error);
    return json({ error: "The message could not be sent. Please try again." }, 500);
  }
});
