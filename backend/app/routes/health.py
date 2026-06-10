"""Health and readiness endpoint (used by Cloud Run and uptime checks)."""

from __future__ import annotations

from fastapi import APIRouter
from fastapi.responses import JSONResponse

from app import __version__

router = APIRouter(tags=["system"])

# Health responses are immutable for 5 seconds — acceptable for uptime monitors
# and reduces probe overhead in high-traffic deployments.
_HEALTH_CACHE = JSONResponse(
    content={"status": "ok", "version": __version__},
    headers={"Cache-Control": "public, max-age=5"},
)


@router.get("/api/health")
def health() -> dict[str, str]:
    return {"status": "ok", "version": __version__}
