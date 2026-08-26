import os
import shutil

from fastapi import APIRouter, BackgroundTasks, File, Form, UploadFile

from app.core.config import get_settings
from app.core.exceptions import ValidationFailedError
from app.dependencies.meeting_deps import get_meeting_or_404
from app.models.meeting_store import meeting_store
from app.schemas.common import SuccessResponse
from app.schemas.meeting import Language, MeetingListItem, MeetingResponse
from app.services.audio.downloader import extract_video_title
from app.services.pipeline import run_meeting_pipeline
from app.utils.file_utils import validate_file_extension, validate_youtube_url

router = APIRouter(tags=["meetings"])


def _to_response(record) -> MeetingResponse:
    error = None
    if record.error_code:
        from app.schemas.common import ErrorDetail

        error = ErrorDetail(code=record.error_code, message=record.error_message or "")
    return MeetingResponse(
        meeting_id=record.meeting_id,
        status=record.status,
        title=record.title,
        language=record.language,
        source_type=record.source_type,
        created_at=record.created_at,
        updated_at=record.updated_at,
        error=error,
    )


@router.post("/meetings", response_model=SuccessResponse, status_code=202)
async def create_meeting(
    background_tasks: BackgroundTasks,
    youtube_url: str | None = Form(default=None),
    language: Language = Form(default=Language.ENGLISH),
    file: UploadFile | None = File(default=None),
):
    if bool(youtube_url) == bool(file):
        raise ValidationFailedError("Provide exactly one of 'youtube_url' or 'file', not both or neither.")

    settings = get_settings()

    if youtube_url:
        validate_youtube_url(youtube_url)
        record = meeting_store.create(language=language, source_type="youtube")
        title = extract_video_title(youtube_url)
        if title:
            meeting_store.update(record.meeting_id, title=title)
        source = youtube_url
    else:
        validate_file_extension(file.filename)
        record = meeting_store.create(language=language, source_type="file")
        upload_dir = os.path.join(settings.download_dir, "uploads")
        os.makedirs(upload_dir, exist_ok=True)
        dest_path = os.path.join(upload_dir, f"{record.meeting_id}_{file.filename}")
        with open(dest_path, "wb") as out:
            shutil.copyfileobj(file.file, out)
        source = dest_path

    background_tasks.add_task(run_meeting_pipeline, record.meeting_id, source, language)

    return SuccessResponse(
        data=_to_response(meeting_store.get(record.meeting_id)),
        message="Meeting created. Processing has started in the background.",
    )


@router.get("/meetings", response_model=SuccessResponse)
async def list_meetings():
    items = [
        MeetingListItem(meeting_id=m.meeting_id, status=m.status, title=m.title, created_at=m.created_at)
        for m in meeting_store.list_all()
    ]
    return SuccessResponse(data=items, message=f"Found {len(items)} meeting(s).")


@router.get("/meetings/{meeting_id}", response_model=SuccessResponse)
async def get_meeting(meeting_id: str):
    record = get_meeting_or_404(meeting_id)
    return SuccessResponse(data=_to_response(record), message="Meeting retrieved.")


@router.delete("/meetings/{meeting_id}", response_model=SuccessResponse)
async def delete_meeting(meeting_id: str):
    get_meeting_or_404(meeting_id)  # raises 404 if missing
    meeting_store.delete(meeting_id)
    return SuccessResponse(data={"meeting_id": meeting_id}, message="Meeting deleted.")
