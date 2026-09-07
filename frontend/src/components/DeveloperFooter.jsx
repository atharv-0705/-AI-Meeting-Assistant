export default function DeveloperFooter({
  avatarUrl,
  name = "Atharva",
  role = "Full-Stack AI Engineer",
  email = "mailto:atharva@example.com",
  github = "https://github.com/atharv-0705",
  linkedin = "https://linkedin.com",
}) {
  return (
    <footer className="w-full mt-20 border-t border-border-subtle bg-surface/80 backdrop-blur-xl">
      <div className="max-w-6xl mx-auto px-6 py-6 flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Developer Info */}
        <div className="flex items-center gap-3">
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt={name}
              className="w-9 h-9 rounded-full object-cover border border-signal-voice/40"
            />
          ) : (
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-signal-voice to-signal-ai flex items-center justify-center text-black font-bold text-sm shadow-md shadow-signal-voice/20">
              {name.charAt(0)}
            </div>
          )}

          <div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-text-primary text-sm font-display">
                {name}
              </span>
              <span className="w-1.5 h-1.5 rounded-full bg-signal-voice" />
              <span className="text-[11px] font-mono text-signal-voice bg-signal-voice/10 px-2 py-0.5 rounded-full border border-signal-voice/20">
                Open to Opportunities
              </span>
            </div>
            <p className="text-xs text-text-muted">{role} • Creator of NEXORA</p>
          </div>
        </div>

        {/* Links & Socials */}
        <div className="flex items-center gap-3">
          {email && (
            <a
              href={email}
              target="_blank"
              rel="noreferrer"
              className="px-3 py-1.5 rounded-xl bg-surface-card hover:bg-surface-card/80 border border-border-subtle hover:border-signal-voice/40 text-xs font-medium text-text-primary transition-all duration-200 flex items-center gap-1.5 cursor-pointer"
            >
              <span>✉️</span>
              <span>Contact</span>
            </a>
          )}

          {github && (
            <a
              href={github}
              target="_blank"
              rel="noreferrer"
              className="px-3 py-1.5 rounded-xl bg-surface-card hover:bg-surface-card/80 border border-border-subtle hover:border-signal-ai/40 text-xs font-medium text-text-primary transition-all duration-200 flex items-center gap-1.5 cursor-pointer"
            >
              <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/>
              </svg>
              <span>GitHub</span>
            </a>
          )}

          {linkedin && (
            <a
              href={linkedin}
              target="_blank"
              rel="noreferrer"
              className="px-3 py-1.5 rounded-xl bg-surface-card hover:bg-surface-card/80 border border-border-subtle hover:border-signal-ai/40 text-xs font-medium text-text-primary transition-all duration-200 flex items-center gap-1.5 cursor-pointer"
            >
              <svg className="w-3.5 h-3.5 fill-current text-blue-400" viewBox="0 0 24 24">
                <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
              </svg>
              <span>LinkedIn</span>
            </a>
          )}
        </div>
      </div>
    </footer>
  );
}
