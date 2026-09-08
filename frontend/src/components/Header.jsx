import { useEffect, useState } from "react";

export default function Header({
  backendOnline,
  onNewMeeting,
  hasActiveMeeting,
}) {
  const [isDark, setIsDark] = useState(true);

  useEffect(() => {
    const saved = localStorage.getItem("nexora-theme");
    if (saved === "light") {
      document.documentElement.classList.remove("dark");
      document.documentElement.setAttribute("data-theme", "light");
      setIsDark(false);
    } else if (saved === "dark") {
      document.documentElement.classList.add("dark");
      document.documentElement.setAttribute("data-theme", "dark");
      setIsDark(true);
    } else {
      const isDarkTheme = document.documentElement.classList.contains("dark");
      setIsDark(isDarkTheme);
      document.documentElement.setAttribute("data-theme", isDarkTheme ? "dark" : "light");
    }
  }, []);

  const toggleTheme = () => {
    if (document.documentElement.classList.contains("dark")) {
      document.documentElement.classList.remove("dark");
      document.documentElement.setAttribute("data-theme", "light");
      setIsDark(false);
      localStorage.setItem("nexora-theme", "light");
    } else {
      document.documentElement.classList.add("dark");
      document.documentElement.setAttribute("data-theme", "dark");
      setIsDark(true);
      localStorage.setItem("nexora-theme", "dark");
    }
  };

  return (
    <header className="sticky top-0 z-30 w-full border-b backdrop-blur-xl transition-colors duration-300" style={{ background: 'var(--surface-glass)', borderColor: 'var(--border)' }}>
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between gap-4">
        {/* Brand */}
        <div
          onClick={onNewMeeting}
          className="flex items-center gap-3 cursor-pointer group"
        >
          <img
            src="/NEXORA_LOGO.jpeg"
            alt="NEXORA Logo"
            className="w-9 h-9 rounded-lg object-cover shadow-md shadow-signal-voice/20 group-hover:scale-105 transition-transform border border-emerald-500/30"
          />
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-text-primary text-base font-display tracking-tight">
                NEXORA
              </span>
            </div>
            <p className="text-[11px] text-text-muted hidden sm:block">
              AI Video &amp; Meeting Intelligence
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3">
          {/* Backend Connection Indicator */}
          <span
            className={`inline-flex items-center gap-1.5 text-xs font-mono px-2.5 py-1 rounded-full border transition-colors ${
              backendOnline === false
                ? "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/30"
                : backendOnline === true
                ? "bg-signal-voice/10 text-signal-voice border-signal-voice/30"
                : "bg-black/5 dark:bg-white/5 text-text-muted border-border-subtle"
            }`}
            title={
              backendOnline === false
                ? "Backend unreachable (Port 2210)"
                : backendOnline === true
                ? "Backend online & connected"
                : "Connecting to backend..."
            }
          >
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                backendOnline === false
                  ? "bg-red-500 dark:bg-red-400"
                  : backendOnline === true
                  ? "bg-signal-voice animate-pulse"
                  : "bg-text-muted"
              }`}
            />
            <span>{backendOnline === false ? "Offline" : "Connected"}</span>
          </span>

          {hasActiveMeeting && (
            <button
              onClick={onNewMeeting}
              className="px-3.5 py-1.5 rounded-xl bg-surface-card hover:bg-surface-card/80 border border-border-subtle hover:border-signal-voice/40 text-xs font-semibold text-text-primary transition-all duration-200 cursor-pointer shadow-sm active:scale-95"
            >
              + New Session
            </button>
          )}

          {/* Dark / Light Mode Toggle */}
          <button
            onClick={toggleTheme}
            aria-label="Toggle theme"
            className="w-8 h-8 rounded-xl bg-surface-card hover:bg-surface-card/80 border border-border-subtle hover:border-signal-voice/40 flex items-center justify-center text-text-muted hover:text-text-primary transition-all duration-200 cursor-pointer shadow-sm"
            title={isDark ? "Switch to light theme" : "Switch to dark theme"}
          >
            {isDark ? "☀" : "☾"}
          </button>
        </div>
      </div>
    </header>
  );
}
