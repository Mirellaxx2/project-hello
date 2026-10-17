import { supabase } from "@/lib/supabase";

function client() {
  if (!supabase) throw new Error("Configure o Supabase no arquivo .env.local.");
  return supabase;
}

export async function listDeliveries() {
  const { data, error } = await client()
    .from("deliveries")
    .select("*, sales(id, order_number, customer_name, product_name, amount, payment_status)")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function updateDeliveryStatus(id: string, status: "pending" | "in_progress" | "completed" | "failed") {
  const patch = {
    status,
    ...(status === "completed" ? { completed_at: new Date().toISOString() } : {}),
  };
  const { data, error } = await client().from("deliveries").update(patch).eq("id", id).select().single();
  if (error) throw error;
  return data;
}
