import logging
import os
import re

from app.core.exceptions import InvalidYoutubeUrlError, UnsupportedFileTypeError

logger = logging.getLogger("meeting_assistant.utils")

_YOUTUBE_RE = re.compile(
    r"^https?://(www\.)?(youtube\.com/watch\?v=|youtu\.be/|youtube\.com/shorts/)[\w-]+"
)

ALLOWED_EXTENSIONS = {".mp3", ".wav", ".m4a", ".mp4", ".mov", ".mkv", ".webm", ".ogg", ".flac"}
MAX_UPLOAD_BYTES = 500 * 1024 * 1024  # 500 MB


def validate_youtube_url(url: str) -> None:
    if not _YOUTUBE_RE.match(url.strip()):
        raise InvalidYoutubeUrlError(f"'{url}' does not look like a valid YouTube URL.")


def validate_file_extension(filename: str) -> None:
    ext = os.path.splitext(filename)[1].lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise UnsupportedFileTypeError(
            f"File type '{ext}' is not supported. Allowed types: {', '.join(sorted(ALLOWED_EXTENSIONS))}"
        )


def safe_remove(*paths: str) -> None:
    """Best-effort cleanup of temp/intermediate files. Never raises."""
    for path in paths:
        try:
            if path and os.path.exists(path):
                os.remove(path)
        except OSError:
            logger.warning("Could not remove temp file: %s", path)
