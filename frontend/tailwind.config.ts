import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",      // Added for safety
    "./components/**/*.{js,ts,jsx,tsx,mdx}", // Added for safety
  ],
  theme: {
    extend: {
      colors: {
        bg: {
          base: "#0b0f1a",
          subtle: "#0f1424",
          elevated: "#141a2e",
        },
        glass: {
          DEFAULT: "rgba(255,255,255,0.06)",
          hover: "rgba(255,255,255,0.09)",
          strong: "rgba(255,255,255,0.12)",
        },
        border: {
          soft: "rgba(255,255,255,0.10)",
          strong: "rgba(255,255,255,0.18)",
        },
        text: {
          primary: "#e6e8ef",
          secondary: "#b3b8cc",
          muted: "#7d849f",
          subtle: "#5a607a",
        },
        brand: {
          primary: "#7c7cff",
          secondary: "#4fd1c5",
          glow: "#9fa8ff",
        },
        state: {
          success: "#22c55e",
          warning: "#facc15",
          error: "#ef4444",
        },
      },
    },
  },
  plugins: [],
};

export default config;