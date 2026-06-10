"""FastAPI application entry point.

Wires together: security middleware (restrictive CORS + hardening headers),
request body size limiting, the API routers, and — in production — static
serving of the built React SPA so the whole platform runs as a single Cloud Run
container.
"""

from __future__ import annotations

import logging
from pathlib import Path

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse
from fastapi.staticfiles import StaticFiles

from app import __version__
from app.config import get_settings
from app.routes import calculate, entries, health

logger = logging.getLogger(__name__)

# Directory holding the built frontend (populated by the Docker build).
_STATIC_DIR = Path(__file__).resolve().parent.parent / "static"

# Security response headers applied to every response (defense in depth).
# Includes HSTS to enforce HTTPS, CORP/COOP for isolation, and a strict CSP.
_SECURITY_HEADERS = {
    "X-Content-Type-Options": "nosniff",
    "X-Frame-Options": "DENY",
    "Referrer-Policy": "no-referrer",
    "Permissions-Policy": "geolocation=(), microphone=(), camera=()",
    "Strict-Transport-Security": "max-age=31536000; includeSubDomains",
    "X-XSS-Protection": "0",  # Disable legacy XSS filter; CSP supersedes it.
    "Content-Security-Policy": (
        "default-src 'self'; img-src 'self' data:; style-src 'self' 'unsafe-inline'; "
        "script-src 'self'; connect-src 'self'; base-uri 'self'; frame-ancestors 'none'; "
        "form-action 'self'"
    ),
    "Cross-Origin-Opener-Policy": "same-origin",
    "Cross-Origin-Resource-Policy": "same-origin",
}


def create_app() -> FastAPI:
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
    async def security_headers(request: Request, call_next):
        response = await call_next(request)
        for key, value in _SECURITY_HEADERS.items():
            response.headers.setdefault(key, value)
        return response

    @app.middleware("http")
    async def limit_request_body(request: Request, call_next):
        """Reject oversized request bodies before they reach application logic."""
        content_length = request.headers.get("content-length")
        if content_length and int(content_length) > settings.max_request_body_bytes:
            logger.warning(
                "Rejected oversized request: %s bytes from %s",
                content_length,
                request.client,
            )
            return JSONResponse(
                {"detail": "Request body too large"},
                status_code=413,
            )
        return await call_next(request)

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
        app.mount("/assets", StaticFiles(directory=assets), name="assets")

    index = _STATIC_DIR / "index.html"

    @app.get("/{full_path:path}", include_in_schema=False)
    async def spa(full_path: str):  # noqa: ANN202
        # API 404s should stay JSON, not fall through to index.html.
        if full_path.startswith("api/"):
            return JSONResponse({"detail": "Not Found"}, status_code=404)
        candidate = _STATIC_DIR / full_path
        if full_path and candidate.is_file():
            return FileResponse(candidate)
        return FileResponse(index)


app = create_app()
