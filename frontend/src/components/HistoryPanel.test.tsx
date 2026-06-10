import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { axe } from "vitest-axe";
import { HistoryPanel } from "./HistoryPanel";
import type { Entry } from "../lib/types";

const makeEntry = (id: string, tonnes: number, created_at: string): Entry => ({
  id,
  created_at,
  device_id: "device-test-001",
  input: {
    transport: {
      car_km_per_week: 0,
      car_fuel: "petrol",
      public_transit_km_per_week: 0,
      short_haul_flights_per_year: 0,
      long_haul_flights_per_year: 0,
    },
    home: { electricity_kwh_per_month: 0, natural_gas_kwh_per_month: 0, household_size: 1 },
    diet: "vegan",
    consumption: { goods_spend_usd_per_month: 0, waste_kg_per_week: 0 },
  },
  result: {
    breakdown_kg: { transport: 0, home: 0, diet: 1050, consumption: 0 },
    total_annual_kg: tonnes * 1000,
    total_annual_tonnes: tonnes,
    comparison: {
      global_average_annual_kg: 4800,
      sustainable_target_annual_kg: 2000,
      ratio_to_global_average: (tonnes * 1000) / 4800,
      ratio_to_sustainable_target: (tonnes * 1000) / 2000,
    },
  },
});

describe("HistoryPanel", () => {
  it("has no accessibility violations when empty", async () => {
    const { container } = render(<HistoryPanel entries={[]} />);
    expect(await axe(container)).toHaveNoViolations();
  });

  it("has no accessibility violations with entries", async () => {
    const entries = [
      makeEntry("e1", 3.0, new Date().toISOString()),
      makeEntry("e2", 3.5, new Date(Date.now() - 86400000).toISOString()),
    ];
    const { container } = render(<HistoryPanel entries={entries} />);
    expect(await axe(container)).toHaveNoViolations();
  });

  it("shows empty state message when no entries", () => {
    render(<HistoryPanel entries={[]} />);
    expect(screen.getByText(/no saved entries/i)).toBeInTheDocument();
  });

  it("renders a table when entries are present", () => {
    const entries = [makeEntry("e1", 3.0, new Date().toISOString())];
    render(<HistoryPanel entries={entries} />);
    expect(screen.getByRole("table")).toBeInTheDocument();
  });

  it("shows a downward trend indicator when latest is lower", () => {
    const entries = [
      makeEntry("e1", 2.5, new Date().toISOString()),
      makeEntry("e2", 3.5, new Date(Date.now() - 86400000).toISOString()),
    ];
    render(<HistoryPanel entries={entries} />);
    expect(screen.getByText(/down/i)).toBeInTheDocument();
  });

  it("shows an upward trend indicator when latest is higher", () => {
    const entries = [
      makeEntry("e1", 4.0, new Date().toISOString()),
      makeEntry("e2", 3.0, new Date(Date.now() - 86400000).toISOString()),
    ];
    render(<HistoryPanel entries={entries} />);
    expect(screen.getByText(/up/i)).toBeInTheDocument();
  });

  it("shows no-change text when footprints are equal", () => {
    const entries = [
      makeEntry("e1", 3.0, new Date().toISOString()),
      makeEntry("e2", 3.0, new Date(Date.now() - 86400000).toISOString()),
    ];
    render(<HistoryPanel entries={entries} />);
    expect(screen.getByText(/no change/i)).toBeInTheDocument();
  });
});
