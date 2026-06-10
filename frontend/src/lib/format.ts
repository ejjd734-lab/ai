// Display formatting helpers.

export function formatKg(kg: number): string {
  return `${kg.toLocaleString(undefined, { maximumFractionDigits: 0 })} kg`;
}

export function formatTonnes(tonnes: number): string {
  return `${tonnes.toLocaleString(undefined, { maximumFractionDigits: 2 })} t`;
}

const CATEGORY_LABELS: Record<string, string> = {
  transport: "Transport",
  home: "Home energy",
  diet: "Diet",
  consumption: "Goods & waste",
};

export function categoryLabel(key: string): string {
  return CATEGORY_LABELS[key] ?? key;
}

export function formatDate(iso: string): string {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? iso : d.toLocaleString();
}
