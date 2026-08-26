import { useRef, useState } from "react";
import "./MeetingInput.css";

const ACCEPTED_EXTENSIONS = ".mp3,.wav,.m4a,.mp4,.mov,.mkv,.webm,.ogg,.flac";

export default function MeetingInput({ onSubmit, submitting }) {
  const [mode, setMode] = useState("youtube"); // "youtube" | "file"
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [file, setFile] = useState(null);
  const [language, setLanguage] = useState("english");
  const [localError, setLocalError] = useState(null);
  const fileInputRef = useRef(null);

  const handleSubmit = (e) => {
    e.preventDefault();
    setLocalError(null);

    if (mode === "youtube") {
      if (!youtubeUrl.trim()) {
        setLocalError("Paste a YouTube URL first.");
        return;
      }
      onSubmit({ type: "youtube", youtubeUrl: youtubeUrl.trim(), language });
    } else {
      if (!file) {
        setLocalError("Choose an audio or video file first.");
        return;
      }
      onSubmit({ type: "file", file, language });
    }
  };

  return (
    <form className="meeting-input" onSubmit={handleSubmit}>
      <div className="section-heading">
        <div>
          <span className="eyebrow">Capture</span>
          <h2>Bring in a meeting</h2>
        </div>
      </div>

      <div className="input-mode-tabs" role="tablist">
        <button
          type="button"
          role="tab"
          aria-selected={mode === "youtube"}
          className={`mode-tab ${mode === "youtube" ? "active" : ""}`}
          onClick={() => setMode("youtube")}
        >
          YouTube URL
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={mode === "file"}
          className={`mode-tab ${mode === "file" ? "active" : ""}`}
          onClick={() => setMode("file")}
        >
          Upload file
        </button>
      </div>

      <div className="input-cards">
        {mode === "youtube" ? (
          <div className="card card--cool input-card">
            <label className="field-label" htmlFor="youtube-url">
              YouTube link
            </label>
            <input
              id="youtube-url"
              className="input"
              type="url"
              placeholder="https://youtu.be/..."
              value={youtubeUrl}
              onChange={(e) => setYoutubeUrl(e.target.value)}
              disabled={submitting}
            />
          </div>
        ) : (
          <div
            className="card card--warm input-card upload-drop"
            onClick={() => fileInputRef.current?.click()}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === "Enter" && fileInputRef.current?.click()}
          >
            <span className="upload-icon" aria-hidden="true">
              ⬆
            </span>
            <p className="upload-label">{file ? file.name : "Click to choose an audio or video file"}</p>
            <span className="upload-hint">MP3, WAV, M4A, MP4, MOV, MKV, WEBM, OGG, FLAC</span>
            <input
              ref={fileInputRef}
              type="file"
              accept={ACCEPTED_EXTENSIONS}
              hidden
              disabled={submitting}
              onChange={(e) => setFile(e.target.files?.[0] || null)}
            />
          </div>
        )}

        <div className="field-group">
          <label className="field-label" htmlFor="language-select">
            Language
          </label>
          <select
            id="language-select"
            className="select"
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            disabled={submitting}
          >
            <option value="english">English (Whisper)</option>
            <option value="hinglish">Hinglish (Sarvam AI)</option>
          </select>
        </div>
      </div>

      {localError && (
        <div className="error-banner" role="alert">
          <span>{localError}</span>
        </div>
      )}

      <button type="submit" className="btn btn-primary submit-btn" disabled={submitting}>
        {submitting ? "Starting…" : "Start processing"}
      </button>
    </form>
  );
}
