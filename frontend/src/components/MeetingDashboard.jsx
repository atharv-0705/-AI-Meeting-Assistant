import { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { api } from "../services/api";
import "./MeetingDashboard.css";

/** Splits a raw numbered-list string from the LLM into individual line items for display. */
function toLines(raw) {
  if (!raw) return [];
  return raw
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean);
}

function ListCard({ label, dotClass, title, raw, accentClass = "" }) {
  const lines = toLines(raw);
  return (
    <div className={`card analysis-card ${accentClass}`}>
      <span className="section-label">
        <span className={`section-dot ${dotClass}`} />
        {label}
      </span>
      <h3>{title}</h3>
      {lines.length === 0 ? (
        <p className="muted">Nothing found.</p>
      ) : (
        <ul className="analysis-list">
          {lines.map((line, i) => (
            <li key={i}>{line.replace(/^\d+[.)]\s*/, "")}</li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default function MeetingDashboard({ meeting, summary, onToast }) {
  const [exporting, setExporting] = useState(null);

  const handleExport = async (format) => {
    setExporting(format);
    try {
      const { blob, filename } = await api.exportMeeting(meeting.meeting_id, format, "summary");
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
      onToast?.({ type: "success", message: `Summary exported as ${format.toUpperCase()}.` });
    } catch (err) {
      onToast?.({ type: "error", message: err.message || "Failed to export summary." });
    } finally {
      setExporting(null);
    }
  };

  return (
    <div className="dashboard">
      {/* Overview card */}
      <div className="card overview-card">
        <div>
          <span className="section-label">
            <span className="section-dot section-dot--ai" />
            Overview
          </span>
          <h2>{summary?.title || meeting.title || "Untitled meeting"}</h2>
        </div>
        <dl className="overview-meta">
          <div>
            <dt>Status</dt>
            <dd>
              <span className="badge">
                <span className="badge-dot" />
                {meeting.status}
              </span>
            </dd>
          </div>
          <div>
            <dt>Source</dt>
            <dd>{meeting.source_type === "youtube" ? "YouTube" : "Uploaded file"}</dd>
          </div>
          <div>
            <dt>Language</dt>
            <dd>{meeting.language}</dd>
          </div>
        </dl>
      </div>

      {/* Summary — rendered as Markdown */}
      <div>
        <span className="section-label">
          <span className="section-dot section-dot--ai" />
          Understand
        </span>
        <h3 className="dashboard-section-title">Summary</h3>
        <div className="card summary-card">
          <div className="summary-rendered">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {summary?.summary || "No summary generated."}
            </ReactMarkdown>
          </div>
        </div>
      </div>

      {/* Analysis cards */}
      <div className="analysis-grid">
        <ListCard
          label="Follow-through"
          dotClass="section-dot--voice"
          title="Action items"
          raw={summary?.action_items_raw}
          accentClass="analysis-card--voice"
        />
        <ListCard
          label="Outcomes"
          dotClass="section-dot--ai"
          title="Key decisions"
          raw={summary?.key_decisions_raw}
          accentClass="analysis-card--ai"
        />
        <ListCard
          label="Open loops"
          dotClass=""
          title="Open questions"
          raw={summary?.open_questions_raw}
        />
      </div>

      {/* Export controls */}
      <div className="summary-export-bar">
        <span className="section-label">
          <span className="section-dot" />
          Export summary
        </span>
        <div className="summary-export-actions">
          <button
            className="btn btn-secondary"
            onClick={() => handleExport("txt")}
            disabled={exporting !== null}
          >
            {exporting === "txt" ? "Exporting…" : "Export TXT"}
          </button>
          <button
            className="btn btn-secondary"
            onClick={() => handleExport("pdf")}
            disabled={exporting !== null}
          >
            {exporting === "pdf" ? "Exporting…" : "Export PDF"}
          </button>
        </div>
      </div>
    </div>
  );
}
