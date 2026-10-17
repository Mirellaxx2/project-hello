import { supabase } from "@/lib/supabase";

export interface CustomerInput {
  name: string;
  phone: string;
  email?: string | null;
  contact_consent?: boolean;
  notes?: string | null;
}

function client() {
  if (!supabase) throw new Error("Configure o Supabase no arquivo .env.local.");
  return supabase;
}

export async function listCustomers(search = "") {
  let query = client().from("customers").select("*").order("created_at", { ascending: false }).limit(500);
  if (search.trim()) query = query.or(`name.ilike.%${search.trim()}%,phone.ilike.%${search.trim()}%,email.ilike.%${search.trim()}%`);
  const { data, error } = await query;
  if (error) throw error;
  return data ?? [];
}

export async function saveCustomer(input: CustomerInput, id?: string) {
  const phone = input.phone.replace(/\s/g, "");
  if (!/^\+[1-9]\d{7,14}$/.test(phone)) throw new Error("Use o telefone internacional, por exemplo +5511999999999.");
  const api = client();
  let query;
  if (id) {
    query = api.from("customers").update({ ...input, phone }).eq("id", id);
  } else {
    const { data: userData, error: userError } = await api.auth.getUser();
    if (userError || !userData.user) throw new Error("Entre na sua conta antes de cadastrar clientes.");
    query = api.from("customers").insert({ ...input, phone, user_id: userData.user.id });
  }
  const { data, error } = await query.select().single();
  if (error) throw error;
  return data;
}
