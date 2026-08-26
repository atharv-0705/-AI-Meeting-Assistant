import { useCallback, useEffect, useState } from "react";
import { api } from "../services/api";
import ConfirmModal from "./ConfirmModal";
import "./HistoryView.css";

export default function HistoryView({ onSelectMeeting, activeMeetingId, onToast }) {
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

  const statusClass = (status) => {
    if (status === "ready") return "badge";
    if (status === "failed") return "badge badge-danger";
    return "badge";
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
          <span className="eyebrow">Archive</span>
          <h3>Meeting History</h3>
        </div>
        <button className="btn btn-ghost" onClick={fetchMeetings}>
          ↻ Refresh
        </button>
      </div>

      {meetings.length === 0 ? (
        <div className="card history-empty-card">
          <div className="empty-state">
            <div className="history-empty-icon">📁</div>
            <h4>No meetings yet</h4>
            <p>Process your first meeting to see it here.</p>
          </div>
        </div>
      ) : (
        <div className="history-list">
          {meetings.map((m) => (
            <div
              key={m.meeting_id}
              className={`card history-card ${m.meeting_id === activeMeetingId ? "history-card--active" : ""}`}
            >
              <div className="history-card-main">
                <div className="history-card-info">
                  <h4 className="history-title">{m.title || "Untitled meeting"}</h4>
                  <div className="history-meta">
                    <span className="history-date">{formatDate(m.created_at)}</span>
                    <span className="history-id">ID: {m.meeting_id.slice(0, 8)}…</span>
                  </div>
                </div>
                <span className={statusClass(m.status)}>
                  <span className="badge-dot" />
                  {m.status}
                </span>
              </div>
              <div className="history-card-actions">
                <button
                  className="btn btn-primary"
                  onClick={() => onSelectMeeting(m.meeting_id)}
                  disabled={m.status !== "ready"}
                  title={m.status !== "ready" ? "This meeting is not ready yet" : "Open this meeting"}
                >
                  Open
                </button>
                <button
                  className="btn btn-secondary history-delete-btn"
                  onClick={() => setDeleteTarget(m)}
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
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
