"""Tests for the deterministic rule-based insights engine."""

from __future__ import annotations

from app.carbon import factors
from app.carbon.calculator import calculate_footprint
from app.insights.rules import generate_rule_based_insights
from app.models import CarbonInput, TransportInput


def _insights_for(data: CarbonInput):
    return generate_rule_based_insights(data, calculate_footprint(data))


def test_source_is_rules_and_has_summary():
    data = CarbonInput()
    resp = _insights_for(data)
    assert resp.source == "rules"
    assert resp.summary
    assert len(resp.recommendations) >= 1


def test_recommendations_target_largest_category_first():
    # Heavy car use makes transport dominate; it should be addressed first.
    data = CarbonInput(
        transport=TransportInput(car_km_per_week=500, car_fuel=factors.CarFuel.PETROL),
        diet=factors.DietType.VEGAN,
    )
    resp = _insights_for(data)
    assert resp.recommendations[0].category == "transport"


def test_high_meat_diet_yields_diet_recommendation():
    data = CarbonInput(diet=factors.DietType.HEAVY_MEAT)
    resp = _insights_for(data)
    categories = {r.category for r in resp.recommendations}
    assert "diet" in categories


def test_savings_are_positive_and_finite():
    data = CarbonInput(
        transport=TransportInput(car_km_per_week=300, short_haul_flights_per_year=4),
        diet=factors.DietType.HEAVY_MEAT,
    )
    resp = _insights_for(data)
    for rec in resp.recommendations:
        assert rec.estimated_annual_savings_kg > 0
        assert rec.action


def test_already_green_user_still_gets_constructive_summary():
    data = CarbonInput(diet=factors.DietType.VEGAN)
    resp = _insights_for(data)
    # Even a low footprint should produce a non-empty, encouraging response.
    assert resp.summary
    assert isinstance(resp.recommendations, list)
