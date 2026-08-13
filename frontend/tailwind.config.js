/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Bright, airy base — the light the glass actually bends and catches.
        void: {
          DEFAULT: "#eef0f2",
          2: "#e6e8eb",
          3: "#dcdfe3",
        },
        // Dark ink on the light glass. No hue anywhere.
        mist: {
          DEFAULT: "#15161a",
          dim: "rgba(21,22,26,0.62)",
          faint: "rgba(21,22,26,0.36)",
        },
        // Legacy tokens kept so untouched pages don't break.
        ink: "#111111",
        paper: "#fafaf9",
      },
      fontFamily: {
        display: ["var(--font-display)", "Georgia", "serif"],
        sans: ["var(--font-body)", "-apple-system", "Inter", "sans-serif"],
        mono: ["var(--font-meta)", "ui-monospace", "SFMono-Regular", "monospace"],
      },
      backdropBlur: {
        xs: "2px",
        glass: "30px",
      },
      boxShadow: {
        glass: "inset 0 1.5px 0 0 rgba(255,255,255,0.85), inset 0 -1px 0 0 rgba(0,0,0,0.04), inset 0 0 0 1px rgba(255,255,255,0.5), 0 12px 32px -8px rgba(20,20,25,0.18)",
        "glass-sm": "inset 0 1.5px 0 0 rgba(255,255,255,0.8), inset 0 0 0 1px rgba(255,255,255,0.45), 0 6px 18px -6px rgba(20,20,25,0.14)",
        glow: "0 0 0 4px rgba(20,20,25,0.05)",
      },
      keyframes: {
        drift1: {
          "0%, 100%": { transform: "translate(-10%, -12%) scale(1)" },
          "33%": { transform: "translate(14%, 6%) scale(1.25)" },
          "66%": { transform: "translate(6%, 16%) scale(0.9)" },
        },
        drift2: {
          "0%, 100%": { transform: "translate(10%, 8%) scale(1.1)" },
          "40%": { transform: "translate(-14%, -10%) scale(0.85)" },
          "70%": { transform: "translate(-4%, 14%) scale(1.2)" },
        },
        drift3: {
          "0%, 100%": { transform: "translate(0%, 14%) scale(1)" },
          "50%": { transform: "translate(-16%, -14%) scale(1.3)" },
        },
        drift4: {
          "0%, 100%": { transform: "translate(-8%, 6%) scale(0.95)" },
          "45%": { transform: "translate(12%, -12%) scale(1.15)" },
          "80%": { transform: "translate(4%, 10%) scale(1.05)" },
        },
        sweep: {
          "0%": { transform: "translateX(-120%) skewX(-12deg)" },
          "100%": { transform: "translateX(220%) skewX(-12deg)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "0% 50%" },
          "100%": { backgroundPosition: "200% 50%" },
        },
      },
      animation: {
        drift1: "drift1 24s ease-in-out infinite",
        drift2: "drift2 29s ease-in-out infinite",
        drift3: "drift3 20s ease-in-out infinite",
        drift4: "drift4 34s ease-in-out infinite",
        sweep: "sweep 1.4s ease-in-out",
        shimmer: "shimmer 5s linear infinite",
      },
    },
  },
  plugins: [],
};
