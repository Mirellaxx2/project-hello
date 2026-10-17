export function formatCurrency(value: number | string | null | undefined): string {
  const numeric = typeof value === "string" ? Number(value) : value ?? 0;
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(Number.isFinite(numeric) ? numeric : 0);
}

export function formatDateTime(value: string | Date | null | undefined): string {
  if (!value) return "—";
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(date);
}

export function normalizeBrazilianPhone(value: string): string | null {
  const digits = value.replace(/\D/g, "");
  const international = digits.startsWith("55") ? digits : `55${digits}`;
  if (international.length < 12 || international.length > 13) return null;
  return `+${international}`;
}
