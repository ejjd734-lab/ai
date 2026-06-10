"""Tests for the SPA mount / static file serving paths in main.py."""

from __future__ import annotations

from unittest.mock import patch


def test_spa_api_path_returns_json_404(client):
    """API paths that don't exist should return JSON 404, not the SPA."""
    resp = client.get("/api/nonexistent-route")
    assert resp.status_code == 404
    assert resp.headers["content-type"].startswith("application/json")


def test_nonexistent_static_file_serves_index(tmp_path, monkeypatch):
    """Unknown paths should fall through to index.html when static dir exists."""
    # Create a minimal static dir with index.html.
    static_dir = tmp_path / "static"
    static_dir.mkdir()
    (static_dir / "index.html").write_text("<html><body>App</body></html>")

    from app import main as main_mod
    monkeypatch.setattr(main_mod, "_STATIC_DIR", static_dir)

    # Clear caches so the patched value is picked up.
    from app import config, deps
    config.get_settings.cache_clear()
    deps.get_repository.cache_clear()

    monkeypatch.setenv("USE_GEMINI", "false")
    monkeypatch.setenv("USE_FIRESTORE", "false")

    from app.main import create_app
    from fastapi.testclient import TestClient

    with TestClient(create_app()) as test_client:
        resp = test_client.get("/some/unknown/path")
        assert resp.status_code == 200
        assert b"App" in resp.content

    config.get_settings.cache_clear()
    deps.get_repository.cache_clear()


def test_existing_static_file_served_directly(tmp_path, monkeypatch):
    """A real file under static/ should be returned directly."""
    static_dir = tmp_path / "static"
    static_dir.mkdir()
    (static_dir / "index.html").write_text("<html>Index</html>")
    (static_dir / "robots.txt").write_text("User-agent: *\nDisallow:\n")

    assets_dir = static_dir / "assets"
    assets_dir.mkdir()
    (assets_dir / "app.js").write_text("console.log('hi');")

    from app import main as main_mod
    monkeypatch.setattr(main_mod, "_STATIC_DIR", static_dir)

    from app import config, deps
    config.get_settings.cache_clear()
    deps.get_repository.cache_clear()

    monkeypatch.setenv("USE_GEMINI", "false")
    monkeypatch.setenv("USE_FIRESTORE", "false")

    from app.main import create_app
    from fastapi.testclient import TestClient

    with TestClient(create_app()) as test_client:
        resp = test_client.get("/robots.txt")
        assert resp.status_code == 200
        assert b"User-agent" in resp.content

    config.get_settings.cache_clear()
    deps.get_repository.cache_clear()


def test_deps_firestore_branch(monkeypatch):
    """Verify the Firestore repository branch in deps is reachable."""
    monkeypatch.setenv("USE_FIRESTORE", "true")

    from app import config, deps
    config.get_settings.cache_clear()
    deps.get_repository.cache_clear()

    # We don't have real Firestore credentials — patch the constructor.
    class _FakeFirestoreRepo:
        def __init__(self, project_id: str):
            self.project_id = project_id

    with patch("app.deps.FirestoreEntryRepository", _FakeFirestoreRepo, create=True):
        # Also patch the import inside deps
        import app.repository.firestore_repo as fr_mod
        original_cls = getattr(fr_mod, "FirestoreEntryRepository", None)
        fr_mod.FirestoreEntryRepository = _FakeFirestoreRepo  # type: ignore[attr-defined]
        try:
            repo = deps.get_repository()
            assert isinstance(repo, _FakeFirestoreRepo)
        finally:
            if original_cls is not None:
                fr_mod.FirestoreEntryRepository = original_cls  # type: ignore[attr-defined]
            deps.get_repository.cache_clear()
            config.get_settings.cache_clear()


def test_spa_handler_api_prefix_returns_json_404(tmp_path, monkeypatch):
    """The SPA catch-all handler should return JSON 404 for api/ paths."""
    static_dir = tmp_path / "static"
    static_dir.mkdir()
    (static_dir / "index.html").write_text("<html><body>App</body></html>")

    from app import main as main_mod
    monkeypatch.setattr(main_mod, "_STATIC_DIR", static_dir)

    from app import config, deps
    config.get_settings.cache_clear()
    deps.get_repository.cache_clear()
    monkeypatch.setenv("USE_GEMINI", "false")
    monkeypatch.setenv("USE_FIRESTORE", "false")

    from app.main import create_app
    from fastapi.testclient import TestClient

    with TestClient(create_app(), raise_server_exceptions=False) as test_client:
        # This path hits the SPA route (not a registered API route)
        # and starts with "api/" → should return JSON 404
        resp = test_client.get("/api/does-not-exist-in-spa")
        assert resp.status_code == 404
        assert resp.headers["content-type"].startswith("application/json")

    config.get_settings.cache_clear()
    deps.get_repository.cache_clear()
