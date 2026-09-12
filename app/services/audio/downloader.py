import logging
import os
from typing import Any

from app.core.config import get_settings
from app.core.exceptions import DownloadFailedError

logger = logging.getLogger("meeting_assistant.audio")


def _is_valid_netscape_cookies(path: str) -> bool:
    """Verify that the cookie file contains valid tab-separated lines and can be parsed as cookies."""
    import http.cookiejar

    try:
        if not os.path.isfile(path) or os.path.getsize(path) == 0:
            return False
        jar = http.cookiejar.MozillaCookieJar(path)
        jar.load(ignore_discard=True, ignore_expires=True)
        return len(jar) > 0
    except Exception:
        # Fallback: check if at least one line has 7 tab-separated columns
        try:
            with open(path, "r", encoding="utf-8", errors="ignore") as f:
                for line in f:
                    line = line.strip()
                    if line and not line.startswith("#"):
                        parts = line.split("\t")
                        if len(parts) >= 7:
                            return True
        except Exception:
            return False
    return False


def _resolve_cookiefile() -> str | None:
    """Find valid cookie file from environment variables, Render Secret Files (/etc/secrets/),
    or repository cookie folders. Copies to a writable location (/tmp) because Render secrets
    are read-only and yt-dlp attempts to write updated session cookies back to the file."""
    import base64
    import shutil
    import tempfile

    settings = get_settings()
    base_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../.."))

    # 1. Check direct cookie string in env var (raw Netscape or base64 encoded)
    raw_env_cookies = os.environ.get("YOUTUBE_COOKIES") or settings.youtube_cookies
    if raw_env_cookies and raw_env_cookies.strip():
        val = raw_env_cookies.strip()
        decoded_text: str | None = None
        # Try decoding if user base64 encoded the cookie file (recommended for cloud env vars)
        try:
            decoded_bytes = base64.b64decode(val, validate=True)
            candidate = decoded_bytes.decode("utf-8", errors="ignore")
            if "\t" in candidate:
                decoded_text = candidate
        except Exception:
            pass

        if decoded_text is None and "\t" in val:
            decoded_text = val.replace("\\n", "\n").replace("\\t", "\t")

        if decoded_text and "\t" in decoded_text:
            if not decoded_text.startswith("# Netscape"):
                decoded_text = f"# Netscape HTTP Cookie File\n{decoded_text}"
            env_cookie_path = os.path.join(tempfile.gettempdir(), "yt_env_cookies.txt")
            try:
                with open(env_cookie_path, "w", encoding="utf-8") as f:
                    f.write(decoded_text)
                if _is_valid_netscape_cookies(env_cookie_path):
                    logger.info("Using YouTube cookies resolved from YOUTUBE_COOKIES environment variable.")
                    return env_cookie_path
            except Exception as e:
                logger.warning("Failed to write YOUTUBE_COOKIES env var to file: %s", e)

    # 2. Check candidate file paths
    candidates = [
        "/etc/secrets/cookies.txt",
        "/etc/secrets/filtered_cookies.txt",
        os.environ.get("YOUTUBE_COOKIES_FILE"),
        settings.yt_cookiefile,
        os.path.join(base_dir, "cookies", "filtered_cookies.txt"),
        os.path.join(base_dir, "cookies", "cookies.txt"),
        os.path.join(base_dir, "cookies.txt"),
    ]
    seen: set[str] = set()
    for path in candidates:
        if not path or path in seen:
            continue
        seen.add(path)
        if os.path.isfile(path) and os.path.getsize(path) > 0:
            if _is_valid_netscape_cookies(path):
                try:
                    writable_path = os.path.join(tempfile.gettempdir(), "yt_writable_cookies.txt")
                    shutil.copyfile(path, writable_path)
                    logger.info("Using YouTube cookies from: %s", path)
                    return writable_path
                except Exception as e:
                    logger.warning("Failed to copy cookie file to temp dir: %s, using original", e)
                    return path
            logger.warning(
                "Cookie file at '%s' found but is not a valid Netscape format file. Skipping it.",
                path,
            )
    return None


def get_cookie_status() -> dict[str, Any]:
    """Diagnostic helper for health endpoint to verify cookie presence on cloud instances."""
    resolved = _resolve_cookiefile()
    settings = get_settings()
    base_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../.."))
    candidates = [
        "/etc/secrets/cookies.txt",
        "/etc/secrets/filtered_cookies.txt",
        os.environ.get("YOUTUBE_COOKIES_FILE"),
        settings.yt_cookiefile,
        os.path.join(base_dir, "cookies", "filtered_cookies.txt"),
    ]
    checked = {}
    for c in candidates:
        if c:
            checked[c] = os.path.isfile(c) and os.path.getsize(c) > 0
    return {
        "configured": resolved is not None,
        "resolved_path": resolved,
        "has_youtube_cookies_env": bool(os.environ.get("YOUTUBE_COOKIES") or settings.youtube_cookies),
        "checked_files": checked,
    }


def _build_extractor_args(
    cookie_path: str | None,
    client_list: list[str] | None = None,
    skip_webpage: bool = False,
) -> dict[str, Any]:
    """Build yt-dlp extractor_args.
    When skip_webpage is True, yt-dlp avoids requesting the watch webpage HTML,
    bypassing YouTube's HTTP 429 datacenter IP rate limits on cloud hosts."""
    settings = get_settings()

    if client_list is not None:
        player_clients = client_list
    elif cookie_path:
        player_clients = ["web_embedded", "web", "mweb", "android"]
    else:
        player_clients = ["android", "web_embedded", "visionos", "ios"]

    yt_args: dict[str, Any] = {
        "player_client": player_clients,
    }
    if skip_webpage:
        yt_args["player_skip"] = ["webpage"]

    extractor_args: dict[str, Any] = {
        "youtube": yt_args
    }

    if settings.yt_pot_provider_url and "web" in player_clients:
        extractor_args["youtubepot-bgutilhttp"] = {
            "base_url": [settings.yt_pot_provider_url]
        }
        logger.info("POT provider configured at %s", settings.yt_pot_provider_url)

    return extractor_args


def _extract_and_download(
    url: str,
    ydl_opts: dict[str, Any],
    download_dir: str,
) -> str:
    """Internal helper to run yt_dlp extraction and audio file resolution."""
    import yt_dlp

    with yt_dlp.YoutubeDL(ydl_opts) as ydl:  # type: ignore[arg-type]
        info = ydl.extract_info(url, download=True)
        base_filename = ydl.prepare_filename(info)
        base_name, _ = os.path.splitext(base_filename)
        wav_filename = f"{base_name}.wav"

        if os.path.isfile(wav_filename):
            return wav_filename

        # Also check requested_downloads if present
        req_downloads = info.get("requested_downloads") if isinstance(info, dict) else None
        if req_downloads and isinstance(req_downloads, list):
            for rd in req_downloads:
                fp = rd.get("filepath")
                if fp and os.path.isfile(fp):
                    base_rd, _ = os.path.splitext(fp)
                    if os.path.isfile(f"{base_rd}.wav"):
                        return f"{base_rd}.wav"
                    if fp.endswith(".wav"):
                        return fp
        return base_filename


def download_youtube_audio(url: str) -> str:
    """Download a YouTube video's audio and return the path to the resulting WAV file.
    Includes resilient multi-tier fallbacks using android (skipping webpage to bypass
    datacenter IP 429), visionos, and web_embedded clients."""
    import yt_dlp
    settings = get_settings()
    os.makedirs(settings.download_dir, exist_ok=True)

    cookie_path = _resolve_cookiefile()
    output_path = os.path.join(settings.download_dir, "%(title)s.%(ext)s")

    # If cookies are present, attempt cookie-authenticated download first.
    # If no cookies, start directly with the datacenter-safe Android client skipping the watch webpage.
    if cookie_path:
        primary_clients = ["web_embedded", "web", "android"]
        primary_skip_webpage = False
        primary_format = "bestaudio/best"
    else:
        primary_clients = ["android", "web_embedded"]
        primary_skip_webpage = True
        primary_format = "bestaudio/18/best"

    extractor_args = _build_extractor_args(cookie_path, client_list=primary_clients, skip_webpage=primary_skip_webpage)
    ydl_opts: dict[str, Any] = {
        "format": primary_format,
        "outtmpl": output_path,
        "postprocessors": [
            {"key": "FFmpegExtractAudio", "preferredcodec": "wav", "preferredquality": "192"}
        ],
        "extractor_args": extractor_args,
        "http_headers": {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36",
            "Accept-Language": "en-US,en;q=0.9",
        },
        "quiet": False,
        "no_warnings": False,
    }
    if cookie_path:
        ydl_opts["cookiefile"] = cookie_path
        logger.info("Using YouTube cookies from %s", cookie_path)
    else:
        logger.info("No cookies found. Proceeding with datacenter-safe Android client (skipping webpage 429).")

    try:
        filename = _extract_and_download(url, ydl_opts, settings.download_dir)
        logger.info("Downloaded YouTube audio for url=%s -> %s", url, filename)
        return filename
    except yt_dlp.utils.DownloadError as exc:
        primary_err = str(exc)
        logger.warning("Primary yt-dlp download failed for url=%s: %s", url, primary_err)

        # Fallback 1: Direct Android client with webpage skipped and format 18 (bypasses 429 + 403)
        logger.info("Attempting Fallback 1: Direct Android client skipping webpage...")
        fb1_opts: dict[str, Any] = {
            "format": "bestaudio/18/best",
            "outtmpl": output_path,
            "postprocessors": [
                {"key": "FFmpegExtractAudio", "preferredcodec": "wav", "preferredquality": "192"}
            ],
            "extractor_args": _build_extractor_args(None, client_list=["android"], skip_webpage=True),
            "quiet": False,
            "no_warnings": False,
        }
        fb1_err: str | None = None
        try:
            filename = _extract_and_download(url, fb1_opts, settings.download_dir)
            logger.info("Fallback 1 succeeded for url=%s -> %s", url, filename)
            return filename
        except Exception as fb1_exc:
            fb1_err = str(fb1_exc)
            logger.warning("Fallback 1 failed: %s", fb1_exc)

        # Fallback 2: VisionOS and Web Embedded clean clients
        logger.info("Attempting Fallback 2: VisionOS and Web Embedded clean clients...")
        fb2_opts: dict[str, Any] = {
            "format": "bestaudio/best",
            "outtmpl": output_path,
            "postprocessors": [
                {"key": "FFmpegExtractAudio", "preferredcodec": "wav", "preferredquality": "192"}
            ],
            "extractor_args": _build_extractor_args(None, client_list=["visionos", "web_embedded", "ios"]),
            "quiet": False,
            "no_warnings": False,
        }
        fb2_err: str | None = None
        try:
            filename = _extract_and_download(url, fb2_opts, settings.download_dir)
            logger.info("Fallback 2 succeeded for url=%s -> %s", url, filename)
            return filename
        except Exception as fb2_exc:
            fb2_err = str(fb2_exc)
            logger.warning("Fallback 2 failed: %s", fb2_exc)

        # Fallback 3: Universal format 18 fallback
        logger.info("Attempting Fallback 3: Universal fallback format 18 with Android/VisionOS...")
        fb3_opts: dict[str, Any] = {
            "format": "18/best",
            "outtmpl": output_path,
            "postprocessors": [
                {"key": "FFmpegExtractAudio", "preferredcodec": "wav", "preferredquality": "192"}
            ],
            "extractor_args": _build_extractor_args(None, client_list=["android", "visionos"], skip_webpage=True),
            "quiet": False,
            "no_warnings": False,
        }
        fb3_err: str | None = None
        try:
            filename = _extract_and_download(url, fb3_opts, settings.download_dir)
            logger.info("Fallback 3 succeeded for url=%s -> %s", url, filename)
            return filename
        except Exception as fb3_exc:
            fb3_err = str(fb3_exc)
            logger.error("Fallback 3 also failed: %s", fb3_exc)

        # If all fallbacks failed, raise a detailed error
        raise DownloadFailedError(
            f"YouTube download failed after multiple resilient attempts. "
            f"Primary: {primary_err} | Fallback 1: {fb1_err} | Fallback 2: {fb2_err} | Fallback 3: {fb3_err}"
        ) from exc
    except Exception as exc:  # noqa: BLE001
        logger.exception("Unexpected error downloading url=%s: %s", url, exc)
        raise DownloadFailedError(f"Download failed ({type(exc).__name__}): {exc}") from exc


def extract_video_title(url: str) -> str | None:
    """Best-effort title lookup without downloading, used to populate meeting.title early."""
    import yt_dlp
    cookie_path = _resolve_cookiefile()
    ydl_opts: dict[str, Any] = {
        "quiet": True,
        "skip_download": True,
        "extractor_args": _build_extractor_args(cookie_path, client_list=["android", "web_embedded", "visionos"], skip_webpage=True),
    }
    if cookie_path:
        ydl_opts["cookiefile"] = cookie_path
    try:
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:  # type: ignore[arg-type]
            info = ydl.extract_info(url, download=False)
            return info.get("title")
    except Exception:
        try:
            fallback_opts: dict[str, Any] = {
                "quiet": True,
                "skip_download": True,
                "extractor_args": _build_extractor_args(None, client_list=["android"], skip_webpage=True),
            }
            with yt_dlp.YoutubeDL(fallback_opts) as ydl:  # type: ignore[arg-type]
                info = ydl.extract_info(url, download=False)
                return info.get("title")
        except Exception:
            return None
