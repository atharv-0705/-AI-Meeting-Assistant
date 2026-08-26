from app.schemas.meeting import Language
from app.services.transcription.base import TranscriptionProvider
from app.services.transcription.sarvam_provider import SarvamProvider
from app.services.transcription.whisper_provider import WhisperProvider


def get_provider(language: Language) -> TranscriptionProvider:
    if language == Language.HINGLISH:
        return SarvamProvider()
    return WhisperProvider()
