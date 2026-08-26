from app.core.exceptions import MeetingNotFoundError, MeetingNotReadyError
from app.models.meeting_store import MeetingRecord, meeting_store
from app.schemas.meeting import MeetingStatus


def get_meeting_or_404(meeting_id: str) -> MeetingRecord:
    record = meeting_store.get(meeting_id)
    if record is None:
        raise MeetingNotFoundError(f"No meeting found with id '{meeting_id}'.")
    return record


def get_ready_meeting_or_error(meeting_id: str) -> MeetingRecord:
    record = get_meeting_or_404(meeting_id)
    if record.status != MeetingStatus.READY:
        if record.status == MeetingStatus.FAILED:
            raise MeetingNotReadyError(
                f"This meeting failed during processing: {record.error_message or 'unknown error'}"
            )
        raise MeetingNotReadyError(f"This meeting is still processing (status: {record.status.value}).")
    return record
