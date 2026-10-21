/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
    "./hooks/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        cyber: {
          void: "#030712",
          abyss: "#050914",
          surface: "rgba(10, 17, 40, 0.7)",
          surfaceHover: "rgba(15, 25, 60, 0.8)",
          glass: "rgba(6, 11, 24, 0.65)",
          glassLight: "rgba(255, 255, 255, 0.05)",
          cyan: "#00F0FF",
          cyanMuted: "rgba(0, 240, 255, 0.15)",
          cyanGlow: "rgba(0, 240, 255, 0.5)",
          sky: "#38BDF8",
          blue: "#3B82F6",
          indigo: "#6366F1",
          gold: "#F59E0B",
          goldGlow: "rgba(245, 158, 11, 0.4)",
          emerald: "#10B981",
          rose: "#F43F5E",
        },
      },
      boxShadow: {
        "cyan-glow-sm": "0 0 15px rgba(0, 240, 255, 0.25)",
        "cyan-glow-md": "0 0 30px rgba(0, 240, 255, 0.45)",
        "cyan-glow-lg": "0 0 50px rgba(0, 240, 255, 0.65)",
        "gold-glow-sm": "0 0 15px rgba(245, 158, 11, 0.25)",
        "gold-glow-md": "0 0 30px rgba(245, 158, 11, 0.45)",
        "glass-panel": "0 8px 32px 0 rgba(0, 0, 0, 0.5)",
      },
      animation: {
        "pulse-slow": "pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "spin-slow": "spin 20s linear infinite",
        "float": "float 6s ease-in-out infinite",
      },
      keyframes: {
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-10px)" },
        },
      },
    },
  },
  plugins: [],
};

