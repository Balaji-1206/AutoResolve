/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: [
          '"Plus Jakarta Sans"',
          '"Outfit"',
          '"Aptos"',
          '"Segoe UI Variable Display"',
          '"Segoe UI Variable Text"',
          '"SF Pro Display"',
          "-apple-system",
          "BlinkMacSystemFont",
          '"Segoe UI"',
          "Roboto",
          '"Helvetica Neue"',
          "Arial",
          "sans-serif",
        ],
        display: [
          '"Outfit"',
          '"Plus Jakarta Sans"',
          '"Aptos Display"',
          '"Segoe UI Variable Display"',
          "sans-serif",
        ],
        mono: [
          '"JetBrains Mono"',
          '"SF Mono"',
          "Menlo",
          "Monaco",
          "Consolas",
          '"Liberation Mono"',
          "monospace",
        ],
      },
      colors: {
        brand: {
          50: "#f0f4ff",
          100: "#e0e7ff",
          200: "#c7d2fe",
          300: "#a5b4fc",
          400: "#818cf8",
          500: "#6366f1",
          600: "#4f46e5",
          700: "#4338ca",
          800: "#3730a3",
          900: "#312e81",
          950: "#1e1b4b",
        },
        surface: {
          base: "#f8fafc",
          card: "rgba(255, 255, 255, 0.78)",
          elevated: "rgba(255, 255, 255, 0.90)",
          border: "rgba(226, 232, 240, 0.80)",
          highlight: "rgba(255, 255, 255, 0.95)",
        },
      },
      boxShadow: {
        card: "0 1px 3px 0 rgba(0, 0, 0, 0.04), 0 1px 2px -1px rgba(0, 0, 0, 0.04)",
        "card-hover": "0 12px 28px -6px rgba(0, 0, 0, 0.06), 0 4px 10px -3px rgba(0, 0, 0, 0.03)",
        elevated: "0 20px 40px -12px rgba(99, 102, 241, 0.08), 0 8px 16px -6px rgba(0, 0, 0, 0.04)",
        "glow-emerald": "0 0 30px -4px rgba(16, 185, 129, 0.35), 0 0 12px -2px rgba(16, 185, 129, 0.20)",
        "glow-amber": "0 0 30px -4px rgba(245, 158, 11, 0.35), 0 0 12px -2px rgba(245, 158, 11, 0.20)",
        "glow-rose": "0 0 30px -4px rgba(244, 63, 94, 0.35), 0 0 12px -2px rgba(244, 63, 94, 0.20)",
        "glow-indigo": "0 0 35px -4px rgba(99, 102, 241, 0.35), 0 0 14px -2px rgba(99, 102, 241, 0.22)",
      },
      animation: {
        "shimmer-sweep": "shimmerSweep 3.2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "pulse-subtle": "pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "float-gentle": "floatGentle 6s ease-in-out infinite",
      },
      keyframes: {
        shimmerSweep: {
          "0%": { transform: "translateX(-150%) skewX(-15deg)" },
          "45%, 100%": { transform: "translateX(150%) skewX(-15deg)" },
        },
        floatGentle: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-8px)" },
        },
      },
    },
  },
  plugins: [],
};
