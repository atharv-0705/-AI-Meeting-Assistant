from app.core.config import get_settings
from app.schemas.meeting import Language
from app.services.transcription.base import TranscriptionProvider
from app.services.transcription.sarvam_provider import SarvamProvider
from app.services.transcription.whisper_provider import WhisperProvider


def get_provider(language: Language) -> TranscriptionProvider:
    settings = get_settings()
    if settings.sarvam_api_key:
        return SarvamProvider(language=language)
    return WhisperProvider()

