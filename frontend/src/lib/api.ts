// Typed client for the backend API. Same-origin in production; proxied in dev.

import type {
  CarbonInput,
  Entry,
  FootprintResult,
  InsightsResponse,
} from "./types";

async function postJson<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    throw new Error(`Request to ${path} failed (${res.status})`);
  }
  return (await res.json()) as T;
}

export function calculate(input: CarbonInput): Promise<FootprintResult> {
  return postJson<FootprintResult>("/api/calculate", input);
}

export function getInsights(input: CarbonInput): Promise<InsightsResponse> {
  return postJson<InsightsResponse>("/api/insights", input);
}

export function saveEntry(
  deviceId: string,
  input: CarbonInput,
  result: FootprintResult,
): Promise<Entry> {
  return postJson<Entry>("/api/entries", {
    device_id: deviceId,
    input,
    result,
  });
}

export async function listEntries(deviceId: string): Promise<Entry[]> {
  const res = await fetch(`/api/entries/${encodeURIComponent(deviceId)}`);
  if (!res.ok) {
    throw new Error(`Failed to load history (${res.status})`);
  }
  return (await res.json()) as Entry[];
}
