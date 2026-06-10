import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { axe } from "vitest-axe";
import { InsightsPanel } from "./InsightsPanel";
import type { InsightsResponse } from "../lib/types";

const rulesInsights: InsightsResponse = {
  summary: "Your footprint is above the sustainable target.",
  recommendations: [
    { category: "transport", action: "Drive less and carpool.", estimated_annual_savings_kg: 400 },
    { category: "diet", action: "Shift to a plant-based diet.", estimated_annual_savings_kg: 800 },
  ],
  source: "rules",
};

const geminiInsights: InsightsResponse = {
  summary: "Great progress on reducing your footprint!",
  recommendations: [
    { category: "home", action: "Switch to renewable energy.", estimated_annual_savings_kg: 600 },
  ],
  source: "gemini",
};

describe("InsightsPanel", () => {
  it("has no accessibility violations (rules source)", async () => {
    const { container } = render(<InsightsPanel insights={rulesInsights} />);
    expect(await axe(container)).toHaveNoViolations();
  });

  it("has no accessibility violations (gemini source)", async () => {
    const { container } = render(<InsightsPanel insights={geminiInsights} />);
    expect(await axe(container)).toHaveNoViolations();
  });

  it("shows the summary text", () => {
    render(<InsightsPanel insights={rulesInsights} />);
    expect(screen.getByText(/above the sustainable target/i)).toBeInTheDocument();
  });

  it("labels source as 'Smart rules' for rules engine", () => {
    render(<InsightsPanel insights={rulesInsights} />);
    expect(screen.getByText("Smart rules")).toBeInTheDocument();
  });

  it("labels source as 'AI-personalized' for gemini engine", () => {
    render(<InsightsPanel insights={geminiInsights} />);
    expect(screen.getByText("AI-personalized")).toBeInTheDocument();
  });

  it("renders all recommendations", () => {
    render(<InsightsPanel insights={rulesInsights} />);
    expect(screen.getByText(/drive less/i)).toBeInTheDocument();
    expect(screen.getByText(/plant-based diet/i)).toBeInTheDocument();
  });

  it("shows the estimated annual savings for each recommendation", () => {
    render(<InsightsPanel insights={rulesInsights} />);
    expect(screen.getByText(/400/)).toBeInTheDocument();
  });

  it("renders category labels in friendly format", () => {
    render(<InsightsPanel insights={rulesInsights} />);
    expect(screen.getByText(/Transport:/i)).toBeInTheDocument();
  });
});
