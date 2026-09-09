from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.v1.router import api_v1_router
from app.core.config import get_settings
from app.core.exceptions import register_exception_handlers
from app.core.logging_config import configure_logging

configure_logging()
settings = get_settings()

# Ensure ffmpeg and ffprobe are available in system PATH for yt-dlp and pydub
try:
    import static_ffmpeg
    static_ffmpeg.add_paths()
except Exception:
    pass


# Write YouTube cookies if provided in environment variables
if settings.youtube_cookies and settings.yt_cookiefile:
    import logging
    logger = logging.getLogger("meeting_assistant")
    try:
        cookie_data = settings.youtube_cookies.strip()
        # Handle escaped newlines/tabs when stored in env vars
        if "\\n" in cookie_data:
            cookie_data = cookie_data.replace("\\n", "\n")
        if "\\t" in cookie_data:
            cookie_data = cookie_data.replace("\\t", "\t")

        # Ensure standard Netscape header is present
        if not cookie_data.startswith("# Netscape"):
            cookie_data = f"# Netscape HTTP Cookie File\n{cookie_data}"

        with open(settings.yt_cookiefile, "w", encoding="utf-8") as f:
            f.write(cookie_data)
        logger.info("Successfully wrote sanitized YouTube cookies to %s", settings.yt_cookiefile)
    except Exception as e:
        logger.error("Failed to write YouTube cookies: %s", e)

app = FastAPI(
    title=settings.app_name,
    version=settings.app_version,
    description=(
        "Modular backend for processing meeting audio/video, generating structured "
        "insights, and supporting RAG-based conversations with the transcript."
    ),
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

register_exception_handlers(app)

app.include_router(api_v1_router)


@app.get("/", include_in_schema=False)
async def root():
    return {"message": f"{settings.app_name} is running. See /docs for the API reference."}
