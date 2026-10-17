import { supabase } from "@/lib/supabase";

export function subscribeToSales(onChange: () => void) {
  if (!supabase) return () => undefined;
  const channel = supabase
    .channel("vendas-mih-sales")
    .on("postgres_changes", { event: "*", schema: "public", table: "sales" }, onChange)
    .subscribe();
  return () => { void supabase?.removeChannel(channel); };
}

export function subscribeToNotifications(onInsert: (notification: Record<string, unknown>) => void) {
  if (!supabase) return () => undefined;
  const channel = supabase
    .channel("vendas-mih-notifications")
    .on("postgres_changes", { event: "INSERT", schema: "public", table: "notifications" }, (payload) => {
      onInsert(payload.new as Record<string, unknown>);
    })
    .subscribe();
  return () => { void supabase?.removeChannel(channel); };
}
