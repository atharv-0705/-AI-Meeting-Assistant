from datetime import datetime, timezone
from enum import Enum
from uuid import uuid4

from pydantic import BaseModel, Field

from app.schemas.common import ErrorDetail


class Language(str, Enum):
    ENGLISH = "english"
    HINGLISH = "hinglish"


class MeetingStatus(str, Enum):
    PENDING = "pending"
    DOWNLOADING = "downloading"
    CHUNKING = "chunking"
    TRANSCRIBING = "transcribing"
    ANALYZING = "analyzing"
    INDEXING = "indexing"
    READY = "ready"
    FAILED = "failed"


class MeetingResponse(BaseModel):
    meeting_id: str
    status: MeetingStatus
    title: str | None = None
    language: Language
    source_type: str  # "youtube" | "file"
    created_at: datetime
    updated_at: datetime
    error: ErrorDetail | None = None


class MeetingListItem(BaseModel):
    meeting_id: str
    status: MeetingStatus
    title: str | None = None
    created_at: datetime


def new_meeting_id() -> str:
    return uuid4().hex


def utcnow() -> datetime:
    return datetime.now(timezone.utc)
