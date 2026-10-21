"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { MotionConfig } from "motion/react";
import { api } from "@/lib/api";

export const THEME_OPTIONS = [
  { id: "neural-dark", name: "Neural Dark", description: "Navy glass with electric blue and cyan light.", colors: ["#07111f", "#163458", "#46dcff"] },
  { id: "aurora-light", name: "Aurora Light", description: "White and silver surfaces with soft blue accents.", colors: ["#f5f8fc", "#dbeafe", "#2563eb"] },
  { id: "cyberpunk", name: "Cyberpunk", description: "Charcoal surfaces with violet and magenta neon.", colors: ["#171321", "#5b21b6", "#f472b6"] },
  { id: "emerald-focus", name: "Emerald Focus", description: "Deep green, mint highlights, and restrained gold.", colors: ["#071914", "#14532d", "#6ee7b7"] },
  { id: "cosmic-3d", name: "Cosmic 3D", description: "Deep-space tones with holographic accents.", colors: ["#09091c", "#33206f", "#a78bfa"] },
  { id: "graphite-pro", name: "Graphite Pro", description: "Professional graphite, monochrome, and silver.", colors: ["#151719", "#343a40", "#d1d5db"] },
] as const;

export const ACCENT_OPTIONS = [
  { id: "cyan", name: "Cyan", value: "#22d3ee" },
  { id: "blue", name: "Blue", value: "#60a5fa" },
  { id: "violet", name: "Violet", value: "#a78bfa" },
  { id: "magenta", name: "Magenta", value: "#f472b6" },
  { id: "mint", name: "Mint", value: "#6ee7b7" },
  { id: "gold", name: "Gold", value: "#fbbf24" },
] as const;

export const SURFACE_STYLES = [
  { id: "glass", name: "Glassmorphism", description: "Translucent, blurred glass layers." },
  { id: "neumorphic", name: "Neumorphism", description: "Soft raised and inset surfaces." },
  { id: "holographic", name: "Holographic", description: "Iridescent borders and restrained glow." },
  { id: "precision", name: "Precision flat", description: "Crisp edges, low depth, and minimal effects." },
] as const;

export type ThemePreferences = {
  theme: (typeof THEME_OPTIONS)[number]["id"];
  surfaceStyle: (typeof SURFACE_STYLES)[number]["id"];
  mode: "light" | "dark" | "system";
  accent: (typeof ACCENT_OPTIONS)[number]["id"];
  fontSize: number;
  density: "comfortable" | "compact";
  reducedMotion: boolean;
  language: "en" | "hi" | "bilingual";
};

export const DEFAULT_THEME_PREFERENCES: ThemePreferences = {
  theme: "neural-dark",
  surfaceStyle: "glass",
  mode: "dark",
  accent: "cyan",
  fontSize: 100,
  density: "comfortable",
  reducedMotion: false,
  language: "en",
};

const STORAGE_KEY = "eduai-appearance-v1";
const ThemeContext = createContext<{
  preferences: ThemePreferences;
  preview: (patch: Partial<ThemePreferences>) => void;
  reset: () => void;
  save: () => Promise<{ savedTo: "profile" | "device"; warning?: string }>;
} | null>(null);

function parsePreferences(value: unknown): ThemePreferences | null {
  if (!value || typeof value !== "object") return null;
  const candidate = value as Partial<ThemePreferences>;
  const theme = THEME_OPTIONS.find((option) => option.id === candidate.theme)?.id;
  const surfaceStyle = candidate.surfaceStyle === undefined
    ? DEFAULT_THEME_PREFERENCES.surfaceStyle
    : SURFACE_STYLES.find((option) => option.id === candidate.surfaceStyle)?.id;
  const accent = ACCENT_OPTIONS.find((option) => option.id === candidate.accent)?.id;
  const mode = ["light", "dark", "system"].includes(candidate.mode ?? "") ? candidate.mode : undefined;
  const density = ["comfortable", "compact"].includes(candidate.density ?? "") ? candidate.density : undefined;
  const fontSize = typeof candidate.fontSize === "number" && candidate.fontSize >= 85 && candidate.fontSize <= 120
    ? candidate.fontSize
    : undefined;
  const language = ["en", "hi", "bilingual"].includes(candidate.language ?? "") ? candidate.language : undefined;
  if (!theme || !surfaceStyle || !accent || !mode || !density || fontSize === undefined || typeof candidate.reducedMotion !== "boolean" || !language) {
    return null;
  }
  return { theme, surfaceStyle, accent, mode, density, fontSize, reducedMotion: candidate.reducedMotion, language };
}

function samePreferences(left: ThemePreferences, right: ThemePreferences) {
  return left.theme === right.theme
    && left.surfaceStyle === right.surfaceStyle
    && left.mode === right.mode
    && left.accent === right.accent
    && left.fontSize === right.fontSize
    && left.density === right.density
    && left.reducedMotion === right.reducedMotion
    && left.language === right.language;
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [preferences, setPreferences] = useState(DEFAULT_THEME_PREFERENCES);
  const userHasEditedPreferences = useRef(false);

  useEffect(() => {
    let localPreferences: ThemePreferences | null = null;
    try {
      localPreferences = parsePreferences(JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "null"));
      if (localPreferences && !userHasEditedPreferences.current) setPreferences(localPreferences);
    } catch (error) {
      console.warn("EduAI appearance preferences could not be read from this device.", error);
    }

    if (localStorage.getItem("eduai_token")) {
      void api.auth.me()
        .then(({ profile }) => {
          const profilePreferences = parsePreferences(profile?.preferences);
          if (profilePreferences && !userHasEditedPreferences.current) setPreferences(profilePreferences);
        })
        .catch(() => {
          // Keep the usable local preference when the profile service is unavailable.
        });
    }
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    root.dataset["eduaiTheme"] = preferences.theme;
    root.dataset["surfaceStyle"] = preferences.surfaceStyle;
    root.dataset["colorMode"] = preferences.mode;
    root.dataset["accent"] = preferences.accent;
    root.dataset["density"] = preferences.density;
    root.dataset["reducedMotion"] = String(preferences.reducedMotion);
    root.style.setProperty("--eduai-font-size", `${preferences.fontSize}%`);
  }, [preferences]);

  const preview = useCallback((patch: Partial<ThemePreferences>) => {
    userHasEditedPreferences.current = true;
    setPreferences((current) => ({ ...current, ...patch }));
  }, []);

  const reset = useCallback(() => {
    userHasEditedPreferences.current = true;
    setPreferences(DEFAULT_THEME_PREFERENCES);
  }, []);

  const save = useCallback(async () => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(preferences));
    } catch (error) {
      throw new Error("Could not save appearance preferences on this device.", { cause: error });
    }

    if (!localStorage.getItem("eduai_token")) return { savedTo: "device" as const };

    try {
      const profile = await api.student.updateProfile({ preferences });
      const persistedPreferences = parsePreferences(profile.preferences);
      if (!persistedPreferences || !samePreferences(persistedPreferences, preferences)) {
        return {
          savedTo: "device" as const,
          warning: "Your API did not confirm profile preference storage; preferences are saved on this device only.",
        };
      }
      return { savedTo: "profile" as const };
    } catch (error) {
      return {
        savedTo: "device" as const,
        warning: error instanceof Error
          ? `Profile save failed (${error.message}); preferences are saved on this device only.`
          : "Profile save failed; preferences are saved on this device only.",
      };
    }
  }, [preferences]);

  const value = useMemo(() => ({ preferences, preview, reset, save }), [preferences, preview, reset, save]);
  return (
    <MotionConfig reducedMotion={preferences.reducedMotion ? "always" : "user"}>
      <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
    </MotionConfig>
  );
}

export function useThemePreferences() {
  const value = useContext(ThemeContext);
  if (!value) throw new Error("useThemePreferences must be used inside ThemeProvider");
  return value;
}
