"""TXT exporter that converts Markdown-formatted meeting content into clean,
structured plain text rather than dumping raw Markdown syntax."""

import re

from app.core.exceptions import ExportFailedError
from app.models.meeting_store import MeetingRecord
from app.services.export.report_builder import (
    build_report_sections,
    build_summary_sections,
    build_transcript_sections,
)


def _md_to_structured_text(md: str) -> str:
    """Convert Markdown text into a clean, readable plain-text format.

    Handles: headings, bold, italic, bullet lists, numbered lists, code blocks,
    inline code, and preserves paragraph spacing."""
    lines = md.split("\n")
    output: list[str] = []
    in_code_block = False

    for line in lines:
        stripped = line.rstrip()

        # Code blocks — pass through as-is
        if stripped.startswith("```"):
            in_code_block = not in_code_block
            if in_code_block:
                output.append("")
            else:
                output.append("")
            continue

        if in_code_block:
            output.append("    " + stripped)
            continue

        # Headings
        heading_match = re.match(r"^(#{1,6})\s+(.*)", stripped)
        if heading_match:
            level = len(heading_match.group(1))
            text = _strip_inline_md(heading_match.group(2))
            text_upper = text.upper()
            if level <= 2:
                output.append("")
                output.append(text_upper)
                output.append("=" * min(len(text_upper), 60))
            else:
                output.append("")
                output.append(text_upper)
                output.append("-" * min(len(text_upper), 40))
            continue

        # Bullet list items (-, *, +)
        bullet_match = re.match(r"^(\s*)[*\-+]\s+(.*)", stripped)
        if bullet_match:
            indent = len(bullet_match.group(1))
            text = _strip_inline_md(bullet_match.group(2))
            prefix = "   " * (indent // 2) + "• "
            output.append(prefix + text)
            continue

        # Numbered list items
        num_match = re.match(r"^(\s*)\d+[.)]\s+(.*)", stripped)
        if num_match:
            indent = len(num_match.group(1))
            text = _strip_inline_md(num_match.group(2))
            prefix = "   " * (indent // 2)
            # Re-extract the number
            n = re.match(r"\s*(\d+)", stripped)
            num = n.group(1) if n else "1"
            output.append(f"{prefix}{num}. {text}")
            continue

        # Empty lines
        if not stripped:
            output.append("")
            continue

        # Regular paragraph text
        output.append(_strip_inline_md(stripped))

    return "\n".join(output).strip()


def _strip_inline_md(text: str) -> str:
    """Remove inline Markdown formatting (bold, italic, inline code, links)."""
    # Inline code
    text = re.sub(r"`([^`]+)`", r"\1", text)
    # Bold + italic
    text = re.sub(r"\*\*\*(.+?)\*\*\*", r"\1", text)
    text = re.sub(r"___(.+?)___", r"\1", text)
    # Bold
    text = re.sub(r"\*\*(.+?)\*\*", r"\1", text)
    text = re.sub(r"__(.+?)__", r"\1", text)
    # Italic
    text = re.sub(r"\*(.+?)\*", r"\1", text)
    text = re.sub(r"_(.+?)_", r"\1", text)
    # Links: [text](url) -> text
    text = re.sub(r"\[([^\]]+)\]\([^)]+\)", r"\1", text)
    return text


def _format_section(heading: str, body: str) -> str:
    """Format a single report section with heading and converted body."""
    structured_body = _md_to_structured_text(body)
    heading_upper = heading.upper()
    return f"\n{heading_upper}\n{'-' * min(len(heading_upper), 60)}\n{structured_body}"


def export_txt(record: MeetingRecord, export_type: str = "full") -> bytes:
    try:
        if export_type == "summary":
            s = build_summary_sections(record)
        elif export_type == "transcript":
            s = build_transcript_sections(record)
        else:
            s = build_report_sections(record)

        title = s["title"]
        separator = "=" * 60

        parts = [
            separator,
            f"MEETING REPORT — {title}",
            separator,
        ]

        if "summary" in s:
            parts.append(_format_section("Summary", s["summary"]))
        if "action_items" in s:
            parts.append(_format_section("Action Items", s["action_items"]))
        if "key_decisions" in s:
            parts.append(_format_section("Key Decisions", s["key_decisions"]))
        if "open_questions" in s:
            parts.append(_format_section("Open Questions", s["open_questions"]))
        if "transcript" in s:
            parts.append(_format_section("Full Transcript", s["transcript"]))

        parts.append(f"\n{separator}\n")

        return "\n".join(parts).encode("utf-8")
    except Exception as exc:  # noqa: BLE001
        raise ExportFailedError("Failed to generate the TXT report.") from exc
