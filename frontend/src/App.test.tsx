import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "vitest-axe";
import App from "./App";
import type { FootprintResult, InsightsResponse } from "./lib/types";

// Mock the API layer so the integration test runs without a backend.
vi.mock("./lib/api", () => ({
  calculate: vi.fn(),
  getInsights: vi.fn(),
  saveEntry: vi.fn(),
  listEntries: vi.fn(),
}));

import * as api from "./lib/api";

const result: FootprintResult = {
  breakdown_kg: { transport: 2000, home: 1000, diet: 1500, consumption: 500 },
  total_annual_kg: 5000,
  total_annual_tonnes: 5.0,
  comparison: {
    global_average_annual_kg: 4800,
    sustainable_target_annual_kg: 2000,
    ratio_to_global_average: 1.04,
    ratio_to_sustainable_target: 2.5,
  },
};

const insights: InsightsResponse = {
  summary: "Your footprint is above the sustainable target.",
  recommendations: [
    { category: "transport", action: "Drive less", estimated_annual_savings_kg: 400 },
  ],
  source: "rules",
};

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(api.listEntries).mockResolvedValue([]);
  vi.mocked(api.calculate).mockResolvedValue(result);
  vi.mocked(api.getInsights).mockResolvedValue(insights);
  vi.mocked(api.saveEntry).mockResolvedValue({
    id: "e1",
    created_at: new Date().toISOString(),
    device_id: "dev-123",
    input: {} as never,
    result,
  });
});

describe("App", () => {
  it("renders with no accessibility violations", async () => {
    const { container } = render(<App />);
    expect(await axe(container)).toHaveNoViolations();
  });

  it("calculates and shows results plus personalized insights", async () => {
    render(<App />);
    await userEvent.click(screen.getByRole("button", { name: /calculate my footprint/i }));

    await waitFor(() => expect(screen.getByText(/your estimated footprint/i)).toBeInTheDocument());
    expect(screen.getByText(/personalized insights/i)).toBeInTheDocument();
    expect(screen.getByText(/drive less/i)).toBeInTheDocument();
    expect(api.calculate).toHaveBeenCalledTimes(1);
  });

  it("saves an entry and reloads history", async () => {
    render(<App />);
    await userEvent.click(screen.getByRole("button", { name: /calculate my footprint/i }));
    await waitFor(() => screen.getByRole("button", { name: /save this entry/i }));
    await userEvent.click(screen.getByRole("button", { name: /save this entry/i }));

    await waitFor(() => expect(api.saveEntry).toHaveBeenCalledTimes(1));
    // listEntries: once on mount, once after save.
    expect(api.listEntries).toHaveBeenCalledTimes(2);
  });

  it("shows an error message when calculation fails", async () => {
    vi.mocked(api.calculate).mockRejectedValueOnce(new Error("boom"));
    render(<App />);
    await userEvent.click(screen.getByRole("button", { name: /calculate my footprint/i }));
    await waitFor(() => expect(screen.getByRole("alert")).toHaveTextContent(/something went wrong/i));
  });
});
