import { supabase } from "@/lib/supabase";

function client() {
  if (!supabase) throw new Error("Configure VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY no .env.local.");
  return supabase;
}

export async function signIn(email: string, password: string) {
  const { data, error } = await client().auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data;
}

export async function signUp(email: string, password: string, displayName: string) {
  if (password.length < 10) throw new Error("Use uma senha com pelo menos 10 caracteres.");
  const { data, error } = await client().auth.signUp({
    email,
    password,
    options: { data: { name: displayName } },
  });
  if (error) throw error;
  return data;
}

export async function signOut() {
  const { error } = await client().auth.signOut();
  if (error) throw error;
}

export async function getCurrentSession() {
  const { data, error } = await client().auth.getSession();
  if (error) throw error;
  return data.session;
}
