"""
Centralised application settings.
All values can be overridden via environment variables or the .env file.
"""

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    # ── AI / API Keys ──────────────────────────────────────────────────────────
    mistral_api_key: str = ""
    sarvam_api_key: str = ""
    sarvam_stt_model: str = "saaras:v2.5"
    whisper_model: str = "small"

    # ── Directories ────────────────────────────────────────────────────────────
    downloads_dir: str = "downloads"
    temp_dir: str = "temp"
    exports_dir: str = "exports"
    vector_db_dir: str = "vector_db"
    logs_dir: str = "logs"

    # ── CORS ───────────────────────────────────────────────────────────────────
    # Comma-separated origins; "*" allows all (fine for local dev).
    cors_origins_raw: str = "*"

    @property
    def cors_origins(self) -> list[str]:
        return [o.strip() for o in self.cors_origins_raw.split(",")]

    # ── API metadata ───────────────────────────────────────────────────────────
    api_title: str = "AI Meeting Assistant API"
    api_version: str = "1.0.0"
    api_description: str = (
        "## AI Meeting Assistant\n\n"
        "Production-grade FastAPI backend that processes meeting audio/video, "
        "generates structured insights (summary, action items, decisions, open questions), "
        "and supports RAG-based Q&A with the meeting transcript.\n\n"
        "### Workflow\n"
        "1. `POST /api/v1/meetings` — upload a file or supply a YouTube URL.\n"
        "2. Poll `GET /api/v1/meetings/{id}` until `status` is **ready**.\n"
        "3. Fetch transcript, summary, or chat with the meeting.\n"
        "4. Export a PDF or TXT report.\n"
    )

    # ── Processing ─────────────────────────────────────────────────────────────
    max_pipeline_workers: int = 2   # thread-pool size for background pipelines
    allowed_audio_video_extensions: str = ".mp3,.mp4,.wav,.m4a,.webm,.ogg,.mkv,.avi,.mov"

    @property
    def allowed_extensions(self) -> set[str]:
        return {e.strip().lower() for e in self.allowed_audio_video_extensions.split(",")}


settings = Settings()
