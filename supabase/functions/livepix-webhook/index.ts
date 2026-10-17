import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = { "Content-Type": "application/json" };
function reply(status: number, body: Record<string, unknown>) {
  return new Response(JSON.stringify(body), { status, headers: corsHeaders });
}

Deno.serve(async (req: Request) => {
  if (req.method !== "POST") return reply(405, { error: "Método não permitido." });
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const clientId = Deno.env.get("LIVEPIX_CLIENT_ID");
  const clientSecret = Deno.env.get("LIVEPIX_CLIENT_SECRET");
  const scope = Deno.env.get("LIVEPIX_SCOPE") ?? "account:read wallet:read webhooks";
  if (!supabaseUrl || !serviceKey || !clientId || !clientSecret) {
    return reply(503, { error: "LivePix não está configurado no servidor." });
  }

  let payload: any;
  try { payload = await req.json(); } catch { return reply(400, { error: "JSON inválido." }); }
  const resourceId = payload?.resource?.id;
  if (payload?.event !== "new" || payload?.resource?.type !== "payment" || typeof resourceId !== "string") {
    return reply(200, { received: true, ignored: true });
  }

  const admin = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });
  try {
    const tokenResponse = await fetch("https://oauth.livepix.gg/oauth2/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ grant_type: "client_credentials", client_id: clientId, client_secret: clientSecret, scope }),
    });
    const tokenJson = await tokenResponse.json();
    if (!tokenResponse.ok || typeof tokenJson.access_token !== "string") {
      console.error("LivePix webhook verification OAuth failed", tokenResponse.status);
      return reply(503, { error: "Não foi possível validar o evento com o LivePix." });
    }

    // Treat the webhook as a notification only. Fetch payment details directly from LivePix.
    const verifiedResponse = await fetch(`https://api.livepix.gg/v2/payments/${encodeURIComponent(resourceId)}`, {
      headers: { Authorization: `Bearer ${tokenJson.access_token}` },
    });
    const verifiedJson = await verifiedResponse.json();
    const payment = verifiedJson?.data;
    if (!verifiedResponse.ok || !payment || typeof payment.reference !== "string" || !Number.isFinite(Number(payment.amount)) || payment.currency !== "BRL") {
      console.error("LivePix payment verification failed", verifiedResponse.status);
      return reply(503, { error: "Pagamento ainda não pôde ser verificado." });
    }

    const { data: sale, error: saleError } = await admin.from("sales")
      .select("id,user_id,amount,payment_status,provider_transaction_id")
      .eq("payment_provider", "livepix").eq("provider_transaction_id", payment.reference).maybeSingle();
    if (saleError) return reply(503, { error: "Não foi possível localizar o pedido." });
    if (!sale) return reply(503, { error: "Pedido ainda não localizado; o provedor pode reenviar o evento." });

    const expectedCents = Math.round(Number(sale.amount) * 100);
    if (Number(payment.amount) !== expectedCents) {
      await admin.from("payment_events").upsert({
        provider: "livepix", provider_event_id: resourceId, provider_transaction_id: payment.reference,
        event_type: "amount_mismatch", signature_valid: false, processing_status: "failed", payload,
        error_message: "Valor do pagamento não corresponde ao pedido.",
      }, { onConflict: "provider,provider_event_id", ignoreDuplicates: true });
      return reply(400, { error: "O valor recebido não corresponde ao pedido." });
    }

    const { error: eventError } = await admin.from("payment_events").upsert({
      provider: "livepix", provider_event_id: resourceId, provider_transaction_id: payment.reference,
      event_type: "payment_verified_by_provider_api", signature_valid: false,
      processing_status: "processed", payload, processed_at: new Date().toISOString(),
    }, { onConflict: "provider,provider_event_id", ignoreDuplicates: true });
    if (eventError) return reply(503, { error: "Não foi possível registrar o evento." });

    if (sale.payment_status !== "confirmed") {
      const { error: updateError } = await admin.from("sales").update({
        payment_status: "confirmed",
        paid_at: typeof payment.createdAt === "string" ? payment.createdAt : new Date().toISOString(),
      }).eq("id", sale.id).eq("payment_status", "pending");
      if (updateError) {
        console.error("Could not confirm sale", updateError.message);
        return reply(503, { error: "Pagamento verificado, mas o pedido não foi atualizado." });
      }
    }
    return reply(200, { received: true, processed: true });
  } catch (error) {
    console.error("LivePix webhook error", error instanceof Error ? error.message : "unknown");
    return reply(503, { error: "Falha temporária ao validar o pagamento." });
  }
});
