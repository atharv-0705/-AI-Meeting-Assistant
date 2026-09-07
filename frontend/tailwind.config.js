/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        "bg-base": "#0A0F0D",
        "bg-base-light": "#F8FAF9",
        "surface": "#121815",
        "surface-light": "#FFFFFF",
        "surface-card": "#151D19",
        "surface-card-light": "#F1F5F3",
        "surface-glass": "rgba(18, 24, 21, 0.75)",
        "surface-glass-light": "rgba(255, 255, 255, 0.85)",
        "signal-voice": "#1DB975",
        "signal-voice-soft": "rgba(29, 185, 117, 0.15)",
        "signal-ai": "#7C5CFC",
        "signal-ai-soft": "rgba(124, 92, 252, 0.15)",
        "text-primary": "#EDF2F0",
        "text-primary-light": "#111815",
        "text-muted": "#8B978F",
        "text-muted-light": "#617066",
        "border-subtle": "rgba(255, 255, 255, 0.08)",
        "border-subtle-light": "rgba(0, 0, 0, 0.08)",
        "border-focus": "rgba(29, 185, 117, 0.4)",
      },
      fontFamily: {
        display: ["Space Grotesk", "sans-serif"],
        sans: ["Plus Jakarta Sans", "system-ui", "-apple-system", "sans-serif"],
        mono: ["JetBrains Mono", "monospace"],
      },
      animation: {
        "pulse-subtle": "pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
      },
    },
  },
  plugins: [],
};
