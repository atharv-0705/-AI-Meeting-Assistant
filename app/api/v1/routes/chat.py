from fastapi import APIRouter
from starlette.concurrency import run_in_threadpool

from app.dependencies.meeting_deps import get_ready_meeting_or_error
from app.schemas.chat import ChatRequest, ChatResponse
from app.schemas.common import SuccessResponse
from app.services.rag.rag_engine import ask_question

router = APIRouter(tags=["chat"])


@router.post("/meetings/{meeting_id}/chat", response_model=SuccessResponse)
async def chat_with_meeting(meeting_id: str, payload: ChatRequest):
    get_ready_meeting_or_error(meeting_id)  # raises if not ready / not found

    # ask_question does several sync/network calls (Chroma + Mistral) - keep off the event loop.
    answer = await run_in_threadpool(ask_question, meeting_id, payload.question)

    data = ChatResponse(meeting_id=meeting_id, question=payload.question, answer=answer)
    return SuccessResponse(data=data, message="Answer generated.")
