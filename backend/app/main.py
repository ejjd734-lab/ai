"""FastAPI application entry point.

Wires together: security middleware (restrictive CORS + hardening headers), the
API routers, and — in production — static serving of the built React SPA so the
whole platform runs as a single Cloud Run container.
"""

from __future__ import annotations

from collections.abc import Awaitable, Callable
from pathlib import Path

from fastapi import FastAPI, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
from starlette.types import ASGIApp, Receive, Scope, Send

from app import __version__
from app.config import get_settings
from app.routes import calculate, entries, health

# Directory holding the built frontend (populated by the Docker build).
_STATIC_DIR = Path(__file__).resolve().parent.parent / "static"

# Security response headers applied to every response (defense in depth).
_SECURITY_HEADERS = {
    "X-Content-Type-Options": "nosniff",
    "X-Frame-Options": "DENY",
    "Referrer-Policy": "no-referrer",
    "Permissions-Policy": "geolocation=(), microphone=(), camera=()",
    "Content-Security-Policy": (
        "default-src 'self'; img-src 'self' data:; style-src 'self' 'unsafe-inline'; "
        "script-src 'self'; connect-src 'self'; base-uri 'self'; frame-ancestors 'none'"
    ),
}


class _CachedStaticFiles(StaticFiles):
    """Static file server that adds long-lived immutable cache headers.

    Vite outputs content-hashed filenames (e.g. index-Bc3xFk.js), so the
    browser can safely cache these forever — a changed file gets a new name.
    """

    async def __call__(self, scope: Scope, receive: Receive, send: Send) -> None:
        async def cached_send(message: dict) -> None:
            if message["type"] == "http.response.start":
                headers = dict(message.get("headers", []))
                headers[b"cache-control"] = b"public, max-age=31536000, immutable"
                message["headers"] = list(headers.items())
            await send(message)

        await super().__call__(scope, receive, cached_send)


def create_app() -> FastAPI:
    """Build the FastAPI application: middleware, routers, and SPA mount."""
    settings = get_settings()
    app = FastAPI(
        title="Carbon Footprint Awareness Platform",
        version=__version__,
        description="Understand, track, and reduce your carbon footprint.",
    )

    # CORS — restricted to configured origins (SPA is same-origin in production).
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.origins_list,
        allow_methods=["GET", "POST"],
        allow_headers=["Content-Type"],
    )

    @app.middleware("http")
    async def security_headers(
        request: Request, call_next: Callable[[Request], Awaitable[Response]]
    ) -> Response:
        response = await call_next(request)
        for key, value in _SECURITY_HEADERS.items():
            response.headers.setdefault(key, value)
        return response

    # API routes.
    app.include_router(health.router)
    app.include_router(calculate.router)
    app.include_router(entries.router)

    _mount_spa(app)
    return app


def _mount_spa(app: FastAPI) -> None:
    """Serve the built SPA (if present) with client-side-routing fallback."""
    if not _STATIC_DIR.exists():
        return

    assets = _STATIC_DIR / "assets"
    if assets.exists():
        # Use the caching subclass so Vite-hashed assets get immutable headers.
        app.mount("/assets", _CachedStaticFiles(directory=assets), name="assets")

    index = _STATIC_DIR / "index.html"

    @app.get("/{full_path:path}", include_in_schema=False)
    async def spa(full_path: str) -> Response:
        # API 404s should stay JSON, not fall through to index.html.
        if full_path.startswith("api/"):
            return JSONResponse({"detail": "Not Found"}, status_code=404)
        candidate = _STATIC_DIR / full_path
        if full_path and candidate.is_file():
            return FileResponse(candidate)
        return FileResponse(index)


app = create_app()
