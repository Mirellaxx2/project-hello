import { supabase } from "@/lib/supabase";

export interface ReportSummary {
  salesCount: number;
  confirmedRevenue: number;
  averageTicket: number;
  pendingPayments: number;
  completedDeliveries: number;
}

export async function getReportSummary(fromIso: string, toIso: string): Promise<ReportSummary> {
  if (!supabase) throw new Error("Configure o Supabase no arquivo .env.local.");
  const { data, error } = await supabase
    .from("sales")
    .select("amount,payment_status,delivery_status,paid_at,created_at")
    .gte("created_at", fromIso)
    .lt("created_at", toIso);
  if (error) throw error;
  const sales = data ?? [];
  const confirmed = sales.filter((s) => s.payment_status === "confirmed");
  const confirmedRevenue = confirmed.reduce((sum, s) => sum + Number(s.amount), 0);
  return {
    salesCount: sales.length,
    confirmedRevenue,
    averageTicket: confirmed.length ? confirmedRevenue / confirmed.length : 0,
    pendingPayments: sales.filter((s) => s.payment_status === "pending").length,
    completedDeliveries: sales.filter((s) => s.delivery_status === "completed").length,
  };
}

export function exportRowsToCsv(filename: string, rows: Record<string, unknown>[]) {
  if (!rows.length) throw new Error("Não há dados para exportar.");
  const headers = Object.keys(rows[0] ?? {});
  const escapeCell = (value: unknown) => {
    const str = String(value ?? "");
    return `"${str.replace(/"/g, '""')}"`;
  };
  const csv = [headers.map(escapeCell).join(";"), ...rows.map((row) => headers.map((key) => escapeCell(row[key])).join(";"))].join("\r\n");
  const blob = new Blob(["\uFEFF", csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}
