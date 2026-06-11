export const formatKg = (kg: number) => `${kg.toLocaleString(undefined, { maximumFractionDigits: 0 })} kg`;
export const formatTonnes = (t: number) => `${t.toLocaleString(undefined, { maximumFractionDigits: 2 })} t`;
const LABELS: Record<string, string> = { transport: "Transport", home: "Home energy", diet: "Diet", consumption: "Goods & waste" };
export const categoryLabel = (key: string) => LABELS[key] ?? key;
export const formatDate = (iso: string) => { const d = new Date(iso); return Number.isNaN(d.getTime()) ? iso : d.toLocaleString(); };
