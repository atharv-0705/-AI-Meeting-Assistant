from fastapi import APIRouter

from app.core.config import get_settings
from app.schemas.common import SuccessResponse
from app.services.audio.downloader import get_cookie_status

router = APIRouter(tags=["health"])


@router.get("/health", response_model=SuccessResponse)
async def health_check():
    settings = get_settings()
    return SuccessResponse(
        data={
            "app": settings.app_name,
            "version": settings.app_version,
            "openai_key_configured": bool(settings.openai_api_key),
            "sarvam_key_configured": bool(settings.sarvam_api_key),
            "cookies": get_cookie_status(),
        },
        message="Service is healthy.",
    )
