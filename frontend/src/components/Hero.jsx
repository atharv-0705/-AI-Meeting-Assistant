import { useState, useRef } from "react";
import PipelineWaveform from "./PipelineWaveform";

const ACCEPTED_EXTENSIONS = ".mp3,.wav,.m4a,.mp4,.mov,.mkv,.webm,.ogg,.flac";

export default function Hero({
  onStartProcessing,
  status = "idle",
  activeStage = 0,
  percent = 0,
}) {
  const [mode, setMode] = useState("youtube"); // "youtube" | "file"
  const [url, setUrl] = useState("");
  const [file, setFile] = useState(null);
  const [language, setLanguage] = useState("english");
  const [dragOver, setDragOver] = useState(false);
  const [validationError, setValidationError] = useState("");
  const fileInputRef = useRef(null);

  const isProcessing = status === "processing";

  const handleSubmit = (e) => {
    e.preventDefault();
    setValidationError("");

    if (mode === "youtube") {
      if (!url.trim()) {
        setValidationError("Please paste a valid YouTube video URL.");
        return;
      }
      onStartProcessing?.({ mode: "youtube", url: url.trim(), language });
    } else {
      if (!file) {
        setValidationError("Please select or drop an audio/video file.");
        return;
      }
      onStartProcessing?.({ mode: "file", file, language });
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const dropped = e.dataTransfer.files?.[0];
    if (dropped) {
      setFile(dropped);
      setValidationError("");
    }
  };

  return (
    <section className="relative w-full max-w-6xl mx-auto mb-16 pt-4">
      {/* Background radial accent */}
      <div className="absolute -top-16 left-1/2 -translate-x-1/2 w-3/4 h-64 bg-signal-voice/10 blur-[120px] pointer-events-none rounded-full" />

      {/* Hero Header Title */}
      <div className="text-center md:text-left mb-10">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-signal-voice/10 border border-signal-voice/20 text-signal-voice text-xs font-mono mb-4">
          <span className="w-1.5 h-1.5 rounded-full bg-signal-voice animate-ping" />
          NEXORA v2.0 • Acoustic RAG Engine
        </div>
        <h1 className="text-3xl md:text-5xl font-bold tracking-tight text-text-primary leading-tight font-display">
          From Spoken Words to <br className="hidden md:block" />
          <span className="bg-gradient-to-r from-signal-voice via-emerald-300 to-signal-ai bg-clip-text text-transparent">
            Living Intelligence
          </span>
        </h1>
        <p className="mt-3 text-text-muted text-sm md:text-base max-w-2xl">
          Ingest meeting recordings and YouTube videos. Get instant high-fidelity transcription,
          structured summaries, and ask deep questions with vector-retrieval RAG.
        </p>
      </div>

      {/* Main Two-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
        {/* Left Column: Capture Card */}
        <div className="lg:col-span-7 bg-surface/90 border border-border-subtle rounded-2xl p-6 md:p-8 backdrop-blur-xl shadow-2xl flex flex-col justify-between">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Mode Switcher Tabs */}
            <div className="flex items-center justify-between pb-2 border-b border-border-subtle">
              <span className="text-xs font-mono uppercase tracking-wider text-text-muted">
                Source Input
              </span>

              <div className="inline-flex p-1 bg-surface-card rounded-xl border border-border-subtle">
                <button
                  type="button"
                  disabled={isProcessing}
                  onClick={() => {
                    setMode("youtube");
                    setValidationError("");
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 cursor-pointer ${
                    mode === "youtube"
                      ? "bg-signal-voice text-black font-semibold shadow-sm"
                      : "text-text-muted hover:text-text-primary"
                  }`}
                >
                  YouTube Link
                </button>
                <button
                  type="button"
                  disabled={isProcessing}
                  onClick={() => {
                    setMode("file");
                    setValidationError("");
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 cursor-pointer ${
                    mode === "file"
                      ? "bg-signal-voice text-black font-semibold shadow-sm"
                      : "text-text-muted hover:text-text-primary"
                  }`}
                >
                  Audio / Video File
                </button>
              </div>
            </div>

            {/* Input Switch Area */}
            {mode === "youtube" ? (
              <div className="space-y-2">
                <label className="block text-xs font-medium text-text-muted">
                  YouTube Video or Stream URL
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-text-muted">
                    <svg className="w-5 h-5 text-red-500" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                    </svg>
                  </div>
                  <input
                    type="url"
                    value={url}
                    disabled={isProcessing}
                    onChange={(e) => {
                      setUrl(e.target.value);
                      if (validationError) setValidationError("");
                    }}
                    placeholder="https://www.youtube.com/watch?v=..."
                    className="w-full pl-11 pr-10 py-3 rounded-xl bg-surface-card border border-border-subtle text-text-primary placeholder:text-text-muted/50 text-sm focus:outline-none focus:border-signal-voice transition-colors font-sans"
                  />
                  {url && !isProcessing && (
                    <button
                      type="button"
                      onClick={() => setUrl("")}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-text-muted hover:text-text-primary"
                    >
                      ✕
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <label className="block text-xs font-medium text-text-muted">
                  Upload Audio or Video Recording
                </label>
                <div
                  onDragOver={(e) => {
                    e.preventDefault();
                    setDragOver(true);
                  }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={handleDrop}
                  onClick={() => !isProcessing && fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all duration-200 ${
                    dragOver
                      ? "border-signal-voice bg-signal-voice/10"
                      : "border-border-subtle bg-surface-card hover:border-signal-voice/50"
                  }`}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept={ACCEPTED_EXTENSIONS}
                    disabled={isProcessing}
                    onChange={(e) => {
                      if (e.target.files?.[0]) {
                        setFile(e.target.files[0]);
                        setValidationError("");
                      }
                    }}
                    className="hidden"
                  />
                  <div className="flex flex-col items-center gap-2">
                    <span className="text-2xl text-signal-voice">⬆</span>
                    <p className="text-sm font-medium text-text-primary">
                      {file ? file.name : "Click to browse or drop file here"}
                    </p>
                    <p className="text-xs text-text-muted font-mono">
                      MP3, WAV, M4A, MP4, MOV, MKV, WEBM (Up to 500MB)
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Language & Engine Selection */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div>
                <label className="block text-xs font-medium text-text-muted mb-1.5">
                  Transcription Language
                </label>
                <select
                  value={language}
                  disabled={isProcessing}
                  onChange={(e) => setLanguage(e.target.value)}
                  className="w-full py-2.5 px-3 rounded-xl bg-surface-card border border-border-subtle text-text-primary text-xs focus:outline-none focus:border-signal-voice transition-colors cursor-pointer"
                >
                  <option value="english">English (Whisper ASR)</option>
                  <option value="hinglish">Hinglish (Sarvam AI / Whisper)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-text-muted mb-1.5">
                  Intelligence Engine
                </label>
                <div className="w-full py-2.5 px-3 rounded-xl bg-surface-card/60 border border-border-subtle text-text-muted text-xs flex items-center justify-between">
                  <span>Gemini 2.5 + ChromaDB</span>
                  <span className="text-[10px] text-signal-ai font-mono">RAG Active</span>
                </div>
              </div>
            </div>

            {/* Validation alert */}
            {validationError && (
              <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center gap-2">
                <span>⚠️</span>
                <span>{validationError}</span>
              </div>
            )}

            {/* Submit CTA */}
            <button
              type="submit"
              disabled={isProcessing}
              className="w-full py-3.5 px-6 rounded-xl bg-signal-voice hover:bg-emerald-400 text-black font-semibold text-sm shadow-lg shadow-signal-voice/25 hover:shadow-signal-voice/40 transition-all duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 select-none"
            >
              {isProcessing ? (
                <>
                  <svg className="animate-spin h-4 w-4 text-black" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  <span>Processing Audio Stream…</span>
                </>
              ) : (
                <>
                  <span>Start Processing</span>
                  <span className="text-base font-bold">→</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* Right Column: Visual Pipeline Waveform */}
        <div className="lg:col-span-5 flex flex-col justify-center">
          <PipelineWaveform
            status={status}
            activeStage={activeStage}
            percent={percent}
            className="h-full min-h-[320px]"
          />
        </div>
      </div>
    </section>
  );
}
