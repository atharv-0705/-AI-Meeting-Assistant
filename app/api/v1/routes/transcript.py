from fastapi import APIRouter

from app.dependencies.meeting_deps import get_ready_meeting_or_error
from app.schemas.analysis import TranscriptResponse
from app.schemas.common import SuccessResponse

router = APIRouter(tags=["transcript"])


@router.get("/meetings/{meeting_id}/transcript", response_model=SuccessResponse)
async def get_transcript(meeting_id: str):
    record = get_ready_meeting_or_error(meeting_id)
    data = TranscriptResponse(
        meeting_id=record.meeting_id,
        transcript=record.transcript or "",
        language=record.language.value,
        engine_used=record.engine_used or "",
    )
    return SuccessResponse(data=data, message="Transcript retrieved.")
