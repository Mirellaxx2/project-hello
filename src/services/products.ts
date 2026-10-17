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
  const query = id
    ? client().from("products").update(input).eq("id", id)
    : client().from("products").insert(input);
  const { data, error } = await query.select().single();
  if (error) throw error;
  return data;
}

export async function deleteProduct(id: string) {
  const { error } = await client().from("products").delete().eq("id", id);
  if (error) throw error;
}
