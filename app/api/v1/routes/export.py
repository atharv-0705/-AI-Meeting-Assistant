import re
from enum import Enum

from fastapi import APIRouter, Query
from fastapi.responses import Response
from starlette.concurrency import run_in_threadpool

from app.dependencies.meeting_deps import get_ready_meeting_or_error
from app.services.export.pdf_exporter import export_pdf
from app.services.export.txt_exporter import export_txt

router = APIRouter(tags=["export"])


class ExportFormat(str, Enum):
    TXT = "txt"
    PDF = "pdf"


class ExportType(str, Enum):
    FULL = "full"
    SUMMARY = "summary"
    TRANSCRIPT = "transcript"


def _safe_filename(title: str) -> str:
    slug = re.sub(r"[^a-zA-Z0-9\-_]+", "_", title.strip()) or "meeting_report"
    return slug[:60]


@router.get("/meetings/{meeting_id}/export")
async def export_meeting(
    meeting_id: str,
    format: ExportFormat = Query(default=ExportFormat.TXT),
    type: ExportType = Query(default=ExportType.FULL),
):
    record = get_ready_meeting_or_error(meeting_id)
    filename_base = _safe_filename(record.title or "meeting_report")

    # Add type suffix to filename for clarity
    type_suffix = "" if type == ExportType.FULL else f"_{type.value}"

    if format == ExportFormat.PDF:
        content = await run_in_threadpool(export_pdf, record, type.value)
        media_type = "application/pdf"
        filename = f"{filename_base}{type_suffix}.pdf"
    else:
        content = await run_in_threadpool(export_txt, record, type.value)
        media_type = "text/plain"
        filename = f"{filename_base}{type_suffix}.txt"

    return Response(
        content=content,
        media_type=media_type,
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )
