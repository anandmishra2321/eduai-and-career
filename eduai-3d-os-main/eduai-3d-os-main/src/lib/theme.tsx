import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

// ============================================
// Theme Definitions
// ============================================

export type ThemePreset = 
  | "neural-dark"
  | "crystal-light"
  | "cyberpunk"
  | "midnight-gold"
  | "holographic-glass"
  | "aurora";

export interface ThemeDefinition {
  id: ThemePreset;
  name: string;
  description: string;
  mode: "dark" | "light";
  colors: {
    background: string;
    foreground: string;
    accent: string;
    accentSecondary: string;
    border: string;
    muted: string;
    glow: string;
  };
  effects: {
    glassBlur: number;
    chromaticAberration: boolean;
    neonGlow: boolean;
  };
}

export const THEMES: Record<ThemePreset, ThemeDefinition> = {
  "neural-dark": {
    id: "neural-dark",
    name: "Neural Dark",
    description: "Navy, black, cyan, silver - professional AI aesthetic",
    mode: "dark",
    colors: {
      background: "oklch(0.15 0.02 240)",
      foreground: "oklch(0.95 0.01 240)",
      accent: "oklch(0.7 0.15 210)",
      accentSecondary: "oklch(0.8 0.1 220)",
      border: "oklch(0.3 0.02 240)",
      muted: "oklch(0.5 0.02 240)",
      glow: "oklch(0.7 0.15 210 / 0.5)",
    },
    effects: {
      glassBlur: 18,
      chromaticAberration: false,
      neonGlow: false,
    },
  },
  "crystal-light": {
    id: "crystal-light",
    name: "Crystal Light",
    description: "White, silver, soft blue - clean and modern",
    mode: "light",
    colors: {
      background: "oklch(0.98 0.005 240)",
      foreground: "oklch(0.2 0.02 240)",
      accent: "oklch(0.55 0.15 240)",
      accentSecondary: "oklch(0.6 0.1 220)",
      border: "oklch(0.85 0.01 240)",
      muted: "oklch(0.6 0.02 240)",
      glow: "oklch(0.55 0.15 240 / 0.3)",
    },
    effects: {
      glassBlur: 12,
      chromaticAberration: false,
      neonGlow: false,
    },
  },
  "cyberpunk": {
    id: "cyberpunk",
    name: "Cyberpunk",
    description: "Black, violet, magenta neon - futuristic high-contrast",
    mode: "dark",
    colors: {
      background: "oklch(0.1 0.02 300)",
      foreground: "oklch(0.95 0.01 300)",
      accent: "oklch(0.65 0.25 320)",
      accentSecondary: "oklch(0.7 0.2 280)",
      border: "oklch(0.3 0.05 300)",
      muted: "oklch(0.5 0.03 300)",
      glow: "oklch(0.65 0.25 320 / 0.7)",
    },
    effects: {
      glassBlur: 24,
      chromaticAberration: true,
      neonGlow: true,
    },
  },
  "midnight-gold": {
    id: "midnight-gold",
    name: "Midnight Gold",
    description: "Black, obsidian, deep gold - luxury premium feel",
    mode: "dark",
    colors: {
      background: "oklch(0.12 0.01 50)",
      foreground: "oklch(0.95 0.01 50)",
      accent: "oklch(0.7 0.15 80)",
      accentSecondary: "oklch(0.75 0.12 70)",
      border: "oklch(0.25 0.01 50)",
      muted: "oklch(0.45 0.01 50)",
      glow: "oklch(0.7 0.15 80 / 0.5)",
    },
    effects: {
      glassBlur: 20,
      chromaticAberration: false,
      neonGlow: false,
    },
  },
  "holographic-glass": {
    id: "holographic-glass",
    name: "Holographic Glass",
    description: "Translucent panels, cyan glow, chromatic aberration",
    mode: "dark",
    colors: {
      background: "oklch(0.15 0.02 200)",
      foreground: "oklch(0.95 0.01 200)",
      accent: "oklch(0.7 0.18 190)",
      accentSecondary: "oklch(0.75 0.15 210)",
      border: "oklch(0.3 0.03 200)",
      muted: "oklch(0.5 0.02 200)",
      glow: "oklch(0.7 0.18 190 / 0.6)",
    },
    effects: {
      glassBlur: 30,
      chromaticAberration: true,
      neonGlow: false,
    },
  },
  "aurora": {
    id: "aurora",
    name: "Aurora",
    description: "Mint, lavender, blue gradients - ethereal and calming",
    mode: "light",
    colors: {
      background: "oklch(0.97 0.02 180)",
      foreground: "oklch(0.2 0.02 180)",
      accent: "oklch(0.6 0.18 160)",
      accentSecondary: "oklch(0.65 0.15 200)",
      border: "oklch(0.8 0.02 180)",
      muted: "oklch(0.55 0.02 180)",
      glow: "oklch(0.6 0.18 160 / 0.4)",
    },
    effects: {
      glassBlur: 16,
      chromaticAberration: false,
      neonGlow: false,
    },
  },
};

export const ACCENTS = [
  { id: "cyan", label: "Cyan", swatch: "oklch(0.7 0.15 210)" },
  { id: "emerald", label: "Emerald", swatch: "oklch(0.7 0.18 160)" },
  { id: "gold", label: "Gold", swatch: "oklch(0.7 0.15 80)" },
  { id: "rose", label: "Rose", swatch: "oklch(0.65 0.2 22)" },
  { id: "violet", label: "Violet", swatch: "oklch(0.65 0.2 300)" },
  { id: "orange", label: "Orange", swatch: "oklch(0.7 0.18 50)" },
] as const;

export type DensityMode = "compact" | "comfortable" | "spacious";

export type ThemeSettings = {
  preset: ThemePreset;
  accent: (typeof ACCENTS)[number]["id"];
  radius: number; // rem
  glass: number; // blur px
  motion: boolean;
  fontScale: number; // % (85-120)
  density: DensityMode;
  reducedMotion: boolean;
  highContrast: boolean;
};

const DEFAULT: ThemeSettings = {
  preset: "neural-dark",
  accent: "cyan",
  radius: 0.375,
  glass: 18,
  motion: true,
  fontScale: 100,
  density: "comfortable",
  reducedMotion: false,
  highContrast: false,
};

const KEY = "eduai-theme";

const Ctx = createContext<{
  t: ThemeSettings;
  set: (p: Partial<ThemeSettings>) => void;
  reset: () => void;
  applyPreset: (preset: ThemePreset) => void;
} | null>(null);

function apply(t: ThemeSettings) {
  const r = document.documentElement;
  const theme = THEMES[t.preset];
  
  // Apply theme colors
  r.dataset["mode"] = theme.mode;
  r.dataset["accent"] = t.accent;
  r.dataset["motion"] = t.motion ? "on" : "off";
  r.dataset["density"] = t.density;
  r.dataset["chromatic"] = theme.effects.chromaticAberration ? "on" : "off";
  r.dataset["neon"] = theme.effects.neonGlow ? "on" : "off";
  r.dataset["reducedMotion"] = t.reducedMotion ? "on" : "off";
  r.dataset["highContrast"] = t.highContrast ? "on" : "off";
  
  // Apply CSS variables
  r.style.setProperty("--radius", `${t.radius}rem`);
  r.style.setProperty("--glass-blur", `${t.glass}px`);
  r.style.fontSize = `${t.fontScale}%`);
  
  // Apply theme-specific colors
  r.style.setProperty("--bg", theme.colors.background);
  r.style.setProperty("--fg", theme.colors.foreground);
  r.style.setProperty("--accent", theme.colors.accent);
  r.style.setProperty("--accent-secondary", theme.colors.accentSecondary);
  r.style.setProperty("--border", theme.colors.border);
  r.style.setProperty("--muted", theme.colors.muted);
  r.style.setProperty("--glow", theme.colors.glow);
  
  // Apply density spacing
  const densitySpacing = {
    compact: 0.75,
    comfortable: 1,
    spacious: 1.25,
  };
  r.style.setProperty("--spacing-scale", densitySpacing[t.density].toString());
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [t, setT] = useState<ThemeSettings>(DEFAULT);
  
  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) setT({ ...DEFAULT, ...JSON.parse(raw) });
    } catch { /* ignore */ }
  }, []);
  
  useEffect(() => {
    apply(t);
    try { localStorage.setItem(KEY, JSON.stringify(t)); } catch { /* ignore */ }
  }, [t]);
  
  const applyPreset = (preset: ThemePreset) => {
    const theme = THEMES[preset];
    setT({
      ...t,
      preset,
      mode: theme.mode,
      glass: theme.effects.glassBlur,
    });
  };
  
  return (
    <Ctx.Provider 
      value={{ 
        t, 
        set: (p) => setT((o) => ({ ...o, ...p })), 
        reset: () => setT(DEFAULT),
        applyPreset,
      }}
    >
      {children}
    </Ctx.Provider>
  );
}

export function useTheme() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useTheme must be inside ThemeProvider");
  return c;
}
