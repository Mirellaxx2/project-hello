import { supabase } from "@/lib/supabase";

export type PaymentStatus = "pending" | "confirmed" | "cancelled" | "refunded";
export type DeliveryStatus = "pending" | "in_progress" | "completed" | "failed";
export type MessageStatus = "not_required" | "pending" | "sending" | "sent" | "delivered" | "failed";

export interface SaleDraft {
  customer_id?: string | null;
  product_id?: string | null;
  customer_name: string;
  product_name: string;
  amount: number;
  notes?: string | null;
}

export async function createSaleDraft(input: SaleDraft) {
  if (!supabase) throw new Error("Configure o Supabase no arquivo .env.local.");
  if (!Number.isFinite(input.amount) || input.amount <= 0) {
    throw new Error("Informe um valor maior que zero.");
  }

  const { data: userResult, error: userError } = await supabase.auth.getUser();
  if (userError || !userResult.user) throw new Error("Entre na sua conta antes de registrar uma venda.");

  const { data, error } = await supabase
    .from("sales")
    .insert({
      ...input,
      user_id: userResult.user.id,
      currency: "BRL",
      payment_status: "pending",
      delivery_status: "pending",
      message_status: "not_required",
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function listSales(limit = 100) {
  if (!supabase) throw new Error("Configure o Supabase no arquivo .env.local.");
  const { data, error } = await supabase
    .from("sales")
    .select("*, customers(name, phone), products(name)")
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return data ?? [];
}

export async function getConfirmedRevenue(fromIso: string, toIso: string) {
  if (!supabase) throw new Error("Configure o Supabase no arquivo .env.local.");
  const { data, error } = await supabase
    .from("sales")
    .select("amount")
    .eq("payment_status", "confirmed")
    .gte("paid_at", fromIso)
    .lt("paid_at", toIso);
  if (error) throw error;
  return (data ?? []).reduce((total, sale) => total + Number(sale.amount), 0);
}
