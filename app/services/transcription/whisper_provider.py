import logging
import threading

from app.core.config import get_settings
from app.core.exceptions import TranscriptionFailedError

logger = logging.getLogger("meeting_assistant.transcription")

_model = None
_model_lock = threading.Lock()  # whisper's model isn't guaranteed thread-safe under concurrent .transcribe()


def _load_model():
    global _model
    if _model is None:
        try:
            import whisper
        except ImportError as exc:
            raise TranscriptionFailedError(
                "Local Whisper model is not installed. Please set SARVAM_API_KEY in Render environment."
            ) from exc
        settings = get_settings()
        logger.info("Loading Whisper model: %s", settings.whisper_model)
        _model = whisper.load_model(settings.whisper_model)
        logger.info("Whisper model loaded.")
    return _model


class WhisperProvider:
    name = "whisper"

    def transcribe_chunk(self, chunk_path: str) -> str:
        model = _load_model()
        try:
            with _model_lock:  # serialize concurrent requests against the single global model
                result = model.transcribe(chunk_path, task="transcribe")
            return result["text"]
        except Exception as exc:  # noqa: BLE001
            logger.exception("Whisper transcription failed for %s", chunk_path)
            raise TranscriptionFailedError("Local Whisper transcription failed for an audio chunk.") from exc
