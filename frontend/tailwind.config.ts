import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
    "./pages/**/*.{js,ts,jsx,tsx,mdx}", // Added for safety
    "./components/**/*.{js,ts,jsx,tsx,mdx}", // Added for safety
  ],
  theme: {
    extend: {
      colors: {
        accent: "#00FFC2",
        "bg-dark": "#031114",
        surface: "#071E22",
        "text-main": "#F0F8FF",
        "surface-highlight": "#0b2a30",
        "border-dark": "#133a40",
      },
      fontFamily: {
        display: ["Be Vietnam Pro", "sans-serif"],
      },
      borderRadius: { DEFAULT: "1rem", lg: "2rem", xl: "3rem", full: "9999px" },
      animation: {
        ripple: "ripple 4s linear infinite",
        "float-1": "float 6s ease-in-out infinite",
        "float-2": "float 7s ease-in-out infinite 1s",
        "float-3": "float 5s ease-in-out infinite 2s",
        "float-4": "float 8s ease-in-out infinite 0.5s",
        "pulse-glow": "pulse-glow 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
      },
      keyframes: {
        ripple: {
          "0%": { transform: "scale(0.8)", opacity: "0.6" },
          "100%": { transform: "scale(3.5)", opacity: "0" },
        },
        float: {
          "0%, 100%": {
            opacity: "0",
            transform: "translateY(10px) scale(0.9)",
          },
          "50%": { opacity: "1", transform: "translateY(0px) scale(1)" },
        },
        "pulse-glow": {
          "0%, 100%": { boxShadow: "0 0 10px #00FFC2" },
          "50%": { boxShadow: "0 0 20px #00FFC2" },
        },
      },
      backgroundImage: {
        "grid-pattern":
          "linear-gradient(rgba(0, 255, 194, 0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(0, 255, 194, 0.03) 1px, transparent 1px)",
      },
    },
  },
  plugins: [],
};

export default config;
