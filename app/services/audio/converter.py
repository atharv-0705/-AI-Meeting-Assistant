import logging
import os

from pydub import AudioSegment

from app.core.exceptions import AudioExtractionError

logger = logging.getLogger("meeting_assistant.audio")


def convert_to_wav(input_path: str) -> str:
    """Convert any audio/video file to a 16kHz mono WAV file using pydub/ffmpeg."""
    if not os.path.exists(input_path):
        raise AudioExtractionError(f"Input file not found: {input_path}")

    output_path = os.path.splitext(input_path)[0] + "_converted.wav"
    try:
        audio = AudioSegment.from_file(input_path)
        audio = audio.set_channels(1).set_frame_rate(16000)
        audio.export(output_path, format="wav")
        logger.info("Converted %s to WAV", os.path.basename(input_path))
        return output_path
    except Exception as exc:  # noqa: BLE001 - covers ffmpeg-not-found, corrupt file, etc.
        logger.exception("Audio conversion failed for %s", input_path)
        raise AudioExtractionError(
            "Failed to convert the provided file to audio. It may be corrupted, "
            "an unsupported format, or ffmpeg may not be installed."
        ) from exc
