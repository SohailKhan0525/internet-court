import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "content-type, paypal-auth-algo, paypal-cert-url, paypal-transmission-id, paypal-transmission-sig, paypal-transmission-time",
  "Content-Type": "application/json",
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: corsHeaders });
}

function required(name: string) {
  const value = Deno.env.get(name);
  if (!value) throw new Error(`Missing required secret: ${name}`);
  return value;
}

async function accessToken(baseUrl: string) {
  const credentials = btoa(`${required("PAYPAL_CLIENT_ID")}:${required("PAYPAL_CLIENT_SECRET")}`);
  const response = await fetch(`${baseUrl}/v1/oauth2/token`, {
    method: "POST",
    headers: { Authorization: `Basic ${credentials}`, "Content-Type": "application/x-www-form-urlencoded", Accept: "application/json" },
    body: "grant_type=client_credentials",
  });
  if (!response.ok) throw new Error(`PayPal token request failed: ${response.status}`);
  return (await response.json()).access_token as string;
}

async function verifyWebhook(req: Request, rawBody: string, baseUrl: string) {
  const headers = {
    auth_algo: req.headers.get("paypal-auth-algo"),
    cert_url: req.headers.get("paypal-cert-url"),
    transmission_id: req.headers.get("paypal-transmission-id"),
    transmission_sig: req.headers.get("paypal-transmission-sig"),
    transmission_time: req.headers.get("paypal-transmission-time"),
  };
  if (Object.values(headers).some((value) => !value)) return false;
  const token = await accessToken(baseUrl);
  const response = await fetch(`${baseUrl}/v1/notifications/verify-webhook-signature`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ ...headers, webhook_id: required("PAYPAL_WEBHOOK_ID"), webhook_event: JSON.parse(rawBody) }),
  });
  if (!response.ok) throw new Error(`PayPal webhook verification failed: ${response.status}`);
  return (await response.json()).verification_status === "SUCCESS";
}

function planCode(planId: string | undefined) {
  if (planId && planId === Deno.env.get("PAYPAL_PLAN_JURY_MEMBER")) return "jury_member";
  if (planId && planId === Deno.env.get("PAYPAL_PLAN_SUPREME_COURT")) return "supreme_court";
  return null;
}

Deno.serve(async (req) => {
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);
  const rawBody = await req.text();
  try {
    const baseUrl = Deno.env.get("PAYPAL_API_BASE_URL") ?? "https://api-m.paypal.com";
    if (!(await verifyWebhook(req, rawBody, baseUrl))) return json({ error: "Invalid webhook signature" }, 401);

    const event = JSON.parse(rawBody);
    if (!event.id || !event.event_type) return json({ error: "Invalid PayPal event" }, 400);

    const supabase = createClient(required("SUPABASE_URL"), required("SUPABASE_SECRET_KEY"), { auth: { autoRefreshToken: false, persistSession: false } });
    const { data: inserted, error: insertError } = await supabase.from("paypal_webhook_events").insert({ event_id: event.id, event_type: event.event_type, payload: event }).select("event_id").maybeSingle();
    if (insertError && insertError.code !== "23505") throw insertError;
    if (!inserted) return json({ ok: true, duplicate: true });

    const resource = event.resource ?? {};
    const subscriptionId = resource.id ?? resource.billing_agreement_id ?? resource.subscription_id;
    const userId = resource.custom_id;
    const code = planCode(resource.plan_id);
    const eventStatuses: Record<string, string> = {
      "BILLING.SUBSCRIPTION.ACTIVATED": "active",
      "BILLING.SUBSCRIPTION.SUSPENDED": "past_due",
      "BILLING.SUBSCRIPTION.CANCELLED": "cancelled",
      "BILLING.SUBSCRIPTION.EXPIRED": "expired",
      "BILLING.SUBSCRIPTION.PAYMENT.FAILED": "past_due",
    };
    const status = eventStatuses[event.event_type] ?? (event.event_type === "PAYMENT.SALE.COMPLETED" ? "active" : null);

    if (subscriptionId) {
      const { data: existing } = await supabase.from("subscriptions").select("id").eq("provider_subscription_id", subscriptionId).maybeSingle();
      if (existing) {
        const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };
        if (status) patch.status = status;
        if (code) patch.plan_code = code;
        if (resource.billing_info?.next_billing_time) patch.current_period_end = resource.billing_info.next_billing_time;
        await supabase.from("subscriptions").update(patch).eq("id", existing.id);
      } else if (userId && code && status) {
        await supabase.from("subscriptions").insert({ user_id: userId, provider: "paypal", provider_subscription_id: subscriptionId, plan_code: code, status, current_period_start: resource.start_time ?? null, current_period_end: resource.billing_info?.next_billing_time ?? null });
      }
    }

    await supabase.from("paypal_webhook_events").update({ processed_at: new Date().toISOString() }).eq("event_id", event.id);
    return json({ ok: true });
  } catch (error) {
    console.error(error);
    return json({ error: "Webhook processing failed" }, 500);
  }
});
