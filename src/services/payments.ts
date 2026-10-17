import { supabase } from "@/lib/supabase";

export interface LivePixCheckout {
  checkout_url: string;
  reference?: string;
  reused?: boolean;
}

export async function createLivePixPayment(saleId: string): Promise<LivePixCheckout> {
  if (!supabase) throw new Error("Configure o Supabase antes de gerar uma cobrança.");
  const { data, error } = await supabase.functions.invoke("livepix-create-payment", {
    body: { sale_id: saleId },
  });
  if (error) throw new Error("Não foi possível gerar a cobrança LivePix. Confira as credenciais do servidor.");
  if (!data || typeof data.checkout_url !== "string") {
    throw new Error(typeof data?.error === "string" ? data.error : "O LivePix não retornou um link de pagamento.");
  }
  return data as LivePixCheckout;
}
