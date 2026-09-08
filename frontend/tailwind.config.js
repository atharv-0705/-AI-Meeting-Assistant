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
        "bg-base": "rgb(var(--bg-base-rgb) / <alpha-value>)",
        "surface": "rgb(var(--surface-rgb) / <alpha-value>)",
        "surface-card": "rgb(var(--surface-card-rgb) / <alpha-value>)",
        "surface-glass": "var(--surface-glass)",
        "signal-voice": "rgb(var(--signal-voice-rgb) / <alpha-value>)",
        "signal-voice-soft": "var(--signal-voice-soft)",
        "signal-ai": "rgb(var(--signal-ai-rgb) / <alpha-value>)",
        "signal-ai-soft": "var(--signal-ai-soft)",
        "text-primary": "rgb(var(--text-primary-rgb) / <alpha-value>)",
        "text-muted": "rgb(var(--text-muted-rgb) / <alpha-value>)",
        "border-subtle": "rgb(var(--border-rgb) / 0.09)",
        "border-focus": "rgb(var(--signal-voice-rgb) / 0.4)",
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
