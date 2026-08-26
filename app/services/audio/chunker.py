import logging

from pydub import AudioSegment

from app.core.exceptions import AudioExtractionError

logger = logging.getLogger("meeting_assistant.audio")


def chunk_audio(wav_path: str, chunk_minutes: int = 10) -> list[str]:
    """Split a WAV file into fixed-length chunks. Returns list of chunk file paths."""
    try:
        audio = AudioSegment.from_wav(wav_path)
    except Exception as exc:  # noqa: BLE001
        raise AudioExtractionError(f"Failed to read WAV file for chunking: {wav_path}") from exc

    chunk_ms = chunk_minutes * 60 * 1000
    chunks: list[str] = []

    for i, start in enumerate(range(0, len(audio), chunk_ms)):
        chunk = audio[start : start + chunk_ms]
        chunk_path = f"{wav_path}_chunk_{i}.wav"
        chunk.export(chunk_path, format="wav")
        chunks.append(chunk_path)

    logger.info("Split %s into %d chunk(s)", wav_path, len(chunks))
    return chunks
