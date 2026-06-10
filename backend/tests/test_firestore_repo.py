"""Tests for the Firestore repository (using a mock Firestore client)."""

from __future__ import annotations

import sys
import types as types_mod
from datetime import datetime, timezone
from unittest.mock import MagicMock

import pytest
from app.carbon.calculator import calculate_footprint
from app.models import CarbonInput


def _make_fake_firestore():
    """Build a minimal mock of google.cloud.firestore sufficient for our repo."""
    firestore_mod = types_mod.ModuleType("google.cloud.firestore")

    class _Query:
        DESCENDING = "DESCENDING"

    firestore_mod.Query = _Query

    # Chain: db.collection().document().collection().document().set()
    def _make_doc_ref():
        doc_ref = MagicMock()
        doc_ref.set = MagicMock()
        return doc_ref

    def _make_sub_coll(entries: list):
        sub_coll = MagicMock()
        sub_coll.document.return_value = _make_doc_ref()

        def _order_by(*a, **kw):
            return sub_coll

        def _limit(*a, **kw):
            return sub_coll

        sub_coll.order_by.side_effect = _order_by
        sub_coll.limit.side_effect = _limit
        sub_coll.stream.return_value = iter(entries)
        return sub_coll

    def _make_device_doc(entries: list):
        doc = MagicMock()
        doc.collection.return_value = _make_sub_coll(entries)
        return doc

    def _make_collection(entries: list):
        coll = MagicMock()
        coll.document.return_value = _make_device_doc(entries)
        return coll

    class _FakeClient:
        def __init__(self, project=None):
            self._entries: list = []

        def collection(self, name):
            return _make_collection(self._entries)

    firestore_mod.Client = _FakeClient
    return firestore_mod


@pytest.fixture(autouse=False)
def fake_firestore(monkeypatch):
    firestore_mod = _make_fake_firestore()
    google_mod = types_mod.ModuleType("google")
    cloud_mod = types_mod.ModuleType("google.cloud")

    cloud_mod.firestore = firestore_mod
    google_mod.cloud = cloud_mod

    monkeypatch.setitem(sys.modules, "google", google_mod)
    monkeypatch.setitem(sys.modules, "google.cloud", cloud_mod)
    monkeypatch.setitem(sys.modules, "google.cloud.firestore", firestore_mod)

    yield firestore_mod


def test_firestore_add_returns_entry(fake_firestore):
    from app.repository.firestore_repo import FirestoreEntryRepository

    repo = FirestoreEntryRepository(project_id="test-project")
    data = CarbonInput()
    result = calculate_footprint(data)

    entry = repo.add("device-test-abc123", data, result)
    assert entry.id
    assert entry.device_id == "device-test-abc123"
    assert entry.created_at
    assert entry.result.total_annual_kg == result.total_annual_kg


def test_firestore_list_empty_returns_empty_list(fake_firestore):
    from app.repository.firestore_repo import FirestoreEntryRepository

    repo = FirestoreEntryRepository(project_id="test-project")
    entries = repo.list_for_device("device-test-abc123")
    assert entries == []



def test_firestore_list_with_snapshots(fake_firestore):
    """list_for_device should parse Firestore snapshots into Entry objects."""
    from app.repository.firestore_repo import FirestoreEntryRepository

    data = CarbonInput()
    result = calculate_footprint(data)

    # Build a fake snapshot.
    snap = MagicMock()
    snap.id = "entry-001"
    snap.to_dict.return_value = {
        "created_at": datetime.now(timezone.utc).isoformat(),
        "input": data.model_dump(mode="json"),
        "result": result.model_dump(mode="json"),
    }

    def _make_sub_coll_with(snaps):
        sub_coll = MagicMock()
        sub_coll.order_by.return_value = sub_coll
        sub_coll.limit.return_value = sub_coll
        sub_coll.stream.return_value = iter(snaps)
        return sub_coll

    class _FakeClientWithSnaps:
        def __init__(self, snaps, project=None):
            self._snaps = snaps

        def collection(self, name):
            coll = MagicMock()
            doc = MagicMock()
            doc.collection.return_value = _make_sub_coll_with(self._snaps)
            coll.document.return_value = doc
            return coll

    fake_firestore.Client = lambda project=None: _FakeClientWithSnaps([snap])

    repo = FirestoreEntryRepository(project_id="test-project")
    entries = repo.list_for_device("device-test-abc123")
    assert len(entries) == 1
    assert entries[0].id == "entry-001"
    assert entries[0].device_id == "device-test-abc123"
