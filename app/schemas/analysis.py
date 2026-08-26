from pydantic import BaseModel


class TranscriptResponse(BaseModel):
    meeting_id: str
    transcript: str
    language: str
    engine_used: str


class ActionItem(BaseModel):
    task: str
    owner: str
    deadline: str


class SummaryResponse(BaseModel):
    meeting_id: str
    title: str
    summary: str
    action_items_raw: str
    key_decisions_raw: str
    open_questions_raw: str
