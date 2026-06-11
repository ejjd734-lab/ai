// Typed client for the backend API. Same-origin in production; proxied in dev.

import type {
  CarbonInput,
  Entry,
  FootprintResult,
  InsightsResponse,
} from "./types";

// Get API base URL from environment variable or default to relative path (for same-origin)
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "";

async function postJson<T>(path: string, body: unknown): Promise<T> {
  const url = API_BASE_URL ? `${API_BASE_URL}${path}` : path;
  const res = await fetch(url, {
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
  const url = API_BASE_URL
    ? `${API_BASE_URL}/api/entries/${encodeURIComponent(deviceId)}`
    : `/api/entries/${encodeURIComponent(deviceId)}`;
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Failed to load history (${res.status})`);
  }
  return (await res.json()) as Entry[];
}
