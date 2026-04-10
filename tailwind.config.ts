import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        surface: "#1A1A2E",
        "surface-light": "#25253D",
        accent: "#FF6B6B",
        "accent-secondary": "#FFD93D",
      },
      fontFamily: {
        heading: ["var(--font-fredoka)", "cursive"],
        body: ["var(--font-nunito)", "sans-serif"],
      },
      animation: {
        "pulse-glow": "pulseGlow 1.5s ease-in-out infinite",
        "float": "float 3s ease-in-out infinite",
        "float-delayed": "float 3s ease-in-out 1.5s infinite",
        "shimmer": "shimmer 2s linear infinite",
      },
      keyframes: {
        pulseGlow: {
          "0%, 100%": { boxShadow: "0 0 8px 2px rgba(255, 107, 107, 0.4)" },
          "50%": { boxShadow: "0 0 20px 6px rgba(255, 107, 107, 0.7)" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-12px)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
      },
    },
  },
  plugins: [],
};
export default config;
