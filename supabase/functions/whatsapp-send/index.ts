// Secure placeholder: this endpoint never reports success until an official provider adapter
// and credentials are configured. Deploy only after implementing provider-approved sending.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": Deno.env.get("APP_ORIGIN") ?? "http://localhost:5173",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (request.method !== "POST") {
    return Response.json({ error: "Method not allowed" }, { status: 405, headers: corsHeaders });
  }

  const url = Deno.env.get("SUPABASE_URL");
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
  const authHeader = request.headers.get("Authorization");
  if (!url || !anonKey || !authHeader) {
    return Response.json({ error: "Authentication/configuration required" }, { status: 401, headers: corsHeaders });
  }

  const supabase = createClient(url, anonKey, { global: { headers: { Authorization: authHeader } } });
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) {
    return Response.json({ error: "Unauthorized" }, { status: 401, headers: corsHeaders });
  }

  return Response.json(
    {
      ok: false,
      code: "MESSAGE_PROVIDER_NOT_CONFIGURED",
      message: "Configure e teste o provedor oficial de mensagens antes de enviar. Nenhuma mensagem foi enviada.",
    },
    { status: 501, headers: corsHeaders },
  );
});
