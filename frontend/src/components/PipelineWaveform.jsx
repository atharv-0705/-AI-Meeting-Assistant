import { useEffect, useState, useMemo } from "react";

const STAGES = [
  { label: "Acquiring Audio", color: "text-signal-voice", bg: "bg-signal-voice", accent: "#1DB975" },
  { label: "Transcribing Voice", color: "text-signal-voice", bg: "bg-signal-voice", accent: "#1DB975" },
  { label: "Generating Insights", color: "text-signal-ai", bg: "bg-signal-ai", accent: "#7C5CFC" },
  { label: "Indexing Knowledge", color: "text-signal-ai", bg: "bg-signal-ai", accent: "#7C5CFC" },
];

export default function PipelineWaveform({
  status = "idle",
  activeStage = 0,
  percent = 0,
  className = "",
}) {
  const isProcessing = status === "processing";
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setMounted(true), 100);
    return () => clearTimeout(timer);
  }, []);

  // Pre-calculated symmetrical waveform heights
  const bars = useMemo(() => {
    const count = 36;
    return Array.from({ length: count }, (_, i) => {
      const norm = (i - count / 2) / (count / 2);
      const bell = Math.exp(-norm * norm * 2.2);
      const noise = 0.35 + 0.65 * Math.sin(i * 0.95);
      return Math.max(0.12, Math.min(0.95, bell * (0.4 + 0.6 * noise)));
    });
  }, []);

  const currentStageInfo = STAGES[Math.min(activeStage, STAGES.length - 1)] || STAGES[0];

  return (
    <div className={`relative flex flex-col items-center justify-center p-6 rounded-2xl bg-surface/60 border border-border-subtle backdrop-blur-md overflow-hidden ${className}`}>
      {/* Subtle background glow effect */}
      <div
        className="absolute -inset-10 opacity-20 blur-3xl pointer-events-none transition-all duration-700"
        style={{
          background: isProcessing
            ? `radial-gradient(circle, ${currentStageInfo.accent} 0%, transparent 70%)`
            : "radial-gradient(circle, rgba(29, 185, 117, 0.25) 0%, rgba(124, 92, 252, 0.15) 50%, transparent 80%)",
        }}
      />

      {/* Waveform Visualization */}
      <div className="relative z-10 flex items-center justify-center gap-1.5 h-32 w-full px-2">
        {bars.map((heightMultiplier, i) => {
          const isAiSide = i >= bars.length / 2;
          const barColor = isProcessing
            ? i / bars.length <= (percent || 20) / 100
              ? isAiSide
                ? "bg-signal-ai shadow-[0_0_8px_rgba(124,92,252,0.8)]"
                : "bg-signal-voice shadow-[0_0_8px_rgba(29,185,117,0.8)]"
              : "bg-white/10"
            : isAiSide
            ? "bg-signal-ai/70 group-hover:bg-signal-ai"
            : "bg-signal-voice/70 group-hover:bg-signal-voice";

          const animDelay = `${(i * 35) % 800}ms`;
          const baseHeight = mounted ? `${Math.round(heightMultiplier * 100)}%` : "8%";

          return (
            <div
              key={i}
              className={`w-1.5 rounded-full transition-all duration-300 ${barColor} ${
                isProcessing ? "animate-wave-bounce" : ""
              }`}
              style={{
                height: baseHeight,
                animationDelay: animDelay,
                animationDuration: isProcessing ? "0.9s" : "2.4s",
              }}
            />
          );
        })}
      </div>

      {/* Status & Stage Tracker */}
      <div className="relative z-10 mt-6 w-full max-w-sm flex flex-col items-center">
        {isProcessing ? (
          <div className="w-full space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="font-mono text-text-muted flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${currentStageInfo.bg} animate-ping`} />
                {currentStageInfo.label}
              </span>
              <span className="font-mono font-semibold text-text-primary">
                {percent}%
              </span>
            </div>

            {/* Progress bar with voice -> AI gradient */}
            <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-signal-voice to-signal-ai transition-all duration-500 rounded-full"
                style={{ width: `${Math.max(5, percent)}%` }}
              />
            </div>

            {/* Stage markers */}
            <div className="flex justify-between items-center pt-1">
              {STAGES.map((s, idx) => (
                <div
                  key={idx}
                  className={`text-[10px] font-mono transition-colors duration-200 ${
                    idx <= activeStage ? "text-text-primary font-medium" : "text-text-muted/40"
                  }`}
                >
                  0{idx + 1}
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2 text-xs text-text-muted font-mono">
            <span className="w-2 h-2 rounded-full bg-signal-voice animate-pulse" />
            <span>Acoustic Neural Interface Ready</span>
          </div>
        )}
      </div>
    </div>
  );
}
