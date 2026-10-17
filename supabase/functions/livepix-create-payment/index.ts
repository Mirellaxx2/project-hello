import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": Deno.env.get("APP_ORIGIN") ?? "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Content-Type": "application/json",
};
// LivePix tokens last ~1h; reuse across warm invocations and refresh 60s early.
// LivePix warns that excessive token issuance can lead to account termination.
const LIVEPIX_DEFAULT_SCOPE = "payments:read payments:write account:read";
let cachedToken: { accessToken: string; expiresAt: number } | null = null;

async function getLivePixAccessToken(clientId: string, clientSecret: string): Promise<string | null> {
  const now = Date.now();
  if (cachedToken && cachedToken.expiresAt > now + 60_000) return cachedToken.accessToken;
  const scope = Deno.env.get("LIVEPIX_SCOPE") ?? LIVEPIX_DEFAULT_SCOPE;
  const tokenResponse = await fetch("https://oauth.livepix.gg/oauth2/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ grant_type: "client_credentials", client_id: clientId, client_secret: clientSecret, scope }),
  });
  const tokenJson = await tokenResponse.json();
  if (!tokenResponse.ok || typeof tokenJson.access_token !== "string") {
    console.error("LivePix OAuth failed", tokenResponse.status);
    return null;
  }
  const expiresIn = Number(tokenJson.expires_in);
  const ttlMs = Number.isFinite(expiresIn) && expiresIn > 120 ? expiresIn * 1000 : 3_600_000;
  cachedToken = { accessToken: tokenJson.access_token, expiresAt: now + ttlMs };
  return cachedToken.accessToken;
}

function reply(status: number, body: Record<string, unknown>) {
  return new Response(JSON.stringify(body), { status, headers: corsHeaders });
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return reply(405, { error: "Método não permitido." });

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const clientId = Deno.env.get("LIVEPIX_CLIENT_ID");
  const clientSecret = Deno.env.get("LIVEPIX_CLIENT_SECRET");
  const redirectUrl = Deno.env.get("LIVEPIX_REDIRECT_URL");
  if (!supabaseUrl || !serviceKey || !clientId || !clientSecret || !redirectUrl) {
    return reply(503, { error: "LivePix ainda não está configurado no servidor. Cadastre os secrets necessários." });
  }
  const authorization = req.headers.get("Authorization");
  if (!authorization?.startsWith("Bearer ")) return reply(401, { error: "Faça login para continuar." });
  const admin = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });
  const { data: userData, error: userError } = await admin.auth.getUser(authorization.slice(7));
  if (userError || !userData.user) return reply(401, { error: "Sessão inválida. Entre novamente." });

  let body: { sale_id?: string };
  try { body = await req.json(); } catch { return reply(400, { error: "JSON inválido." }); }
  if (!body.sale_id || !/^[0-9a-f-]{36}$/i.test(body.sale_id)) return reply(400, { error: "Informe uma venda válida." });

  const { data: sale, error: saleError } = await admin.from("sales")
    .select("id,user_id,amount,payment_status,payment_provider,provider_transaction_id,payment_checkout_url")
    .eq("id", body.sale_id).eq("user_id", userData.user.id).maybeSingle();
  if (saleError) return reply(500, { error: "Não foi possível consultar a venda." });
  if (!sale) return reply(404, { error: "Venda não encontrada para esta conta." });
  if (sale.payment_status !== "pending") return reply(409, { error: "Só é possível gerar cobrança para vendas pendentes." });
  if (sale.payment_provider === "livepix" && sale.provider_transaction_id && sale.payment_checkout_url) {
    return reply(200, { checkout_url: sale.payment_checkout_url, reference: sale.provider_transaction_id, reused: true });
  }

  try {
    const accessToken = await getLivePixAccessToken(clientId, clientSecret);
    if (!accessToken) {
      return reply(502, { error: "Não foi possível autenticar com o LivePix. Confira credenciais e permissões." });
    }
    const paymentResponse = await fetch("https://api.livepix.gg/v2/payments", {
      method: "POST",
      headers: { Authorization: `Bearer ${tokenJson.access_token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ amount: Math.round(Number(sale.amount) * 100), currency: "BRL", redirectUrl }),
    });
    const paymentJson = await paymentResponse.json();
    const payment = paymentJson?.data;
    if (!paymentResponse.ok || typeof payment?.reference !== "string" || typeof payment?.redirectUrl !== "string") {
      console.error("LivePix payment creation failed", paymentResponse.status);
      return reply(502, { error: "O LivePix não conseguiu criar a cobrança. Confira o escopo da aplicação e tente novamente." });
    }
    const { error: updateError } = await admin.from("sales").update({
      payment_provider: "livepix", provider_transaction_id: payment.reference, payment_checkout_url: payment.redirectUrl,
    }).eq("id", sale.id).eq("user_id", userData.user.id).eq("payment_status", "pending");
    if (updateError) {
      console.error("Could not persist LivePix checkout", updateError.message);
      return reply(500, { error: "Cobrança criada, mas o link não foi salvo. Verifique o pedido antes de gerar outra." });
    }
    return reply(200, { checkout_url: payment.redirectUrl, reference: payment.reference });
  } catch (error) {
    console.error("LivePix create payment error", error instanceof Error ? error.message : "unknown");
    return reply(502, { error: "Falha de comunicação com o LivePix." });
  }
});
