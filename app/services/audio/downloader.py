import logging
import os
from typing import Any

from app.core.config import get_settings
from app.core.exceptions import DownloadFailedError

logger = logging.getLogger("meeting_assistant.audio")


def _is_valid_netscape_cookies(path: str) -> bool:
    """Verify that the cookie file contains valid tab-separated lines or Netscape header."""
    try:
        with open(path, "r", encoding="utf-8", errors="ignore") as f:
            content = f.read(4096)
            if not content.strip():
                return False
            # Check for standard Netscape header or presence of tab characters
            if "Netscape" in content or "\t" in content:
                return True
    except Exception:
        return False
    return False


def _resolve_cookiefile() -> str | None:
    """Find valid cookie file from config, Render Secret Files (/etc/secrets/), or root.
    Always copies to a writable location (like /tmp) because /etc/secrets is read-only
    and yt-dlp attempts to write updated session cookies back to the file."""
    import shutil
    import tempfile

    settings = get_settings()
    candidates = [
        "/etc/secrets/cookies.txt",
        settings.yt_cookiefile,
        "cookies.txt",
    ]
    for path in candidates:
        if path and os.path.isfile(path) and os.path.getsize(path) > 0:
            if _is_valid_netscape_cookies(path):
                try:
                    writable_path = os.path.join(tempfile.gettempdir(), "yt_writable_cookies.txt")
                    shutil.copyfile(path, writable_path)
                    return writable_path
                except Exception as e:
                    logger.warning("Failed to copy cookie file to temp dir: %s, using original", e)
                    return path
            logger.warning(
                "Cookie file at '%s' found but is not a valid Netscape format file. Skipping it.",
                path,
            )
    return None



def _build_extractor_args(cookie_path: str | None) -> dict[str, Any]:
    """Build yt-dlp extractor_args. android/ios clients do not support cookies
    so we only include them when no cookies are present."""
    settings = get_settings()

    # android and ios do NOT support cookies — yt-dlp will skip them with a warning
    # when cookies are active. Use only web-based clients when cookies are present.
    if cookie_path:
        player_clients = ["mweb", "web"]
    else:
        player_clients = ["android", "ios", "mweb", "web"]

    extractor_args: dict[str, Any] = {
        "youtube": {
            "player_client": player_clients
        }
    }

    if settings.yt_pot_provider_url:
        extractor_args["youtubepot-bgutilhttp"] = {
            "base_url": [settings.yt_pot_provider_url]
        }
        logger.info("POT provider configured at %s", settings.yt_pot_provider_url)

    return extractor_args


def download_youtube_audio(url: str) -> str:
    """Download a YouTube video's audio and return the path to the resulting file
    (still in its original container - conversion to WAV happens separately)."""
    import yt_dlp
    settings = get_settings()
    os.makedirs(settings.download_dir, exist_ok=True)

    cookie_path = _resolve_cookiefile()
    extractor_args = _build_extractor_args(cookie_path)

    output_path = os.path.join(settings.download_dir, "%(title)s.%(ext)s")
    ydl_opts: dict[str, Any] = {
        "format": "bestaudio/best",
        "outtmpl": output_path,
        "postprocessors": [
            {"key": "FFmpegExtractAudio", "preferredcodec": "wav", "preferredquality": "192"}
        ],
        "extractor_args": extractor_args,
        "quiet": False,   # Show warnings in Render logs
        "no_warnings": False,
    }
    if cookie_path:
        ydl_opts["cookiefile"] = cookie_path
        logger.info("Using YouTube cookies from %s", cookie_path)
    else:
        logger.warning("No YouTube cookies file found. Proceeding with POT provider only.")

    try:
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:  # type: ignore[arg-type]
            info = ydl.extract_info(url, download=True)
            base_filename = ydl.prepare_filename(info)
            base_name, _ = os.path.splitext(base_filename)
            wav_filename = f"{base_name}.wav"

            if os.path.isfile(wav_filename):
                filename = wav_filename
            else:
                # Also check requested_downloads if present
                req_downloads = info.get("requested_downloads") if isinstance(info, dict) else None
                resolved = None
                if req_downloads and isinstance(req_downloads, list):
                    for rd in req_downloads:
                        fp = rd.get("filepath")
                        if fp and os.path.isfile(fp):
                            base_rd, _ = os.path.splitext(fp)
                            if os.path.isfile(f"{base_rd}.wav"):
                                resolved = f"{base_rd}.wav"
                                break
                            if fp.endswith(".wav"):
                                resolved = fp
                                break
                filename = resolved or base_filename
        logger.info("Downloaded YouTube audio for url=%s -> %s", url, filename)
        return filename
    except yt_dlp.utils.DownloadError as exc:
        logger.warning("yt-dlp download failed for url=%s: %s", url, exc)
        raise DownloadFailedError(
            f"YouTube download failed: {exc}"
        ) from exc
    except Exception as exc:  # noqa: BLE001 - convert anything unexpected into a clean API error
        logger.exception("Unexpected error downloading url=%s: %s", url, exc)
        raise DownloadFailedError(f"Download failed ({type(exc).__name__}): {exc}") from exc



def extract_video_title(url: str) -> str | None:
    """Best-effort title lookup without downloading, used to populate meeting.title early."""
    import yt_dlp
    cookie_path = _resolve_cookiefile()
    extractor_args = _build_extractor_args(cookie_path)

    ydl_opts: dict[str, Any] = {
        "quiet": True,
        "skip_download": True,
        "extractor_args": extractor_args,
    }
    if cookie_path:
        ydl_opts["cookiefile"] = cookie_path
    try:
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:  # type: ignore[arg-type]
            info = ydl.extract_info(url, download=False)
            return info.get("title")
    except Exception:  # noqa: BLE001
        return None
