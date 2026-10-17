// IMPORTANT: This handler intentionally does not mark payments as paid.
// Implement the official Live Pix webhook verification only after confirming its current
// official documentation, signature scheme, and event payload. Never trust browser input.
Deno.serve(async (request) => {
  if (request.method !== "POST") {
    return new Response("Method not allowed", { status: 405, headers: { Allow: "POST" } });
  }

  return Response.json(
    {
      ok: false,
      code: "LIVEPIX_ADAPTER_NOT_CONFIGURED",
      message: "O adaptador oficial do Live Pix ainda não foi configurado. Nenhum pagamento foi alterado.",
    },
    { status: 501 },
  );
});
