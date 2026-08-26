"""
Uvicorn entry-point for the AI Meeting Assistant API.

Run with:
    uvicorn app:app --port 2210 --reload

Swagger UI:
    http://127.0.0.1:2210/docs
"""

# pyrefly: ignore [missing-import]
from api.app import app  # noqa: F401 — re-exported for Uvicorn

__all__ = ["app"]
