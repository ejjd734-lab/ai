import { useState } from "react";
import { type CarbonInput, type CarFuel, type DietType, emptyInput } from "../lib/types";

interface Props {
  onSubmit: (input: CarbonInput) => void;
  loading: boolean;
}

const DIET_OPTIONS: { value: DietType; label: string }[] = [
  { value: "heavy_meat", label: "Heavy meat eater (daily meat)" },
  { value: "medium_meat", label: "Average meat eater (most days)" },
  { value: "low_meat", label: "Low meat (a few times/week)" },
  { value: "pescatarian", label: "Pescatarian (fish but no meat)" },
  { value: "vegetarian", label: "Vegetarian" },
  { value: "vegan", label: "Vegan" },
];

const FUEL_OPTIONS: { value: CarFuel; label: string }[] = [
  { value: "petrol", label: "Petrol / Gasoline" },
  { value: "diesel", label: "Diesel" },
  { value: "hybrid", label: "Hybrid (petrol + electric)" },
  { value: "electric", label: "Fully electric" },
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
    <form className="card" onSubmit={handleSubmit} aria-labelledby="calc-heading" noValidate>
      <h2 id="calc-heading">Estimate your annual footprint</h2>
      <p className="form-intro" id="calc-desc">
        Enter your typical lifestyle details to estimate your annual carbon footprint in kg CO₂e.
      </p>

      <fieldset aria-describedby="transport-desc">
        <legend>Transport</legend>
        <p id="transport-desc" className="fieldset-hint">
          How you get around — car, public transit, and flights — is often the largest source.
        </p>
        <div className="field">
          <label htmlFor="car_km">Car distance per week (km)</label>
          <input
            id="car_km"
            type="number"
            min={0}
            step="any"
            inputMode="decimal"
            value={input.transport.car_km_per_week}
            onChange={num("transport", "car_km_per_week")}
            aria-describedby="car_km_hint"
          />
          <span id="car_km_hint" className="hint">Enter 0 if you don't own or regularly drive a car.</span>
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
            step="any"
            inputMode="decimal"
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
            step={1}
            inputMode="numeric"
            value={input.transport.short_haul_flights_per_year}
            onChange={num("transport", "short_haul_flights_per_year")}
            aria-describedby="short_flights_hint"
          />
          <span id="short_flights_hint" className="hint">Flights under ~3 hours / 1,100 km one-way.</span>
        </div>
        <div className="field">
          <label htmlFor="long_flights">Long-haul flights per year</label>
          <input
            id="long_flights"
            type="number"
            min={0}
            step={1}
            inputMode="numeric"
            value={input.transport.long_haul_flights_per_year}
            onChange={num("transport", "long_haul_flights_per_year")}
            aria-describedby="long_flights_hint"
          />
          <span id="long_flights_hint" className="hint">Flights over ~3 hours / 1,100 km one-way.</span>
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
            step="any"
            inputMode="decimal"
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
            step="any"
            inputMode="decimal"
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
            step={1}
            inputMode="numeric"
            value={input.home.household_size}
            onChange={num("home", "household_size")}
            aria-describedby="household_hint"
          />
          <span id="household_hint" className="hint">
            Home energy is shared across this many people.
          </span>
        </div>
      </fieldset>

      <fieldset>
        <legend>Diet &amp; consumption</legend>
        <div className="field">
          <label htmlFor="diet">Diet type</label>
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
            step="any"
            inputMode="decimal"
            value={input.consumption.goods_spend_usd_per_month}
            onChange={num("consumption", "goods_spend_usd_per_month")}
            aria-describedby="goods_hint"
          />
          <span id="goods_hint" className="hint">Clothing, electronics, household items, etc.</span>
        </div>
        <div className="field">
          <label htmlFor="waste">Landfill waste per week (kg)</label>
          <input
            id="waste"
            type="number"
            min={0}
            step="any"
            inputMode="decimal"
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
