/**
 * EduAI Design System Tokens
 * Single source of truth for color, lighting, glassmorphism, typography, and motion metrics.
 * Modify tokens here to re-theme the entire 3D Operating System without modifying component markup.
 */

export const DESIGN_TOKENS = {
  colors: {
    bg: {
      abyss: "#030712",
      deep: "#050914",
      surface: "rgba(10, 17, 40, 0.65)",
      surfaceHover: "rgba(15, 25, 60, 0.8)",
      surfaceActive: "rgba(20, 35, 80, 0.9)",
      glass: "rgba(6, 11, 24, 0.70)",
      glassLight: "rgba(255, 255, 255, 0.04)",
      glassBorder: "rgba(0, 240, 255, 0.18)",
      glassBorderHover: "rgba(0, 240, 255, 0.45)",
    },
    primary: {
      cyan: "#00F0FF",
      cyanGlow: "rgba(0, 240, 255, 0.5)",
      cyanMuted: "rgba(0, 240, 255, 0.12)",
      sky: "#38BDF8",
      blue: "#3B82F6",
    },
    accent: {
      indigo: "#6366F1",
      violet: "#8B5CF6",
      gold: "#F59E0B",
      goldGlow: "rgba(245, 158, 11, 0.4)",
      emerald: "#10B981",
      rose: "#F43F5E",
    },
    text: {
      primary: "#F8FAFC",
      secondary: "#94A3B8",
      muted: "#64748B",
      highlight: "#00F0FF",
      accent: "#38BDF8",
    },
  },
  glows: {
    cyanSubtle: "0 0 15px rgba(0, 240, 255, 0.18)",
    cyanMedium: "0 0 30px rgba(0, 240, 255, 0.38)",
    cyanIntense: "0 0 50px rgba(0, 240, 255, 0.65)",
    goldSubtle: "0 0 15px rgba(245, 158, 11, 0.20)",
    goldMedium: "0 0 30px rgba(245, 158, 11, 0.40)",
  },
  glass: {
    backdropBlur: "backdrop-blur-xl",
    border: "border border-cyan-500/20",
    borderHover: "border-cyan-400/50",
    shadow: "shadow-[0_8px_32px_0_rgba(0,0,0,0.55)]",
    rounded: "rounded-2xl",
  },
  typography: {
    fontMono: "'JetBrains Mono', 'Fira Code', 'Courier New', monospace",
    fontSans: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
  },
  motion: {
    spring: {
      type: "spring",
      stiffness: 300,
      damping: 30,
    },
    transitionCinematic: {
      duration: 1.2,
      ease: [0.16, 1, 0.3, 1],
    },
    transitionSmooth: {
      duration: 0.5,
      ease: [0.25, 0.8, 0.25, 1],
    },
    transitionQuick: {
      duration: 0.2,
      ease: "easeInOut",
    },
  },
} as const;

export type DesignTokens = typeof DESIGN_TOKENS;

