"""Extended tests to cover every branch of the rule-based insights engine."""

from __future__ import annotations

from app.carbon import factors
from app.carbon.calculator import calculate_footprint
from app.insights.rules import (
    _consumption_recommendation,
    _diet_recommendation,
    _home_recommendation,
    _transport_recommendation,
    generate_rule_based_insights,
)
from app.models import CarbonInput, TransportInput

# ── _home_recommendation ────────────────────────────────────────────────────

def test_home_recommendation_zero_amount_returns_none():
    assert _home_recommendation(0.0) is None


def test_home_recommendation_positive_returns_rec():
    rec = _home_recommendation(3000.0)
    assert rec is not None
    assert rec.category == "home"
    assert rec.estimated_annual_savings_kg > 0


# ── _consumption_recommendation ─────────────────────────────────────────────

def test_consumption_recommendation_zero_returns_none():
    assert _consumption_recommendation(0.0) is None


def test_consumption_recommendation_positive_returns_rec():
    rec = _consumption_recommendation(1000.0)
    assert rec is not None
    assert rec.category == "consumption"
    assert rec.estimated_annual_savings_kg > 0


# ── _diet_recommendation ─────────────────────────────────────────────────────

def test_diet_recommendation_vegan_returns_none():
    """Already at the lowest-footprint diet — nothing greener to suggest."""
    data = CarbonInput(diet=factors.DietType.VEGAN)
    assert _diet_recommendation(data) is None


def test_diet_recommendation_non_vegan_returns_rec():
    """Every non-vegan diet should produce a recommendation."""
    for diet in [
        factors.DietType.HEAVY_MEAT,
        factors.DietType.MEDIUM_MEAT,
        factors.DietType.LOW_MEAT,
        factors.DietType.PESCATARIAN,
        factors.DietType.VEGETARIAN,
    ]:
        data = CarbonInput(diet=diet)
        rec = _diet_recommendation(data)
        assert rec is not None, f"Expected rec for {diet}"
        assert rec.estimated_annual_savings_kg > 0


# ── _transport_recommendation — flying branch ───────────────────────────────

def test_transport_recommendation_flight_dominated_returns_flight_advice():
    """When flying dominates driving, the recommendation targets aviation."""
    data = CarbonInput(
        transport=TransportInput(
            long_haul_flights_per_year=5,
            short_haul_flights_per_year=0,
            car_km_per_week=0,  # no driving → flights clearly dominate
        ),
        diet=factors.DietType.VEGAN,
    )
    result = calculate_footprint(data)
    rec = _transport_recommendation(data, result.breakdown_kg["transport"])
    assert rec is not None
    assert "flight" in rec.action.lower() or "aviation" in rec.action.lower() or "rail" in rec.action.lower()


def test_transport_recommendation_car_non_electric():
    """Non-electric car usage should return an EV-switch recommendation."""
    data = CarbonInput(
        transport=TransportInput(car_km_per_week=200, car_fuel=factors.CarFuel.PETROL),
        diet=factors.DietType.VEGAN,
    )
    result = calculate_footprint(data)
    rec = _transport_recommendation(data, result.breakdown_kg["transport"])
    assert rec is not None
    assert rec.category == "transport"
    assert rec.estimated_annual_savings_kg > 0


def test_transport_recommendation_electric_car_fallback():
    """Electric car with no other transport → generic carpool advice."""
    data = CarbonInput(
        transport=TransportInput(car_km_per_week=100, car_fuel=factors.CarFuel.ELECTRIC),
        diet=factors.DietType.VEGAN,
    )
    result = calculate_footprint(data)
    rec = _transport_recommendation(data, result.breakdown_kg["transport"])
    # Should still return something (carpool fallback)
    assert rec is not None


def test_transport_recommendation_zero_transport_returns_none():
    """Zero emissions from all transport sub-sources → no recommendation."""
    data = CarbonInput(diet=factors.DietType.VEGAN)
    rec = _transport_recommendation(data, 0.0)
    assert rec is None


# ── generate_rule_based_insights — summary branch ────────────────────────────

def test_below_target_summary_positive_message():
    """A footprint already at or below the target gets an encouraging summary."""
    data = CarbonInput(diet=factors.DietType.VEGAN)
    result = calculate_footprint(data)
    # Vegan-only footprint is 1050 kg < 2000 kg target
    resp = generate_rule_based_insights(data, result)
    assert resp.source == "rules"
    assert "keep it up" in resp.summary.lower() or "below" in resp.summary.lower()


def test_above_target_summary_mentions_gap():
    """A high footprint summary should mention being above the target."""
    data = CarbonInput(diet=factors.DietType.HEAVY_MEAT)
    result = calculate_footprint(data)
    resp = generate_rule_based_insights(data, result)
    assert "above" in resp.summary.lower() or "target" in resp.summary.lower()
