import logging
import os

import requests
from pydub import AudioSegment

from app.core.config import get_settings
from app.core.exceptions import MissingApiKeyError, SarvamApiError

logger = logging.getLogger("meeting_assistant.transcription")


class SarvamProvider:
    name = "sarvam"

    def __init__(self):
        self.settings = get_settings()
        if not self.settings.sarvam_api_key:
            raise MissingApiKeyError("SARVAM_API_KEY is not configured on the server.")

    def _send_piece(self, piece_path: str) -> str:
        headers = {"api-subscription-key": self.settings.sarvam_api_key}
        try:
            with open(piece_path, "rb") as f:
                files = {"file": (os.path.basename(piece_path), f, "audio/wav")}
                data = {"model": self.settings.sarvam_stt_model, "with_diarization": "false"}
                response = requests.post(
                    self.settings.sarvam_stt_url, headers=headers, files=files, data=data, timeout=120
                )
        except requests.RequestException as exc:
            logger.exception("Network error calling Sarvam API")
            raise SarvamApiError("Could not reach the Sarvam AI service (network/timeout error).") from exc

        if not response.ok:
            logger.warning("Sarvam API returned %s", response.status_code)
            raise SarvamApiError(f"Sarvam AI returned an error (status {response.status_code}).")

        return response.json().get("transcript", "")

    def transcribe_chunk(self, chunk_path: str) -> str:
        """Sarvam's sync API only accepts <=30s audio; split into 25s pieces and join."""
        audio = AudioSegment.from_wav(chunk_path)
        piece_ms = self.settings.sarvam_piece_seconds * 1000

        full_text = ""
        for i, start in enumerate(range(0, len(audio), piece_ms)):
            piece = audio[start : start + piece_ms]
            piece_path = f"{chunk_path}_sv_{i}.wav"
            piece.export(piece_path, format="wav")
            try:
                full_text += self._send_piece(piece_path) + " "
            finally:
                if os.path.exists(piece_path):
                    os.remove(piece_path)

        return full_text.strip()
