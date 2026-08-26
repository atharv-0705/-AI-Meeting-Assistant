import logging

from app.core.exceptions import AppException
from app.models.meeting_store import meeting_store
from app.schemas.meeting import Language, MeetingStatus
from app.services.audio.chunker import chunk_audio
from app.services.audio.converter import convert_to_wav
from app.services.audio.downloader import download_youtube_audio
from app.services.meeting_analysis.extractor import (
    extract_action_items,
    extract_key_decisions,
    extract_questions,
)
from app.services.meeting_analysis.summarizer import generate_title, summarize
from app.services.rag.vector_store import build_vector_store
from app.services.transcription.factory import get_provider
from app.utils.file_utils import safe_remove

logger = logging.getLogger("meeting_assistant.pipeline")


def run_meeting_pipeline(meeting_id: str, source: str, language: Language) -> None:
    """The full audio -> transcript -> analysis -> RAG index pipeline.
    Runs as a FastAPI background task; every stage updates the meeting's status
    so clients can poll progress via GET /meetings/{id}. Any failure anywhere
    marks the meeting FAILED with a clean error code instead of crashing silently."""
    chunk_paths: list[str] = []
    wav_path: str | None = None

    try:
        # --- Stage 1: acquire + normalize audio ---
        if source.startswith(("http://", "https://")):
            meeting_store.update(meeting_id, status=MeetingStatus.DOWNLOADING)
            raw_path = download_youtube_audio(source)
            wav_path = raw_path  # yt-dlp's postprocessor already outputs .wav
        else:
            meeting_store.update(meeting_id, status=MeetingStatus.DOWNLOADING)
            wav_path = convert_to_wav(source)

        # --- Stage 2: chunk ---
        meeting_store.update(meeting_id, status=MeetingStatus.CHUNKING)
        chunk_paths = chunk_audio(wav_path)

        # --- Stage 3: transcribe ---
        meeting_store.update(meeting_id, status=MeetingStatus.TRANSCRIBING)
        provider = get_provider(language)
        full_transcript = " ".join(provider.transcribe_chunk(c) for c in chunk_paths).strip()

        # --- Stage 4: analyze (title, summary, action items, decisions, questions) ---
        meeting_store.update(meeting_id, status=MeetingStatus.ANALYZING, transcript=full_transcript, engine_used=provider.name)
        title = generate_title(full_transcript)
        summary = summarize(full_transcript)
        action_items_raw = extract_action_items(full_transcript)
        key_decisions_raw = extract_key_decisions(full_transcript)
        open_questions_raw = extract_questions(full_transcript)

        # --- Stage 5: index for RAG chat ---
        meeting_store.update(meeting_id, status=MeetingStatus.INDEXING)
        build_vector_store(meeting_id, full_transcript)

        meeting_store.update(
            meeting_id,
            status=MeetingStatus.READY,
            title=title,
            summary=summary,
            action_items_raw=action_items_raw,
            key_decisions_raw=key_decisions_raw,
            open_questions_raw=open_questions_raw,
        )
        logger.info("Meeting %s finished processing successfully", meeting_id)

    except AppException as exc:
        logger.warning("Meeting %s failed at a known stage: %s", meeting_id, exc.code)
        meeting_store.update(meeting_id, status=MeetingStatus.FAILED, error_code=exc.code, error_message=exc.message)
    except Exception as exc:  # noqa: BLE001 - last-resort catch so the background task never dies silently
        logger.exception("Meeting %s failed unexpectedly", meeting_id)
        meeting_store.update(
            meeting_id,
            status=MeetingStatus.FAILED,
            error_code="INTERNAL_ERROR",
            error_message="An unexpected internal error occurred while processing this meeting.",
        )
    finally:
        # Clean up intermediate chunk files; keep the source wav for potential re-use/debugging.
        safe_remove(*chunk_paths)
