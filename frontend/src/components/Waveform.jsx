import { useEffect, useRef, useState } from "react";
import "./Waveform.css";

const BAR_COUNT = 32;

/** Generate random-ish bar heights that look like an audio waveform. */
function generateBars() {
  return Array.from({ length: BAR_COUNT }, (_, i) => {
    const center = BAR_COUNT / 2;
    const dist = Math.abs(i - center) / center;
    // Bell-curve shape with some randomness
    const base = Math.max(0.15, 1 - dist * dist);
    const jitter = 0.7 + Math.random() * 0.6;
    return Math.min(1, base * jitter);
  });
}

export default function Waveform({ active = false }) {
  const [bars] = useState(generateBars);
  const [drawn, setDrawn] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    const timer = setTimeout(() => setDrawn(true), 650);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div
      ref={containerRef}
      className={`waveform ${drawn ? "waveform--drawn" : ""} ${active ? "waveform--active" : ""}`}
      aria-hidden="true"
    >
      <div className="waveform-bars">
        {bars.map((h, i) => {
          const isAiHalf = i >= BAR_COUNT / 2;
          return (
            <span
              key={i}
              className={`waveform-bar ${isAiHalf ? "waveform-bar--ai" : "waveform-bar--voice"}`}
              style={{
                "--bar-height": h,
                "--bar-delay": `${i * 18}ms`,
              }}
            />
          );
        })}
      </div>
    </div>
  );
}
