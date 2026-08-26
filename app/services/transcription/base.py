from typing import Protocol


class TranscriptionProvider(Protocol):
    """Contract every transcription backend must satisfy, so new providers
    (e.g. AssemblyAI, Deepgram) can be added later without touching callers."""

    name: str

    def transcribe_chunk(self, chunk_path: str) -> str:
        ...
