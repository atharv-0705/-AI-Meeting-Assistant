from fastapi import APIRouter

from app.dependencies.meeting_deps import get_ready_meeting_or_error
from app.schemas.analysis import SummaryResponse
from app.schemas.common import SuccessResponse

router = APIRouter(tags=["summary"])


@router.get("/meetings/{meeting_id}/summary", response_model=SuccessResponse)
async def get_summary(meeting_id: str):
    record = get_ready_meeting_or_error(meeting_id)
    data = SummaryResponse(
        meeting_id=record.meeting_id,
        title=record.title or "",
        summary=record.summary or "",
        action_items_raw=record.action_items_raw or "",
        key_decisions_raw=record.key_decisions_raw or "",
        open_questions_raw=record.open_questions_raw or "",
    )
    return SuccessResponse(data=data, message="Summary retrieved.")
