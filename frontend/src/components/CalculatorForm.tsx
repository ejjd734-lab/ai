import { useState } from "react";
import { type CarbonInput, type CarFuel, type DietType, emptyInput } from "../lib/types";

interface Props {
  onSubmit: (input: CarbonInput) => void;
  loading: boolean;
}

// Input ceilings mirror the backend Pydantic bounds (app/models.py) so the
// browser blocks out-of-range values before the API would reject them.
const MAX_KM_WEEK = 20_000;
const MAX_KWH_MONTH = 100_000;
const MAX_FLIGHTS = 200;
const MAX_USD_MONTH = 1_000_000;
const MAX_WASTE_WEEK = 1_000;
const MAX_HOUSEHOLD = 50;

const DIET_OPTIONS: { value: DietType; label: string }[] = [
  { value: "heavy_meat", label: "Heavy meat eater" },
  { value: "medium_meat", label: "Average meat eater" },
  { value: "low_meat", label: "Low meat" },
  { value: "pescatarian", label: "Pescatarian" },
  { value: "vegetarian", label: "Vegetarian" },
  { value: "vegan", label: "Vegan" },
];

const FUEL_OPTIONS: { value: CarFuel; label: string }[] = [
  { value: "petrol", label: "Petrol" },
  { value: "diesel", label: "Diesel" },
  { value: "hybrid", label: "Hybrid" },
  { value: "electric", label: "Electric" },
];

/** Accessible footprint input form: labelled controls grouped in fieldsets. */
export function CalculatorForm({ onSubmit, loading }: Props) {
  const [input, setInput] = useState<CarbonInput>(emptyInput);

  const num =
    (section: keyof CarbonInput, key: string) =>
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = Number(e.target.value);
      setInput((prev) => ({
        ...prev,
        [section]: { ...(prev[section] as object), [key]: Number.isNaN(value) ? 0 : value },
      }));
    };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(input);
  };

  return (
    <form className="card" onSubmit={handleSubmit} aria-labelledby="calc-heading">
      <h2 id="calc-heading">Estimate your annual footprint</h2>

      <fieldset>
        <legend>Transport</legend>
        <div className="field">
          <label htmlFor="car_km">Car distance per week (km)</label>
          <input
            id="car_km"
            type="number"
            min={0}
            max={MAX_KM_WEEK}
            step="any"
            inputMode="decimal"
            value={input.transport.car_km_per_week}
            onChange={num("transport", "car_km_per_week")}
          />
        </div>
        <div className="field">
          <label htmlFor="car_fuel">Car fuel type</label>
          <select
            id="car_fuel"
            value={input.transport.car_fuel}
            onChange={(e) =>
              setInput((p) => ({
                ...p,
                transport: { ...p.transport, car_fuel: e.target.value as CarFuel },
              }))
            }
          >
            {FUEL_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
        <div className="field">
          <label htmlFor="transit_km">Public transit per week (km)</label>
          <input
            id="transit_km"
            type="number"
            min={0}
            max={MAX_KM_WEEK}
            step="any"
            value={input.transport.public_transit_km_per_week}
            onChange={num("transport", "public_transit_km_per_week")}
          />
        </div>
        <div className="field">
          <label htmlFor="short_flights">Short-haul flights per year</label>
          <input
            id="short_flights"
            type="number"
            min={0}
            max={MAX_FLIGHTS}
            step={1}
            value={input.transport.short_haul_flights_per_year}
            onChange={num("transport", "short_haul_flights_per_year")}
          />
        </div>
        <div className="field">
          <label htmlFor="long_flights">Long-haul flights per year</label>
          <input
            id="long_flights"
            type="number"
            min={0}
            max={MAX_FLIGHTS}
            step={1}
            value={input.transport.long_haul_flights_per_year}
            onChange={num("transport", "long_haul_flights_per_year")}
          />
        </div>
      </fieldset>

      <fieldset>
        <legend>Home energy</legend>
        <div className="field">
          <label htmlFor="electricity">Electricity per month (kWh)</label>
          <input
            id="electricity"
            type="number"
            min={0}
            max={MAX_KWH_MONTH}
            step="any"
            value={input.home.electricity_kwh_per_month}
            onChange={num("home", "electricity_kwh_per_month")}
          />
        </div>
        <div className="field">
          <label htmlFor="gas">Natural gas per month (kWh)</label>
          <input
            id="gas"
            type="number"
            min={0}
            max={MAX_KWH_MONTH}
            step="any"
            value={input.home.natural_gas_kwh_per_month}
            onChange={num("home", "natural_gas_kwh_per_month")}
          />
        </div>
        <div className="field">
          <label htmlFor="household">People in household</label>
          <input
            id="household"
            type="number"
            min={1}
            max={MAX_HOUSEHOLD}
            step={1}
            aria-describedby="household-hint"
            value={input.home.household_size}
            onChange={num("home", "household_size")}
          />
          <span className="hint" id="household-hint">
            Home energy is shared across this many people.
          </span>
        </div>
      </fieldset>

      <fieldset>
        <legend>Diet &amp; consumption</legend>
        <div className="field">
          <label htmlFor="diet">Diet</label>
          <select
            id="diet"
            value={input.diet}
            onChange={(e) => setInput((p) => ({ ...p, diet: e.target.value as DietType }))}
          >
            {DIET_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
        <div className="field">
          <label htmlFor="goods">Goods spending per month (USD)</label>
          <input
            id="goods"
            type="number"
            min={0}
            max={MAX_USD_MONTH}
            step="any"
            value={input.consumption.goods_spend_usd_per_month}
            onChange={num("consumption", "goods_spend_usd_per_month")}
          />
        </div>
        <div className="field">
          <label htmlFor="waste">Landfill waste per week (kg)</label>
          <input
            id="waste"
            type="number"
            min={0}
            max={MAX_WASTE_WEEK}
            step="any"
            value={input.consumption.waste_kg_per_week}
            onChange={num("consumption", "waste_kg_per_week")}
          />
        </div>
      </fieldset>

      <button className="btn" type="submit" disabled={loading} aria-busy={loading}>
        {loading ? "Calculating…" : "Calculate my footprint"}
      </button>
    </form>
  );
}
