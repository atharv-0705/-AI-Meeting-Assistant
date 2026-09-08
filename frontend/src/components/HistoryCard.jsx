import { useState, useMemo } from "react";

export function HistoryCard({
  meeting,
  onOpen,
  onDelete,
}) {
  const { id, title, date, status, duration, source_type } = meeting;

  const isCompleted = status === "completed";
  const isProcessing = status === "processing";
  const isFailed = status === "failed";

  const formattedDate = useMemo(() => {
    if (!date) return "Recently";
    try {
      const d = new Date(date);
      return d.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return date;
    }
  }, [date]);

  return (
    <div className="group relative bg-surface/80 hover:bg-surface border border-border-subtle hover:border-signal-ai/40 rounded-2xl p-5 flex flex-col justify-between transition-all duration-300 hover:shadow-xl hover:shadow-signal-ai/5 backdrop-blur-md">
      {/* Top accent bar */}
      <div
        className={`absolute top-0 left-6 right-6 h-[2px] rounded-t-full transition-colors duration-300 ${
          isCompleted
            ? "bg-signal-ai/60 group-hover:bg-signal-ai"
            : isProcessing
            ? "bg-yellow-400/60 group-hover:bg-yellow-400"
            : "bg-red-400/60"
        }`}
      />

      {/* Header Info */}
      <div>
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] font-mono px-2 py-0.5 rounded-md bg-black/5 dark:bg-white/5 border border-border-subtle text-text-muted">
              {source_type === "file" ? "FILE" : "YOUTUBE"}
            </span>
            {duration && (
              <span className="text-[11px] font-mono text-text-muted">
                {duration}
              </span>
            )}
          </div>

          {/* Status badge */}
          <span
            className={`inline-flex items-center gap-1 text-[11px] font-mono font-medium px-2 py-0.5 rounded-full ${
              isCompleted
                ? "bg-signal-voice/10 text-signal-voice border border-signal-voice/20"
                : isProcessing
                ? "bg-yellow-400/10 text-yellow-600 dark:text-yellow-400 border border-yellow-400/20 animate-pulse"
                : "bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20"
            }`}
          >
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                isCompleted ? "bg-signal-voice" : isProcessing ? "bg-yellow-400" : "bg-red-400"
              }`}
            />
            {status || "ready"}
          </span>
        </div>

        {/* Meeting Title */}
        <h3
          onClick={() => isCompleted && onOpen?.(id)}
          className={`font-semibold text-text-primary text-base line-clamp-2 leading-snug mb-2 font-display ${
            isCompleted ? "cursor-pointer hover:text-signal-voice transition-colors" : ""
          }`}
          title={title || `Meeting ${id}`}
        >
          {title || `Meeting ${id?.slice?.(0, 8) || id}`}
        </h3>

        <p className="text-xs text-text-muted font-mono">{formattedDate}</p>
      </div>

      {/* Footer Actions */}
      <div className="mt-6 pt-4 border-t border-border-subtle flex items-center justify-between">
        <button
          type="button"
          onClick={() => onOpen?.(id)}
          disabled={!isCompleted}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-signal-ai hover:opacity-80 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-opacity"
        >
          <span>Open Dashboard</span>
          <span>→</span>
        </button>

        {onDelete && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onDelete(id);
            }}
            title="Delete meeting"
            className="text-text-muted hover:text-red-500 p-1.5 rounded-lg hover:bg-red-500/10 transition-colors cursor-pointer"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
}

export function NewMeetingCard({ onNew }) {
  return (
    <div
      onClick={onNew}
      className="group border-2 border-dashed border-border-subtle hover:border-signal-voice/50 bg-surface-card/40 hover:bg-surface-card/80 rounded-2xl p-6 flex flex-col items-center justify-center text-center cursor-pointer transition-all duration-300 min-h-[190px]"
    >
      <div className="w-10 h-10 rounded-xl bg-signal-voice/10 group-hover:bg-signal-voice group-hover:text-white dark:group-hover:text-black text-signal-voice flex items-center justify-center text-xl font-bold mb-3 transition-colors duration-200">
        +
      </div>
      <h4 className="font-semibold text-text-primary text-sm font-display mb-1 group-hover:text-signal-voice transition-colors">
        Capture New Session
      </h4>
      <p className="text-xs text-text-muted max-w-[180px]">
        Analyze another YouTube stream or local recording
      </p>
    </div>
  );
}

export default function HistoryGrid({
  meetings = [],
  onOpen,
  onDelete,
  onNew,
}) {
  const [search, setSearch] = useState("");

  const filteredMeetings = useMemo(() => {
    if (!search.trim()) return meetings;
    const query = search.toLowerCase();
    return meetings.filter(
      (m) =>
        m.title?.toLowerCase().includes(query) ||
        m.id?.toLowerCase().includes(query)
    );
  }, [meetings, search]);

  return (
    <section className="w-full max-w-6xl mx-auto my-12">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-bold font-display text-text-primary">
              Session Notebook
            </h2>
            <span className="text-xs font-mono px-2.5 py-0.5 rounded-full bg-surface-card border border-border-subtle text-text-muted">
              {meetings.length} Indexed
            </span>
          </div>
          <p className="text-xs text-text-muted mt-1">
            Browse previous meeting analyses, transcripts, and indexed RAG contexts.
          </p>
        </div>

        {/* Search filter */}
        {meetings.length > 0 && (
          <div className="relative w-full sm:w-64">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search meetings…"
              className="w-full pl-9 pr-3 py-2 rounded-xl bg-surface-card border border-border-subtle text-xs text-text-primary placeholder:text-text-muted/50 focus:outline-none focus:border-signal-ai transition-colors"
            />
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-text-muted text-xs">
              🔍
            </span>
          </div>
        )}
      </div>

      {/* Grid container */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {onNew && <NewMeetingCard onNew={onNew} />}

        {filteredMeetings.map((m) => (
          <HistoryCard
            key={m.id}
            meeting={m}
            onOpen={onOpen}
            onDelete={onDelete}
          />
        ))}
      </div>

      {meetings.length === 0 && (
        <div className="text-center py-12 border border-dashed border-border-subtle rounded-2xl bg-surface/30">
          <p className="text-text-muted text-sm font-mono">
            No meeting sessions recorded yet. Start by capturing a YouTube URL or audio file above.
          </p>
        </div>
      )}
    </section>
  );
}
