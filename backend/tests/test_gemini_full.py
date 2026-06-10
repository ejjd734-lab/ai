"""Extended tests to cover _build_prompt and the _call_gemini path."""

from __future__ import annotations

import json

import pytest
from app.carbon.calculator import calculate_footprint
from app.config import Settings
from app.insights import gemini as gemini_mod
from app.insights.gemini import _build_prompt
from app.models import CarbonInput


def _ctx():
    data = CarbonInput()
    return data, calculate_footprint(data)


# ── _build_prompt coverage ───────────────────────────────────────────────────

def test_build_prompt_contains_breakdown():
    data, result = _ctx()
    prompt = _build_prompt(data, result)
    # The prompt must embed the JSON breakdown.
    assert json.dumps(result.breakdown_kg)[:20] in prompt
    assert str(result.total_annual_kg) in prompt
    assert data.diet.value in prompt
    assert data.transport.car_fuel.value in prompt


# ── _call_gemini mock — success path with full structured response ───────────

def test_call_gemini_parses_structured_response(monkeypatch):
    """Simulate a valid Vertex AI response and verify parsing."""

    class _FakeResponse:
        text = json.dumps(
            {
                "summary": "Good job!",
                "recommendations": [
                    {
                        "category": "diet",
                        "action": "Eat less meat.",
                        "estimated_annual_savings_kg": 600.0,
                    }
                ],
            }
        )

    class _FakeModels:
        def generate_content(self, **kwargs):
            return _FakeResponse()

    class _FakeClient:
        models = _FakeModels()

    class _FakeGenai:
        @staticmethod
        def Client(**kwargs):
            return _FakeClient()

        class types:
            @staticmethod
            def GenerateContentConfig(**kwargs):
                return {}

    import sys

    # Inject a fake `google.genai` module so _call_gemini can import it.
    import types as types_mod

    fake_google = types_mod.ModuleType("google")
    fake_genai_mod = types_mod.ModuleType("google.genai")
    fake_genai_mod.Client = _FakeGenai.Client
    fake_types_mod = types_mod.ModuleType("google.genai.types")

    class _GenerateContentConfig:
        def __init__(self, **kwargs):
            pass

    fake_types_mod.GenerateContentConfig = _GenerateContentConfig
    fake_genai_mod.types = fake_types_mod
    fake_google.genai = fake_genai_mod

    monkeypatch.setitem(sys.modules, "google", fake_google)
    monkeypatch.setitem(sys.modules, "google.genai", fake_genai_mod)
    monkeypatch.setitem(sys.modules, "google.genai.types", fake_types_mod)

    data, result = _ctx()
    settings = Settings(use_gemini=True)
    resp = gemini_mod._call_gemini(data, result, settings)
    assert resp.source == "gemini"
    assert resp.summary == "Good job!"
    assert len(resp.recommendations) == 1
    assert resp.recommendations[0].category == "diet"


def test_call_gemini_raises_when_no_recommendations(monkeypatch):
    """_call_gemini should raise ValueError if Gemini returns no recommendations."""

    class _FakeResponse:
        text = json.dumps({"summary": "Nothing to say.", "recommendations": []})

    class _FakeModels:
        def generate_content(self, **kwargs):
            return _FakeResponse()

    class _FakeClient:
        models = _FakeModels()

    import sys
    import types as types_mod

    fake_google = types_mod.ModuleType("google")
    fake_genai_mod = types_mod.ModuleType("google.genai")
    fake_genai_mod.Client = lambda **kw: _FakeClient()
    fake_types_mod = types_mod.ModuleType("google.genai.types")

    class _Config:
        def __init__(self, **kwargs):
            pass

    fake_types_mod.GenerateContentConfig = _Config
    fake_genai_mod.types = fake_types_mod
    fake_google.genai = fake_genai_mod

    monkeypatch.setitem(sys.modules, "google", fake_google)
    monkeypatch.setitem(sys.modules, "google.genai", fake_genai_mod)
    monkeypatch.setitem(sys.modules, "google.genai.types", fake_types_mod)

    data, result = _ctx()
    with pytest.raises(ValueError, match="no recommendations"):
        gemini_mod._call_gemini(data, result, Settings(use_gemini=True))
