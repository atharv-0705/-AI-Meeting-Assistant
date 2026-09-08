"""PDF exporter that parses Markdown-formatted meeting content into properly
formatted PDF elements (headings, bold, italic, lists, code) using fpdf2."""

import re

from fpdf import FPDF

from app.core.exceptions import ExportFailedError
from app.models.meeting_store import MeetingRecord
from app.services.export.report_builder import (
    build_report_sections,
    build_summary_sections,
    build_transcript_sections,
)


def _safe(text: str) -> str:
    """Sanitize and encode text for core PDF fonts (latin-1)."""
    if not text:
        return ""
    replacements = {
        "\u2022": "-",
        "\u2013": "-",
        "\u2014": "--",
        "\u2018": "'",
        "\u2019": "'",
        "\u201c": '"',
        "\u201d": '"',
        "\u2026": "...",
        "\u00a0": " ",
        "•": "-",
        "–": "-",
        "—": "--",
        "’": "'",
        "‘": "'",
        "“": '"',
        "”": '"',
        "…": "...",
    }
    for old, new in replacements.items():
        text = text.replace(old, new)
    return text.encode("latin-1", "replace").decode("latin-1")


def _render_markdown_to_pdf(pdf: FPDF, md: str) -> None:
    """Parse Markdown content and render it into the PDF with proper formatting."""
    lines = md.split("\n")
    in_code_block = False

    for line in lines:
        stripped = line.rstrip()

        # Code blocks
        if stripped.startswith("```"):
            in_code_block = not in_code_block
            if in_code_block:
                pdf.ln(2)
            else:
                pdf.ln(2)
            continue

        if in_code_block:
            pdf.set_font("Courier", "", 9)
            pdf.set_text_color(80, 80, 80)
            pdf.cell(10)  # indent
            pdf.multi_cell(0, 5, _safe(stripped))
            continue

        # Headings
        heading_match = re.match(r"^(#{1,6})\s+(.*)", stripped)
        if heading_match:
            level = len(heading_match.group(1))
            text = _strip_md_inline(heading_match.group(2))
            if level == 1:
                pdf.ln(6)
                pdf.set_font("Helvetica", "B", 16)
                pdf.set_text_color(20, 20, 20)
                pdf.multi_cell(0, 8, _safe(text))
                pdf.ln(2)
            elif level == 2:
                pdf.ln(5)
                pdf.set_font("Helvetica", "B", 14)
                pdf.set_text_color(30, 30, 30)
                pdf.multi_cell(0, 7, _safe(text))
                pdf.ln(2)
            elif level == 3:
                pdf.ln(4)
                pdf.set_font("Helvetica", "B", 12)
                pdf.set_text_color(40, 40, 40)
                pdf.multi_cell(0, 6, _safe(text))
                pdf.ln(1)
            else:
                pdf.ln(3)
                pdf.set_font("Helvetica", "B", 11)
                pdf.set_text_color(50, 50, 50)
                pdf.multi_cell(0, 6, _safe(text))
                pdf.ln(1)
            continue

        # Bullet list items
        bullet_match = re.match(r"^(\s*)[*\-+]\s+(.*)", stripped)
        if bullet_match:
            indent = len(bullet_match.group(1))
            text = _strip_md_inline(bullet_match.group(2))
            indent_px = 8 + (indent // 2) * 6
            pdf.set_font("Helvetica", "", 10)
            pdf.set_text_color(50, 50, 50)
            pdf.cell(indent_px)
            # Check if text has bold portions
            _render_inline_text(pdf, "- " + text, 10)
            pdf.ln(5.5)
            continue

        # Numbered list items
        num_match = re.match(r"^(\s*)(\d+)[.)]\s+(.*)", stripped)
        if num_match:
            indent = len(num_match.group(1))
            num = num_match.group(2)
            text = _strip_md_inline(num_match.group(3))
            indent_px = 8 + (indent // 2) * 6
            pdf.set_font("Helvetica", "", 10)
            pdf.set_text_color(50, 50, 50)
            pdf.cell(indent_px)
            _render_inline_text(pdf, f"{num}. {text}", 10)
            pdf.ln(5.5)
            continue

        # Empty lines
        if not stripped:
            pdf.ln(3)
            continue

        # Regular paragraph
        pdf.set_font("Helvetica", "", 10)
        pdf.set_text_color(50, 50, 50)
        _render_inline_text(pdf, stripped, 10)
        pdf.ln(5)


def _render_inline_text(pdf: FPDF, text: str, size: int) -> None:
    """Render text that may contain **bold** and *italic* markers."""
    # Simple approach: split on bold/italic markers and render segments
    # For the PDF, we strip all inline markdown and render as plain for robustness
    clean = _strip_md_inline(text)
    pdf.set_font("Helvetica", "", size)
    pdf.multi_cell(0, 5, _safe(clean))


def _strip_md_inline(text: str) -> str:
    """Remove inline Markdown formatting."""
    text = re.sub(r"`([^`]+)`", r"\1", text)
    text = re.sub(r"\*\*\*(.+?)\*\*\*", r"\1", text)
    text = re.sub(r"___(.+?)___", r"\1", text)
    text = re.sub(r"\*\*(.+?)\*\*", r"\1", text)
    text = re.sub(r"__(.+?)__", r"\1", text)
    text = re.sub(r"\*(.+?)\*", r"\1", text)
    text = re.sub(r"_(.+?)_", r"\1", text)
    text = re.sub(r"\[([^\]]+)\]\([^)]+\)", r"\1", text)
    return text


def _add_section_heading(pdf: FPDF, heading: str) -> None:
    """Add a section heading to the PDF."""
    pdf.ln(6)
    pdf.set_font("Helvetica", "B", 14)
    pdf.set_text_color(20, 20, 20)
    pdf.cell(0, 8, _safe(heading.upper()), new_x="LMARGIN", new_y="NEXT")
    # Underline
    pdf.set_draw_color(200, 200, 200)
    pdf.line(pdf.l_margin, pdf.get_y(), pdf.w - pdf.r_margin, pdf.get_y())
    pdf.ln(4)


def _format_transcript_text(text: str) -> str:
    """Format continuous transcript text into readable paragraphs if no double newlines exist."""
    if not text:
        return text
    if "\n\n" in text:
        return text
    # Split sentences and group into readable paragraphs
    sentences = re.split(r"(?<=[.!?])\s+", text.strip())
    if len(sentences) <= 3:
        return text
    paragraphs = []
    chunk = []
    for s in sentences:
        chunk.append(s)
        if len(chunk) >= 4:
            paragraphs.append(" ".join(chunk))
            chunk = []
    if chunk:
        paragraphs.append(" ".join(chunk))
    return "\n\n".join(paragraphs)


def export_pdf(record: MeetingRecord, export_type: str = "full") -> bytes:
    try:
        if export_type == "summary":
            s = build_summary_sections(record)
        elif export_type == "transcript":
            s = build_transcript_sections(record)
        else:
            s = build_report_sections(record)

        pdf = FPDF()
        pdf.set_auto_page_break(auto=True, margin=15)
        pdf.add_page()

        # Title
        pdf.set_font("Helvetica", "B", 20)
        pdf.set_text_color(15, 15, 15)
        pdf.multi_cell(0, 10, _safe(s["title"]))
        pdf.ln(2)

        # Subtitle line
        pdf.set_font("Helvetica", "", 9)
        pdf.set_text_color(120, 120, 120)
        subtitle = (
            "Transcript Record • Generated by Nexora AI Meeting Intelligence"
            if export_type == "transcript"
            else "Generated by Nexora AI Meeting Intelligence"
        )
        pdf.cell(0, 5, _safe(subtitle), new_x="LMARGIN", new_y="NEXT")
        pdf.ln(4)

        # Horizontal rule
        pdf.set_draw_color(220, 220, 220)
        pdf.line(pdf.l_margin, pdf.get_y(), pdf.w - pdf.r_margin, pdf.get_y())
        pdf.ln(4)

        has_preceding_sections = False

        # Render each section
        if "summary" in s:
            _add_section_heading(pdf, "Summary")
            _render_markdown_to_pdf(pdf, s["summary"])
            has_preceding_sections = True

        if "action_items" in s:
            _add_section_heading(pdf, "Action Items")
            _render_markdown_to_pdf(pdf, s["action_items"])
            has_preceding_sections = True

        if "key_decisions" in s:
            _add_section_heading(pdf, "Key Decisions")
            _render_markdown_to_pdf(pdf, s["key_decisions"])
            has_preceding_sections = True

        if "open_questions" in s:
            _add_section_heading(pdf, "Open Questions")
            _render_markdown_to_pdf(pdf, s["open_questions"])
            has_preceding_sections = True

        if "transcript" in s:
            # Only add a page break if preceding summary/action sections were already rendered
            if export_type == "full" and has_preceding_sections:
                pdf.add_page()
            _add_section_heading(
                pdf, "Transcript" if export_type == "transcript" else "Full Transcript"
            )
            formatted_transcript = _format_transcript_text(s["transcript"])
            _render_markdown_to_pdf(pdf, formatted_transcript)

        return bytes(pdf.output())
    except Exception as exc:  # noqa: BLE001
        raise ExportFailedError("Failed to generate the PDF report.") from exc
