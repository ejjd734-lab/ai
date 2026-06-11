import type { CarbonInput, Entry, FootprintResult, InsightsResponse } from "./types";
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "";
async function postJson<T>(path: string, body: unknown): Promise<T> {
  const url = API_BASE_URL ? `${API_BASE_URL}${path}` : path;
  const res = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  if (!res.ok) throw new Error(`Request to ${path} failed (${res.status})`);
  return (await res.json()) as T;
}
export const calculate = (input: CarbonInput) => postJson<FootprintResult>("/api/calculate", input);
export const getInsights = (input: CarbonInput) => postJson<InsightsResponse>("/api/insights", input);
export const saveEntry = (deviceId: string, input: CarbonInput, result: FootprintResult) => postJson<Entry>("/api/entries", { device_id: deviceId, input, result });
export async function listEntries(deviceId: string): Promise<Entry[]> {
  const url = API_BASE_URL ? `${API_BASE_URL}/api/entries/${encodeURIComponent(deviceId)}` : `/api/entries/${encodeURIComponent(deviceId)}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to load history (${res.status})`);
  return (await res.json()) as Entry[];
}
