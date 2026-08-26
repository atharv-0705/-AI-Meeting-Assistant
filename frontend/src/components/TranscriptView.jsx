import { useState } from "react";
import { api } from "../services/api";
import "./TranscriptView.css";

export default function TranscriptView({ transcript, meetingId, onToast }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [exporting, setExporting] = useState(null);

  const transcriptText = transcript?.transcript || "";
  const engineUsed = transcript?.engine_used || "";

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(transcriptText);
      onToast?.({ type: "success", message: "Transcript copied to clipboard." });
    } catch {
      onToast?.({ type: "error", message: "Failed to copy transcript." });
    }
  };

  const handleExport = async (format) => {
    setExporting(format);
    try {
      const { blob, filename } = await api.exportMeeting(meetingId, format, "transcript");
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
      onToast?.({ type: "success", message: `Transcript exported as ${format.toUpperCase()}.` });
    } catch (err) {
      onToast?.({ type: "error", message: err.message || "Failed to export transcript." });
    } finally {
      setExporting(null);
    }
  };

  /** Highlight search matches in the transcript text. */
  const renderTranscript = () => {
    if (!transcriptText) return <p className="muted">Transcript unavailable.</p>;
    if (!searchQuery.trim()) return <p className="transcript-body">{transcriptText}</p>;

    const query = searchQuery.trim();
    const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`, "gi");
    const parts = transcriptText.split(regex);

    return (
      <p className="transcript-body">
        {parts.map((part, i) =>
          regex.test(part) ? (
            <mark key={i} className="transcript-highlight">{part}</mark>
          ) : (
            <span key={i}>{part}</span>
          )
        )}
      </p>
    );
  };

  const matchCount = searchQuery.trim()
    ? (transcriptText.match(new RegExp(searchQuery.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "gi")) || []).length
    : 0;

  return (
    <div className="transcript-view">
      <div className="card transcript-view-card">
        <div className="transcript-header">
          <div>
            <span className="eyebrow">Full record</span>
            <h3>Transcript</h3>
          </div>
          <div className="transcript-badges">
            {engineUsed && (
              <span className="badge">
                {engineUsed === "whisper" ? "Whisper" : "Sarvam AI"}
              </span>
            )}
          </div>
        </div>

        {/* Search bar */}
        <div className="transcript-toolbar">
          <div className="transcript-search-wrap">
            <span className="transcript-search-icon" aria-hidden="true">🔍</span>
            <input
              type="text"
              className="input transcript-search"
              placeholder="Search transcript…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery.trim() && (
              <span className="transcript-match-count">
                {matchCount} match{matchCount !== 1 ? "es" : ""}
              </span>
            )}
          </div>
          <div className="transcript-actions">
            <button className="btn btn-ghost" onClick={handleCopy} disabled={!transcriptText}>
              📋 Copy
            </button>
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

        {/* Transcript content */}
        <div className="transcript-content">
          {renderTranscript()}
        </div>
      </div>
    </div>
  );
}
