from fastapi import APIRouter

from app.api.v1.routes import chat, export, health, meetings, summary, transcript

api_v1_router = APIRouter(prefix="/api/v1")

api_v1_router.include_router(health.router)
api_v1_router.include_router(meetings.router)
api_v1_router.include_router(transcript.router)
api_v1_router.include_router(summary.router)
api_v1_router.include_router(chat.router)
api_v1_router.include_router(export.router)
