import logging

from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse

logger = logging.getLogger("meeting_assistant")


class AppException(Exception):
    """Base class for all handled application errors."""

    code: str = "INTERNAL_ERROR"
    status_code: int = 500
    message: str = "An unexpected error occurred."

    def __init__(self, message: str | None = None, code: str | None = None, status_code: int | None = None):
        self.message = message or self.message
        self.code = code or self.code
        self.status_code = status_code or self.status_code
        super().__init__(self.message)


class ValidationFailedError(AppException):
    code = "VALIDATION_ERROR"
    status_code = 400
    message = "Request validation failed."


class InvalidYoutubeUrlError(AppException):
    code = "INVALID_YOUTUBE_URL"
    status_code = 400
    message = "The provided YouTube URL is invalid or unsupported."


class UnsupportedFileTypeError(AppException):
    code = "UNSUPPORTED_FILE_TYPE"
    status_code = 400
    message = "The uploaded file type is not supported."


class MeetingNotFoundError(AppException):
    code = "MEETING_NOT_FOUND"
    status_code = 404
    message = "No meeting exists with the given id."


class MeetingNotReadyError(AppException):
    code = "MEETING_NOT_READY"
    status_code = 409
    message = "This meeting has not finished processing yet."


class DownloadFailedError(AppException):
    code = "DOWNLOAD_FAILED"
    status_code = 502
    message = "Failed to download audio from the provided source."


class AudioExtractionError(AppException):
    code = "AUDIO_EXTRACTION_FAILED"
    status_code = 422
    message = "Failed to extract or convert audio from the provided file."


class TranscriptionFailedError(AppException):
    code = "TRANSCRIPTION_FAILED"
    status_code = 502
    message = "Unable to transcribe the provided audio."


class SarvamApiError(AppException):
    code = "SARVAM_API_ERROR"
    status_code = 502
    message = "The Sarvam AI transcription service returned an error."


class OpenAIApiError(AppException):
    code = "OPENAI_API_ERROR"
    status_code = 502
    message = "The OpenAI service returned an error."


MistralApiError = OpenAIApiError


class MissingApiKeyError(AppException):
    code = "MISSING_API_KEY"
    status_code = 500
    message = "A required API key is not configured on the server."


class VectorStoreError(AppException):
    code = "CHROMADB_ERROR"
    status_code = 500
    message = "A vector store operation failed."


class RagRetrievalError(AppException):
    code = "RAG_RETRIEVAL_FAILED"
    status_code = 502
    message = "Failed to generate an answer from the meeting transcript."


class ExportFailedError(AppException):
    code = "EXPORT_FAILED"
    status_code = 500
    message = "Failed to export the meeting report."


def _error_body(code: str, message: str) -> dict:
    return {"success": False, "error": {"code": code, "message": message}}


def register_exception_handlers(app: FastAPI) -> None:
    @app.exception_handler(AppException)
    async def handle_app_exception(request: Request, exc: AppException):
        logger.warning("AppException on %s %s: %s (%s)", request.method, request.url.path, exc.message, exc.code)
        return JSONResponse(status_code=exc.status_code, content=_error_body(exc.code, exc.message))

    @app.exception_handler(Exception)
    async def handle_unexpected_exception(request: Request, exc: Exception):
        # Never leak stack traces or internal details to the client.
        logger.exception("Unhandled exception on %s %s", request.method, request.url.path)
        return JSONResponse(
            status_code=500,
            content=_error_body("INTERNAL_ERROR", "An unexpected internal error occurred."),
        )
