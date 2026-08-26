import json
import logging
import os
import threading
from dataclasses import asdict, dataclass, field
from datetime import datetime, timezone

from app.schemas.meeting import Language, MeetingStatus, new_meeting_id, utcnow

logger = logging.getLogger("meeting_assistant.store")

DATA_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), "data")
STORE_FILE = os.path.join(DATA_DIR, "meetings.json")


@dataclass
class MeetingRecord:
    meeting_id: str
    language: Language
    source_type: str  # "youtube" | "file"
    status: MeetingStatus = MeetingStatus.PENDING
    title: str | None = None
    transcript: str | None = None
    engine_used: str | None = None
    summary: str | None = None
    action_items_raw: str | None = None
    key_decisions_raw: str | None = None
    open_questions_raw: str | None = None
    error_code: str | None = None
    error_message: str | None = None
    created_at: datetime = field(default_factory=utcnow)
    updated_at: datetime = field(default_factory=utcnow)


def _serialize_record(record: MeetingRecord) -> dict:
    """Convert a MeetingRecord to a JSON-safe dict."""
    d = asdict(record)
    d["created_at"] = record.created_at.isoformat()
    d["updated_at"] = record.updated_at.isoformat()
    d["status"] = record.status.value if isinstance(record.status, MeetingStatus) else record.status
    d["language"] = record.language.value if isinstance(record.language, Language) else record.language
    return d


def _deserialize_record(d: dict) -> MeetingRecord:
    """Reconstruct a MeetingRecord from a JSON dict."""
    d["created_at"] = datetime.fromisoformat(d["created_at"])
    d["updated_at"] = datetime.fromisoformat(d["updated_at"])
    d["status"] = MeetingStatus(d["status"])
    d["language"] = Language(d["language"])
    return MeetingRecord(**d)


class MeetingStore:
    """Thread-safe meeting store with JSON-file persistence.
    Data survives --reload / restarts. Swap for a SQLModel-backed store later
    without touching callers if a real database becomes a requirement."""

    def __init__(self):
        self._lock = threading.Lock()
        self._meetings: dict[str, MeetingRecord] = {}
        self._load()

    # ── Persistence helpers ──────────────────────────────────────────

    def _load(self) -> None:
        """Load meetings from disk if the store file exists."""
        if not os.path.isfile(STORE_FILE):
            return
        try:
            with open(STORE_FILE, "r", encoding="utf-8") as f:
                raw = json.load(f)
            for d in raw:
                try:
                    record = _deserialize_record(d)
                    self._meetings[record.meeting_id] = record
                except Exception:  # noqa: BLE001
                    logger.warning("Skipped corrupt meeting record during load: %s", d.get("meeting_id", "?"))
            logger.info("Loaded %d meeting(s) from %s", len(self._meetings), STORE_FILE)
        except Exception:  # noqa: BLE001
            logger.exception("Failed to load meeting store from %s — starting fresh", STORE_FILE)

    def _save(self) -> None:
        """Persist all meetings to disk. Must be called while holding self._lock."""
        os.makedirs(DATA_DIR, exist_ok=True)
        records = sorted(self._meetings.values(), key=lambda m: m.created_at, reverse=True)
        try:
            with open(STORE_FILE, "w", encoding="utf-8") as f:
                json.dump([_serialize_record(r) for r in records], f, ensure_ascii=False, indent=2)
        except Exception:  # noqa: BLE001
            logger.exception("Failed to save meeting store to %s", STORE_FILE)

    # ── Public API (unchanged surface) ───────────────────────────────

    def create(self, language: Language, source_type: str) -> MeetingRecord:
        record = MeetingRecord(meeting_id=new_meeting_id(), language=language, source_type=source_type)
        record.created_at = utcnow()
        record.updated_at = utcnow()
        with self._lock:
            self._meetings[record.meeting_id] = record
            self._save()
        return record

    def get(self, meeting_id: str) -> MeetingRecord | None:
        with self._lock:
            return self._meetings.get(meeting_id)

    def list_all(self) -> list[MeetingRecord]:
        with self._lock:
            return sorted(self._meetings.values(), key=lambda m: m.created_at, reverse=True)

    def delete(self, meeting_id: str) -> bool:
        with self._lock:
            removed = self._meetings.pop(meeting_id, None) is not None
            if removed:
                self._save()
            return removed

    def update(self, meeting_id: str, **fields) -> MeetingRecord | None:
        with self._lock:
            record = self._meetings.get(meeting_id)
            if record is None:
                return None
            for key, value in fields.items():
                setattr(record, key, value)
            record.updated_at = utcnow()
            self._save()
            return record


# Module-level singleton - fine for an in-memory store used across the app.
meeting_store = MeetingStore()
