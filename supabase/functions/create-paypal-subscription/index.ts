import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, apikey, content-type",
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

const PLAN_ENV_BY_CODE = {
  jury_member: "PAYPAL_PLAN_JURY_MEMBER",
  supreme_court: "PAYPAL_PLAN_SUPREME_COURT",
} as const;

type PlanCode = keyof typeof PLAN_ENV_BY_CODE;

function isPlanCode(value: unknown): value is PlanCode {
  return value === "jury_member" || value === "supreme_court";
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

    const supabase = createClient(required("SUPABASE_URL"), required("SUPABASE_SECRET_KEY"), {
      auth: { autoRefreshToken: false, persistSession: false },
    });
    const token = authHeader.slice("Bearer ".length);
    const { data: userData, error: userError } = await supabase.auth.getUser(token);
    if (userError || !userData.user) return json({ error: "Authentication required" }, 401);

    const body = await req.json();
    const planCode = body?.plan_code;
    const returnUrl = body?.return_url;
    const cancelUrl = body?.cancel_url;

    if (!isPlanCode(planCode)) return json({ error: "Unknown subscription plan" }, 400);
    if (typeof returnUrl !== "string" || typeof cancelUrl !== "string") return json({ error: "Return and cancel URLs are required" }, 400);

    const returnUrlObject = new URL(returnUrl);
    const cancelUrlObject = new URL(cancelUrl);
    if (!/^https?:$/.test(returnUrlObject.protocol) || !/^https?:$/.test(cancelUrlObject.protocol)) {
      return json({ error: "Invalid redirect URL" }, 400);
    }

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
          return_url: returnUrlObject.toString(),
          cancel_url: cancelUrlObject.toString(),
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
