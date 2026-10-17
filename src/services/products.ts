import { supabase } from "@/lib/supabase";

export interface ProductInput {
  name: string;
  description?: string | null;
  price: number;
  category?: string | null;
  image_url?: string | null;
  product_type: "digital" | "physical" | "service";
  delivery_instructions?: string | null;
  active?: boolean;
}

function client() {
  if (!supabase) throw new Error("Configure o Supabase no arquivo .env.local.");
  return supabase;
}

export async function listProducts() {
  const { data, error } = await client().from("products").select("*").order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function saveProduct(input: ProductInput, id?: string) {
  if (!Number.isFinite(input.price) || input.price < 0) throw new Error("Preço inválido.");
  const api = client();
  let query;
  if (id) {
    query = api.from("products").update(input).eq("id", id);
  } else {
    const { data: userData, error: userError } = await api.auth.getUser();
    if (userError || !userData.user) throw new Error("Entre na sua conta antes de cadastrar produtos.");
    query = api.from("products").insert({ ...input, user_id: userData.user.id });
  }
  const { data, error } = await query.select().single();
  if (error) throw error;
  return data;
}

export async function deleteProduct(id: string) {
  const { error } = await client().from("products").delete().eq("id", id);
  if (error) throw error;
}
