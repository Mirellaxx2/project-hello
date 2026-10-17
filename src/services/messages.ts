import { supabase } from "@/lib/supabase";

function client() {
  if (!supabase) throw new Error("Configure o Supabase no arquivo .env.local.");
  return supabase;
}

export async function listMessageTemplates() {
  const { data, error } = await client().from("message_templates").select("*").order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function saveMessageTemplate(input: { name: string; body: string; active?: boolean }, id?: string) {
  if (!input.name.trim() || !input.body.trim()) throw new Error("Informe o nome e o conteúdo do modelo.");
  const query = id
    ? client().from("message_templates").update(input).eq("id", id)
    : client().from("message_templates").insert(input);
  const { data, error } = await query.select().single();
  if (error) throw error;
  return data;
}

export async function listSentMessages() {
  const { data, error } = await client().from("sent_messages").select("*").order("created_at", { ascending: false }).limit(200);
  if (error) throw error;
  return data ?? [];
}

/** Sending is server-side only. The Edge Function must be configured and tested first. */
export async function requestMessageSend(input: { saleId?: string; customerId?: string; phone: string; body: string; idempotencyKey: string }) {
  const { data: sessionData, error: sessionError } = await client().auth.getSession();
  if (sessionError) throw sessionError;
  if (!sessionData.session) throw new Error("Entre na sua conta antes de enviar uma mensagem.");
  const { data, error } = await client().functions.invoke("whatsapp-send", { body: input });
  if (error) throw error;
  return data;
}
