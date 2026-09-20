import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
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


// Supabase auto-injects SUPABASE_SERVICE_ROLE_KEY into every edge function.
// It also REJECTS any custom secret whose name starts with SUPABASE_, so the
// previously-referenced "SUPABASE_SECRET_KEY" could never be set and this
// function failed on every single invocation with a 500.
function serviceRoleKey() {
  const value = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? Deno.env.get("SUPABASE_SECRET_KEY");
  if (!value) throw new Error("Missing service role key");
  return value;
}

const PLAN_ENV_BY_CODE = {
  jury_member: "PAYPAL_PLAN_JURY_MEMBER",
  supreme_court: "PAYPAL_PLAN_SUPREME_COURT",
} as const;

type PlanCode = keyof typeof PLAN_ENV_BY_CODE;

function isPlanCode(value: unknown): value is PlanCode {
  return value === "jury_member" || value === "supreme_court";
}

function validateRedirectUrl(value: unknown, origin: string) {
  if (typeof value !== "string") return null;
  const url = new URL(value);
  const expected = new URL(origin);
  if (url.origin !== expected.origin) return null;
  if (url.protocol !== expected.protocol) return null;
  return url.toString();
}

async function getPayPalAccessToken(baseUrl: string) {
  const credentials = btoa(`${required("PAYPAL_CLIENT_ID")}:${required("PAYPAL_CLIENT_SECRET")}`);
  const response = await fetch(`${baseUrl}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${credentials}`,
      "Content-Type": "application/x-www-form-urlencoded",
      Accept: "application/json",
    },
    body: "grant_type=client_credentials",
  });
  if (!response.ok) throw new Error(`PayPal authentication failed: ${response.status}`);
  const data = await response.json();
  if (!data.access_token) throw new Error("PayPal did not return an access token");
  return data.access_token as string;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) return json({ error: "Authentication required" }, 401);

    const supabase = createClient(required("SUPABASE_URL"), serviceRoleKey(), {
      auth: { autoRefreshToken: false, persistSession: false },
    });
    const token = authHeader.slice("Bearer ".length);
    const { data: userData, error: userError } = await supabase.auth.getUser(token);
    if (userError || !userData.user) return json({ error: "Authentication required" }, 401);

    const body = await req.json();
    const planCode = body?.plan_code;
    if (!isPlanCode(planCode)) return json({ error: "Unknown subscription plan" }, 400);

    const origin = req.headers.get("origin");
    if (!origin) return json({ error: "Request origin is required" }, 400);
    const returnUrl = validateRedirectUrl(body?.return_url, origin);
    const cancelUrl = validateRedirectUrl(body?.cancel_url, origin);
    if (!returnUrl || !cancelUrl) return json({ error: "Redirect URLs must use the requesting site's origin" }, 400);

    const planId = Deno.env.get(PLAN_ENV_BY_CODE[planCode]);
    if (!planId) throw new Error(`Missing required secret: ${PLAN_ENV_BY_CODE[planCode]}`);

    const baseUrl = Deno.env.get("PAYPAL_API_BASE_URL") ?? "https://api-m.paypal.com";
    const accessToken = await getPayPalAccessToken(baseUrl);

    const response = await fetch(`${baseUrl}/v1/billing/subscriptions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        plan_id: planId,
        custom_id: userData.user.id,
        application_context: {
          user_action: "SUBSCRIBE_NOW",
          shipping_preference: "NO_SHIPPING",
          return_url: returnUrl,
          cancel_url: cancelUrl,
        },
      }),
    });

    const responseBody = await response.json();
    if (!response.ok) {
      console.error("PayPal subscription creation failed", response.status, responseBody);
      return json({ error: "PayPal could not create the subscription" }, 502);
    }

    const approvalLink = Array.isArray(responseBody.links)
      ? responseBody.links.find((link: { rel?: string }) => link.rel === "approve")?.href
      : null;

    if (!responseBody.id || !approvalLink) {
      console.error("PayPal subscription response missing approval link", responseBody);
      return json({ error: "PayPal returned an incomplete subscription response" }, 502);
    }

    return json({ subscription_id: responseBody.id, approval_url: approvalLink });
  } catch (error) {
    console.error(error);
    return json({ error: "Unable to start PayPal subscription" }, 500);
  }
});
