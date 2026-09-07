import { useCallback, useEffect, useState } from "react";
import { api } from "../services/api";
import ConfirmModal from "./ConfirmModal";
import "./HistoryView.css";

export default function HistoryView({ onSelectMeeting, activeMeetingId, onToast, onScrollToInput }) {
  const [meetings, setMeetings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const fetchMeetings = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.listMeetings();
      setMeetings(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message || "Failed to load meeting history.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMeetings();
  }, [fetchMeetings]);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await api.deleteMeeting(deleteTarget.meeting_id);
      setMeetings((prev) => prev.filter((m) => m.meeting_id !== deleteTarget.meeting_id));
      onToast?.({ type: "success", message: `"${deleteTarget.title || "Untitled"}" deleted.` });
    } catch (err) {
      onToast?.({ type: "error", message: err.message || "Failed to delete meeting." });
    } finally {
      setDeleting(false);
      setDeleteTarget(null);
    }
  };

  const formatDate = (iso) => {
    try {
      return new Date(iso).toLocaleString(undefined, {
        dateStyle: "medium",
        timeStyle: "short",
      });
    } catch {
      return "Unknown date";
    }
  };

  const statusBorder = (status) => {
    if (status === "ready") return "history-card--ready";
    if (status === "failed") return "history-card--failed";
    return "history-card--processing";
  };

  if (loading) {
    return (
      <div className="history-view">
        <div className="empty-state">Loading meeting history…</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="history-view">
        <div className="error-banner" role="alert">
          <span>{error}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="history-view">
      <div className="history-header">
        <div>
          <span className="section-label">
            <span className="section-dot section-dot--ai" />
            Archive
          </span>
          <h3>Meeting History</h3>
        </div>
        <button className="btn btn-ghost" onClick={fetchMeetings}>
          ↻ Refresh
        </button>
      </div>

      <div className="history-grid">
        {meetings.map((m) => (
          <div
            key={m.meeting_id}
            className={`card history-card ${statusBorder(m.status)} ${
              m.meeting_id === activeMeetingId ? "history-card--active" : ""
            }`}
            onClick={() => m.status === "ready" && onSelectMeeting(m.meeting_id)}
            role={m.status === "ready" ? "button" : undefined}
            tabIndex={m.status === "ready" ? 0 : undefined}
            onKeyDown={(e) => e.key === "Enter" && m.status === "ready" && onSelectMeeting(m.meeting_id)}
          >
            <div className="history-card-icon">🎙</div>
            <h4 className="history-title">{m.title || "Untitled meeting"}</h4>
            <div className="history-meta">
              <span className="history-date">{formatDate(m.created_at)}</span>
              <span className="history-id">{m.meeting_id.slice(0, 8)}…</span>
            </div>
            <div className="history-card-footer">
              <span className={`history-status history-status--${m.status === "ready" ? "ready" : m.status === "failed" ? "failed" : "processing"}`}>
                <span className="history-status-dot" />
                {m.status}
              </span>
              <button
                className="history-delete-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  setDeleteTarget(m);
                }}
                aria-label={`Delete ${m.title || "Untitled meeting"}`}
              >
                ✕
              </button>
            </div>
          </div>
        ))}

        {/* + New meeting card */}
        <div
          className="card history-card history-card--new"
          onClick={() => onScrollToInput?.()}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => e.key === "Enter" && onScrollToInput?.()}
        >
          <div className="history-new-icon">+</div>
          <span className="history-new-label">New meeting</span>
        </div>
      </div>

      {meetings.length === 0 && (
        <div className="card history-empty-card">
          <div className="empty-state">
            <div className="history-empty-icon">📁</div>
            <h4>No meetings yet</h4>
            <p>Process your first meeting to see it here.</p>
          </div>
        </div>
      )}

      {deleteTarget && (
        <ConfirmModal
          title="Delete meeting?"
          message={`Are you sure you want to delete "${deleteTarget.title || "Untitled meeting"}"? This action cannot be undone.`}
          confirmLabel={deleting ? "Deleting…" : "Delete"}
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
          danger
          disabled={deleting}
        />
      )}
    </div>
  );
}
