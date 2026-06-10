"""Tests for the Gemini insights service and its graceful fallback."""

from __future__ import annotations

import app.insights.gemini as gemini
from app.carbon.calculator import calculate_footprint
from app.config import Settings
from app.models import CarbonInput, InsightsResponse, Recommendation


def _ctx():
    data = CarbonInput()
    return data, calculate_footprint(data)


def test_disabled_gemini_uses_rules():
    data, result = _ctx()
    resp = gemini.generate_insights(data, result, Settings(use_gemini=False))
    assert resp.source == "rules"


def test_gemini_failure_falls_back_to_rules(monkeypatch):
    def boom(*_args, **_kwargs):
        raise RuntimeError("vertex unavailable")

    monkeypatch.setattr(gemini, "_call_gemini", boom)
    data, result = _ctx()
    resp = gemini.generate_insights(data, result, Settings(use_gemini=True))
    assert resp.source == "rules"
    assert resp.recommendations  # fallback still produces advice


def test_gemini_success_path(monkeypatch):
    canned = InsightsResponse(
        summary="Great progress!",
        recommendations=[
            Recommendation(category="diet", action="Eat more plants", estimated_annual_savings_kg=200.0)
        ],
        source="gemini",
    )
    monkeypatch.setattr(gemini, "_call_gemini", lambda *_a, **_k: canned)
    data, result = _ctx()
    resp = gemini.generate_insights(data, result, Settings(use_gemini=True))
    assert resp.source == "gemini"
    assert resp.summary == "Great progress!"
