import { useCallback, useEffect, useState } from "react";
import { CalculatorForm } from "./components/CalculatorForm";
import { ResultBreakdown } from "./components/ResultBreakdown";
import { InsightsPanel } from "./components/InsightsPanel";
import { HistoryPanel } from "./components/HistoryPanel";
import { ResultSkeleton } from "./components/ResultSkeleton";
import * as api from "./lib/api";
import { getDeviceId } from "./lib/deviceId";
import type { CarbonInput, Entry, FootprintResult, InsightsResponse } from "./lib/types";

export default function App() {
  const [deviceId] = useState(getDeviceId);
  const [result, setResult] = useState<FootprintResult | null>(null);
  const [lastInput, setLastInput] = useState<CarbonInput | null>(null);
  const [insights, setInsights] = useState<InsightsResponse | null>(null);
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Announced via a polite live region so screen reader users hear when
  // asynchronous results have arrived below the form.
  const [status, setStatus] = useState("");

  const loadHistory = useCallback(async () => {
    try {
      setEntries(await api.listEntries(deviceId));
    } catch {
      // History is non-critical; fail silently rather than blocking the app.
    }
  }, [deviceId]);

  useEffect(() => {
    void loadHistory();
  }, [loadHistory]);

  const handleCalculate = async (input: CarbonInput) => {
    setLoading(true);
    setError(null);
    setStatus("");
    // Clear previous results so the skeleton shows cleanly.
    setResult(null);
    setInsights(null);
    try {
      const [calc, ins] = await Promise.all([api.calculate(input), api.getInsights(input)]);
      setResult(calc);
      setInsights(ins);
      setLastInput(input);
      setStatus("Your footprint results and personalized insights are ready below.");
    } catch {
      setError("Something went wrong calculating your footprint. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!result || !lastInput) return;
    setSaving(true);
    setError(null);
    try {
      await api.saveEntry(deviceId, lastInput, result);
      await loadHistory();
      setStatus("Entry saved to your history.");
    } catch {
      setError("Could not save this entry. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const showSkeleton = loading;
  const showResults = !loading && result !== null;

  return (
    <>
      <a className="skip-link" href="#main">
        Skip to main content
      </a>
      <header className="app-header">
        <h1>Carbon Footprint Awareness Platform</h1>
        <p>Understand, track, and reduce your carbon footprint.</p>
      </header>

      <main id="main">
        <CalculatorForm onSubmit={handleCalculate} loading={loading} />

        <div role="alert" aria-live="assertive">
          {error && <p className="error">{error}</p>}
        </div>
        <p role="status" className="visually-hidden">
          {status}
        </p>

        {/* Skeleton while loading */}
        {showSkeleton && <ResultSkeleton />}

        {/* Real results once loaded */}
        {showResults && (
          <>
            <ResultBreakdown result={result!} />
            {insights && <InsightsPanel insights={insights} />}
            <div className="card">
              <button
                className="btn secondary"
                onClick={handleSave}
                disabled={saving}
                aria-busy={saving}
              >
                {saving ? "Saving…" : "Save this entry to my history"}
              </button>
            </div>
          </>
        )}

        <HistoryPanel entries={entries} />
      </main>
    </>
  );
}
