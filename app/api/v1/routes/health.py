from fastapi import APIRouter

from app.core.config import get_settings
from app.schemas.common import SuccessResponse

router = APIRouter(tags=["health"])


@router.get("/health", response_model=SuccessResponse)
async def health_check():
    settings = get_settings()
    return SuccessResponse(
        data={
            "app": settings.app_name,
            "version": settings.app_version,
            "mistral_key_configured": bool(settings.mistral_api_key),
            "sarvam_key_configured": bool(settings.sarvam_api_key),
        },
        message="Service is healthy.",
    )
