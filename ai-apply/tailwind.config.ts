import type { Config } from "tailwindcss";

// Dark / neon redesign. We remap the existing color families used across the
// app (slate, brand, and the semantic accents) to dark-theme values, so every
// existing utility class resolves to the new look with no per-page edits.
const config: Config = {
  content: [
    "./src/app/**/*.{ts,tsx}",
    "./src/components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"DM Sans"', "ui-sans-serif", "system-ui", "sans-serif"],
        mono: ['"JetBrains Mono"', "ui-monospace", "monospace"],
      },
      colors: {
        // Neutrals (inverted for dark mode): low shades = dark surfaces,
        // high shades = light text.
        slate: {
          50: "#0E1322",
          100: "#161D30",
          200: "rgba(232,237,245,0.10)",
          300: "rgba(232,237,245,0.16)",
          400: "#6B7A99",
          500: "#8593AE",
          600: "#A4AFC6",
          700: "#C2CADC",
          800: "#D7DDEC",
          900: "#E8EDF5",
        },
        // Accent (electric cyan).
        brand: {
          50: "rgba(0,245,255,0.10)",
          100: "rgba(0,245,255,0.16)",
          200: "rgba(0,245,255,0.30)",
          500: "#00F5FF",
          600: "#3DF7FF",
          700: "#8BFBFF",
        },
        amber: {
          50: "rgba(245,158,11,0.12)",
          100: "rgba(245,158,11,0.18)",
          200: "rgba(245,158,11,0.32)",
          400: "#FBBF24",
          700: "#FCD34D",
        },
        rose: {
          50: "rgba(244,63,94,0.12)",
          100: "rgba(244,63,94,0.18)",
          200: "rgba(244,63,94,0.32)",
          400: "#FB7185",
          600: "#FDA4AF",
          700: "#FDA4AF",
        },
        emerald: {
          50: "rgba(16,185,129,0.12)",
          100: "rgba(16,185,129,0.18)",
          200: "rgba(16,185,129,0.32)",
          500: "#10D8A4",
          700: "#6EE7B7",
        },
        violet: {
          100: "rgba(139,92,246,0.20)",
          500: "#8B5CF6",
          700: "#C4B5FD",
        },
      },
    },
  },
  plugins: [],
};

export default config;
