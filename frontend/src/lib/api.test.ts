import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { calculate, getInsights, saveEntry, listEntries } from "./api";
import type { CarbonInput, FootprintResult } from "./types";

const mockInput: CarbonInput = {
  transport: {
    car_km_per_week: 100,
    car_fuel: "petrol",
    public_transit_km_per_week: 0,
    short_haul_flights_per_year: 0,
    long_haul_flights_per_year: 0,
  },
  home: { electricity_kwh_per_month: 200, natural_gas_kwh_per_month: 0, household_size: 2 },
  diet: "vegan",
  consumption: { goods_spend_usd_per_month: 100, waste_kg_per_week: 2 },
};

const mockResult: FootprintResult = {
  breakdown_kg: { transport: 884, home: 540, diet: 1050, consumption: 540 },
  total_annual_kg: 3014,
  total_annual_tonnes: 3.014,
  comparison: {
    global_average_annual_kg: 4800,
    sustainable_target_annual_kg: 2000,
    ratio_to_global_average: 0.628,
    ratio_to_sustainable_target: 1.507,
  },
};

beforeEach(() => {
  vi.stubGlobal("fetch", vi.fn());
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("api.calculate", () => {
  it("POSTs to /api/calculate and returns FootprintResult", async () => {
    vi.mocked(fetch).mockResolvedValueOnce(
      new Response(JSON.stringify(mockResult), { status: 200 }),
    );
    const result = await calculate(mockInput);
    expect(result.total_annual_kg).toBe(3014);
    expect(fetch).toHaveBeenCalledWith("/api/calculate", expect.objectContaining({ method: "POST" }));
  });

  it("throws on non-OK status", async () => {
    vi.mocked(fetch).mockResolvedValueOnce(new Response("{}", { status: 422 }));
    await expect(calculate(mockInput)).rejects.toThrow(/422/);
  });
});

describe("api.getInsights", () => {
  it("POSTs to /api/insights", async () => {
    const insights = { summary: "Good", recommendations: [], source: "rules" };
    vi.mocked(fetch).mockResolvedValueOnce(
      new Response(JSON.stringify(insights), { status: 200 }),
    );
    const result = await getInsights(mockInput);
    expect(result.source).toBe("rules");
  });
});

describe("api.saveEntry", () => {
  it("POSTs to /api/entries with device_id, input, result", async () => {
    const entry = { id: "e1", created_at: new Date().toISOString(), device_id: "dev-abc", input: mockInput, result: mockResult };
    vi.mocked(fetch).mockResolvedValueOnce(
      new Response(JSON.stringify(entry), { status: 201 }),
    );
    const result = await saveEntry("dev-abc", mockInput, mockResult);
    expect(result.id).toBe("e1");
    const body = JSON.parse(vi.mocked(fetch).mock.calls[0][1]!.body as string);
    expect(body.device_id).toBe("dev-abc");
  });
});

describe("api.listEntries", () => {
  it("GETs /api/entries/{deviceId}", async () => {
    vi.mocked(fetch).mockResolvedValueOnce(
      new Response(JSON.stringify([]), { status: 200 }),
    );
    const result = await listEntries("dev-abc");
    expect(result).toEqual([]);
    expect(fetch).toHaveBeenCalledWith("/api/entries/dev-abc");
  });

  it("throws on non-OK response", async () => {
    vi.mocked(fetch).mockResolvedValueOnce(new Response("{}", { status: 500 }));
    await expect(listEntries("dev-abc")).rejects.toThrow(/500/);
  });
});
