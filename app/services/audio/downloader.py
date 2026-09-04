import logging
import os
from typing import Any

from app.core.config import get_settings
from app.core.exceptions import DownloadFailedError

logger = logging.getLogger("meeting_assistant.audio")


def _resolve_cookiefile() -> str | None:
    """Find valid cookie file from config, Render Secret Files (/etc/secrets/), or root."""
    settings = get_settings()
    candidates = [
        settings.yt_cookiefile,
        "/etc/secrets/cookies.txt",
        "cookies.txt",
    ]
    for path in candidates:
        if path and os.path.isfile(path) and os.path.getsize(path) > 0:
            return path
    return None


def download_youtube_audio(url: str) -> str:
    """Download a YouTube video's audio and return the path to the resulting file
    (still in its original container - conversion to WAV happens separately)."""
    import yt_dlp
    settings = get_settings()
    os.makedirs(settings.download_dir, exist_ok=True)

    extractor_args: dict[str, Any] = {
        "youtube": {
            "player_client": ["android", "ios", "mweb", "web"]
        }
    }
    if settings.yt_pot_provider_url:
        extractor_args["youtubepot-bgutilhttp"] = {
            "base_url": [settings.yt_pot_provider_url]
        }

    output_path = os.path.join(settings.download_dir, "%(title)s.%(ext)s")
    ydl_opts: dict[str, Any] = {
        "format": "bestaudio/best",
        "outtmpl": output_path,
        "postprocessors": [
            {"key": "FFmpegExtractAudio", "preferredcodec": "wav", "preferredquality": "192"}
        ],
        "extractor_args": extractor_args,
        "quiet": True,
        "no_warnings": True,
    }
    cookie_path = _resolve_cookiefile()
    if cookie_path:
        ydl_opts["cookiefile"] = cookie_path
        logger.info("Using YouTube cookies from %s", cookie_path)
    else:
        logger.warning("No YouTube cookies file found. Proceeding with POT provider only.")

    try:
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:  # type: ignore[arg-type]
            info = ydl.extract_info(url, download=True)
            filename = ydl.prepare_filename(info)
            filename = filename.replace(".webm", ".wav").replace(".m4a", ".wav")
        logger.info("Downloaded YouTube audio for url=%s", url)
        return filename
    except yt_dlp.utils.DownloadError as exc:
        logger.warning("yt-dlp download failed for url=%s", url)
        raise DownloadFailedError(
            f"Could not download audio from the provided YouTube URL. Detail: {exc}"
        ) from exc
    except Exception as exc:  # noqa: BLE001 - convert anything unexpected into a clean API error
        logger.exception("Unexpected error downloading url=%s", url)
        raise DownloadFailedError("An unexpected error occurred while downloading the video.") from exc


def extract_video_title(url: str) -> str | None:
    """Best-effort title lookup without downloading, used to populate meeting.title early."""
    import yt_dlp
    settings = get_settings()
    extractor_args: dict[str, Any] = {
        "youtube": {
            "player_client": ["android", "ios", "mweb", "web"]
        }
    }
    if settings.yt_pot_provider_url:
        extractor_args["youtubepot-bgutilhttp"] = {
            "base_url": [settings.yt_pot_provider_url]
        }

    ydl_opts: dict[str, Any] = {
        "quiet": True,
        "skip_download": True,
        "extractor_args": extractor_args,
    }
    cookie_path = _resolve_cookiefile()
    if cookie_path:
        ydl_opts["cookiefile"] = cookie_path
    try:
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:  # type: ignore[arg-type]
            info = ydl.extract_info(url, download=False)
            return info.get("title")
    except Exception:  # noqa: BLE001
        return None
