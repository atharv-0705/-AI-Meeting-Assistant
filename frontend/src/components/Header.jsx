import "./Header.css";

export default function Header({ theme, onToggleTheme, backendOnline, onNewMeeting, hasActiveMeeting }) {
  return (
    <header className="header">
      <div className="header-inner">
        <div className="brand">
          <span className="brand-mark" aria-hidden="true">
            N
          </span>
          <div className="brand-text">
            <strong>NEXORA</strong>
            <span>AI Meeting Intelligence &amp; RAG</span>
          </div>
        </div>

        <div className="header-actions">
          <span
            className={`badge ${backendOnline === false ? "badge-danger" : ""}`}
            title={backendOnline === false ? "Backend unreachable" : "Backend connected"}
          >
            <span className="badge-dot" />
            {backendOnline === false ? "Offline" : "Connected"}
          </span>

          {hasActiveMeeting && (
            <button className="btn btn-secondary" onClick={onNewMeeting}>
              New meeting
            </button>
          )}

          <button
            className="theme-toggle"
            onClick={onToggleTheme}
            aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
            title={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
          >
            {theme === "dark" ? "☾" : "☀"}
          </button>
        </div>
      </div>
    </header>
  );
}
