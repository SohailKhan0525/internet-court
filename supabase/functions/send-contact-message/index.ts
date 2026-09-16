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
        subject: `Internet Court contact form: ${name}`,
        html: `<p><strong>From:</strong> ${escapeHtml(name)} (${escapeHtml(email)})</p><p>${escapeHtml(message).replace(/\n/g, "<br>")}</p>`,
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
