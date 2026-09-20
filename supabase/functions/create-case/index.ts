import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

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
  return Response.json({ case: data }, { status: 201, headers: corsHeaders });
});
