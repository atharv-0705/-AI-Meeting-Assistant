from app.models.meeting_store import MeetingRecord

REPORT_SECTIONS = ("title", "summary", "action_items", "key_decisions", "open_questions", "transcript")


def build_report_sections(record: MeetingRecord) -> dict[str, str]:
    """Single source of truth for report content/ordering, shared by both exporters
    so TXT and PDF never drift out of sync with each other."""
    return {
        "title": record.title or "Untitled Meeting",
        "summary": record.summary or "No summary available.",
        "action_items": record.action_items_raw or "No action items found.",
        "key_decisions": record.key_decisions_raw or "No key decisions found.",
        "open_questions": record.open_questions_raw or "No open questions found.",
        "transcript": record.transcript or "No transcript available.",
    }


def build_summary_sections(record: MeetingRecord) -> dict[str, str]:
    """Summary-only sections (no transcript)."""
    return {
        "title": record.title or "Untitled Meeting",
        "summary": record.summary or "No summary available.",
        "action_items": record.action_items_raw or "No action items found.",
        "key_decisions": record.key_decisions_raw or "No key decisions found.",
        "open_questions": record.open_questions_raw or "No open questions found.",
    }


def build_transcript_sections(record: MeetingRecord) -> dict[str, str]:
    """Transcript-only sections."""
    return {
        "title": record.title or "Untitled Meeting",
        "transcript": record.transcript or "No transcript available.",
    }
