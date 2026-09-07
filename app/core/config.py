from functools import lru_cache
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    # --- API keys ---
    openai_api_key: str | None = None
    explabs_api_key: str | None = None
    openai_base_url: str = "https://api.experientiallabs.ai/v1"
    openai_model: str = "minimax-m2.7-free"
    sarvam_api_key: str | None = None
    hf_token: str | None = None

    # --- Transcription ---
    whisper_model: str = "small"
    sarvam_stt_model: str = "saaras.5"
    sarvam_stt_url: str = "https://api.sarvam.ai/speech-to-text-translate"
    sarvam_piece_seconds: int = 25

    # --- Audio processing ---
    download_dir: str = "downloads"
    chunk_minutes: int = 10
    yt_cookiefile: str | None = "cookies.txt"
    youtube_cookies: str | None = None
    yt_pot_provider_url: str | None = None

    # --- RAG ---
    vector_db_dir: str = "vector_db"
    embedding_model: str = "all-MiniLM-L6-v2"
    rag_top_k: int = 4

    # --- Server ---
    cors_origins: list[str] = ["*"]
    app_name: str = "AI Meeting Assistant"
    app_version: str = "0.1.0"


@lru_cache
def get_settings() -> Settings:
    return Settings()
