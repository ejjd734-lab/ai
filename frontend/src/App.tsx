import { useCallback, useEffect, useState } from "react";
import { CalculatorForm } from "./components/CalculatorForm";
import { ResultBreakdown } from "./components/ResultBreakdown";
import { InsightsPanel } from "./components/InsightsPanel";
import { HistoryPanel } from "./components/HistoryPanel";
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
    try {
      const [calc, ins] = await Promise.all([api.calculate(input), api.getInsights(input)]);
      setResult(calc);
      setInsights(ins);
      setLastInput(input);
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
    } catch {
      setError("Could not save this entry. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <a className="skip-link" href="#main">
        Skip to main content
      </a>
      <header className="app-header" role="banner">
        <h1>🌱 Carbon Footprint Awareness Platform</h1>
        <p>Understand, track, and reduce your carbon footprint.</p>
      </header>

      <main id="main" role="main">
        <CalculatorForm onSubmit={handleCalculate} loading={loading} />

        {/* Loading status announced to screen readers */}
        <div role="status" aria-live="polite" aria-atomic="true" className="visually-hidden">
          {loading ? "Calculating your carbon footprint…" : ""}
          {saving ? "Saving your entry…" : ""}
        </div>

        <div role="alert" aria-live="assertive">
          {error && <p className="error">{error}</p>}
        </div>

        {result && (
          <>
            <ResultBreakdown result={result} />
            {insights && <InsightsPanel insights={insights} />}
            <div className="card">
              <button className="btn secondary" onClick={handleSave} disabled={saving}
                aria-busy={saving}>
                {saving ? "Saving…" : "Save this entry to my history"}
              </button>
            </div>
          </>
        )}

        <HistoryPanel entries={entries} />
      </main>

      <footer role="contentinfo" className="app-footer">
        <p>Your data is stored anonymously by device. No account or login required.</p>
      </footer>
    </>
  );
}
