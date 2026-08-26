import { STAGE_LABELS, STAGE_ORDER } from "../services/api";
import "./ProcessingTimeline.css";

export default function ProcessingTimeline({ meeting }) {
  if (!meeting) {
    return (
      <div className="card processing-card">
        <div className="empty-state">Connecting…</div>
      </div>
    );
  }

  const currentIndex = Math.max(0, STAGE_ORDER.indexOf(meeting.status));
  const progressPct = Math.round(((currentIndex + 1) / STAGE_ORDER.length) * 100);
  const isFailed = meeting.status === "failed";

  const circumference = 2 * Math.PI * 42;
  const dashOffset = circumference - (isFailed ? 0 : (progressPct / 100) * circumference);

  return (
    <div className="card processing-card">
      <div className="processing-ring-wrap">
        <svg viewBox="0 0 100 100" className="processing-ring" role="img" aria-label={`${progressPct}% complete`}>
          <circle cx="50" cy="50" r="42" className="ring-track" />
          <circle
            cx="50"
            cy="50"
            r="42"
            className={`ring-progress ${isFailed ? "ring-progress--failed" : ""}`}
            strokeDasharray={circumference}
            strokeDashoffset={isFailed ? 0 : dashOffset}
          />
        </svg>
        <div className="processing-ring-label">
          <strong>{isFailed ? "!" : `${progressPct}%`}</strong>
          <span>{isFailed ? "Failed" : "Processing"}</span>
        </div>
      </div>

      <div className="processing-details">
        <span className="eyebrow">Understand</span>
        <h3>{meeting.title || "Processing your meeting…"}</h3>

        {isFailed ? (
          <div className="error-banner" role="alert">
            <span>
              <strong>{meeting.error?.code || "PROCESSING_FAILED"}</strong>
              <br />
              {meeting.error?.message || "Something went wrong while processing this meeting."}
            </span>
          </div>
        ) : (
          <ol className="stage-list">
            {STAGE_ORDER.filter((s) => s !== "ready").map((stage, i) => (
              <li
                key={stage}
                className={
                  i < currentIndex ? "done" : i === currentIndex ? "active" : ""
                }
              >
                <span className="stage-dot" />
                {STAGE_LABELS[stage]}
              </li>
            ))}
          </ol>
        )}
      </div>
    </div>
  );
}
