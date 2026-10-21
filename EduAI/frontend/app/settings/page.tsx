"use client";

import Link from "next/link";
import { useState, type CSSProperties, type FormEvent } from "react";
import {
  ACCENT_OPTIONS,
  SURFACE_STYLES,
  THEME_OPTIONS,
  useThemePreferences,
} from "@/components/providers/ThemeProvider";
import { useAuth } from "@/hooks/useAuth";
import { api } from "@/lib/api";

const cardStyle: CSSProperties = {
  background: "var(--eduai-panel-background)",
  borderColor: "var(--eduai-panel-border)",
  color: "var(--eduai-text)",
};

export default function SettingsPage() {
  const { preferences, preview, reset, save } = useThemePreferences();
  const { user, profile } = useAuth();
  const [saveMessage, setSaveMessage] = useState("");
  const [profileMessage, setProfileMessage] = useState("");
  const [profileError, setProfileError] = useState("");
  const [busy, setBusy] = useState(false);

  const saveAppearance = async () => {
    setSaveMessage("");
    try {
      const result = await save();
      setSaveMessage(result.warning ?? (result.savedTo === "profile"
        ? "Preferences saved to your profile."
        : "Preferences saved on this device."));
    } catch (error) {
      setSaveMessage(error instanceof Error ? error.message : "Could not save preferences.");
    }
  };

  const saveProfile = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!profile) {
      setProfileError("A signed-in student profile is required to save these changes.");
      return;
    }
    const form = new FormData(event.currentTarget);
    const yearValue = String(form.get("year") ?? "").trim();
    const year = yearValue ? Number(yearValue) : undefined;
    if (year !== undefined && (!Number.isInteger(year) || year < 1 || year > 20)) {
      setProfileError("Enter a valid study year between 1 and 20.");
      return;
    }

    setBusy(true);
    setProfileError("");
    setProfileMessage("");
    try {
      const changes = {
        course: String(form.get("course") ?? "").trim(),
        year,
        primary_interest: String(form.get("primary_interest") ?? "").trim(),
        career_goal: String(form.get("career_goal") ?? "").trim(),
      };
      const savedProfile = await api.student.updateProfile(changes);
      if (savedProfile.course !== changes.course
        || (changes.year !== undefined && savedProfile.year !== changes.year)
        || savedProfile.primary_interest !== changes.primary_interest
        || savedProfile.career_goal !== changes.career_goal) {
        throw new Error("The profile API did not confirm all updated fields.");
      }
      setProfileMessage("Profile updated.");
    } catch (error) {
      setProfileError(error instanceof Error ? error.message : "Profile update failed.");
    } finally {
      setBusy(false);
    }
  };

  const exportProfile = () => {
    if (!user) return;
    const payload = JSON.stringify({ user, profile }, null, 2);
    const url = URL.createObjectURL(new Blob([payload], { type: "application/json" }));
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "eduai-profile-export.json";
    anchor.click();
    URL.revokeObjectURL(url);
  };

  return (
    <main className="min-h-screen px-4 py-7 sm:px-8">
      <div className="mx-auto max-w-6xl">
        <header className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div>
            <Link href="/" className="text-sm font-medium" style={{ color: "var(--eduai-accent)" }}>
              ← Back to EduAI
            </Link>
            <h1 className="mt-3 text-3xl font-semibold">Project Settings</h1>
            <p className="mt-2 max-w-2xl text-sm" style={{ color: "var(--eduai-muted)" }}>
              Personalize the workspace. Unavailable backend capabilities are identified rather than simulated.
            </p>
          </div>
          <Link href="/project-info" className="rounded-lg border px-4 py-2 text-sm" style={cardStyle}>
            Project information
          </Link>
        </header>

        <div className="space-y-6">
          <section aria-labelledby="appearance-title" className="eduai-surface-panel rounded-2xl border p-5 sm:p-7" style={cardStyle}>
            <h2 id="appearance-title" className="text-xl font-semibold">Appearance and themes</h2>
            <p className="mt-1 text-sm" style={{ color: "var(--eduai-muted)" }}>
              Select a theme to preview it immediately. Save to sync supported profile preferences.
            </p>
            <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {THEME_OPTIONS.map((theme) => {
                const selected = preferences.theme === theme.id;
                return (
                  <article
                    key={theme.id}
                    className="rounded-xl border p-4 transition-colors"
                    style={{
                      background: theme.colors[0],
                      borderColor: selected ? "var(--eduai-accent)" : "var(--eduai-border)",
                      color: theme.id === "aurora-light" ? "#172033" : "#f1f5f9",
                    }}
                  >
                    <div className="mb-4 flex gap-2" aria-hidden="true">
                      {theme.colors.map((color) => (
                        <span key={color} className="h-6 w-6 rounded-full border border-white/20" style={{ background: color }} />
                      ))}
                    </div>
                    <h3 className="font-semibold">{theme.name}</h3>
                    <p className="mt-1 min-h-10 text-xs opacity-80">{theme.description}</p>
                    <button
                      type="button"
                      aria-pressed={selected}
                      onClick={() => preview({
                        theme: theme.id,
                        mode: theme.id === "aurora-light"
                          ? "light"
                          : preferences.mode === "light" ? "dark" : preferences.mode,
                      })}
                      className="mt-3 rounded-md border px-3 py-2 text-xs font-medium focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
                      style={{ borderColor: theme.colors[2], color: "inherit" }}
                    >
                      {selected ? "Applied · previewing" : "Apply theme"}
                    </button>
                  </article>
                );
              })}
            </div>

            <div className="mt-6 grid gap-6 md:grid-cols-2">
              <label className="block text-sm">
                Surface style
                <select
                  value={preferences.surfaceStyle}
                  onChange={(event) => {
                    const selectedStyle = SURFACE_STYLES.find((style) => style.id === event.target.value);
                    if (selectedStyle) preview({ surfaceStyle: selectedStyle.id });
                  }}
                  className="mt-2 block w-full rounded-lg border bg-transparent px-3 py-2.5"
                  style={{ borderColor: "var(--eduai-border)", color: "var(--eduai-text)" }}
                >
                  {SURFACE_STYLES.map((style) => (
                    <option key={style.id} value={style.id}>{style.name}</option>
                  ))}
                </select>
                <span className="mt-1 block text-xs" style={{ color: "var(--eduai-muted)" }}>
                  {SURFACE_STYLES.find((style) => style.id === preferences.surfaceStyle)?.description}
                </span>
              </label>
              <label className="block text-sm">
                Color mode
                <select
                  value={preferences.mode}
                  onChange={(event) => preview({ mode: event.target.value as "light" | "dark" | "system" })}
                  className="mt-2 block w-full rounded-lg border bg-transparent px-3 py-2.5"
                  style={{ borderColor: "var(--eduai-border)", color: "var(--eduai-text)" }}
                >
                  <option value="light">Light</option>
                  <option value="dark">Dark</option>
                  <option value="system">System</option>
                </select>
              </label>
              <label className="block text-sm">
                Accent color
                <select
                  value={preferences.accent}
                  onChange={(event) => preview({ accent: event.target.value as typeof preferences.accent })}
                  className="mt-2 block w-full rounded-lg border bg-transparent px-3 py-2.5"
                  style={{ borderColor: "var(--eduai-border)", color: "var(--eduai-text)" }}
                >
                  {ACCENT_OPTIONS.map((accent) => <option key={accent.id} value={accent.id}>{accent.name}</option>)}
                </select>
              </label>
              <label className="block text-sm">
                Font size <span className="ml-2 text-xs" style={{ color: "var(--eduai-muted)" }}>{preferences.fontSize}%</span>
                <input
                  aria-label="Font size"
                  type="range"
                  min="85"
                  max="120"
                  step="5"
                  value={preferences.fontSize}
                  onChange={(event) => preview({ fontSize: Number(event.target.value) })}
                  className="mt-3 block w-full accent-[var(--eduai-accent)]"
                />
              </label>
              <label className="block text-sm">
                Layout density
                <select
                  value={preferences.density}
                  onChange={(event) => preview({ density: event.target.value as "comfortable" | "compact" })}
                  className="mt-2 block w-full rounded-lg border bg-transparent px-3 py-2.5"
                  style={{ borderColor: "var(--eduai-border)", color: "var(--eduai-text)" }}
                >
                  <option value="comfortable">Comfortable</option>
                  <option value="compact">Compact</option>
                </select>
              </label>
            </div>
            <label className="mt-5 flex items-center gap-3 text-sm">
              <input
                type="checkbox"
                checked={preferences.reducedMotion}
                onChange={(event) => preview({ reducedMotion: event.target.checked })}
                className="h-4 w-4 accent-[var(--eduai-accent)]"
              />
              Reduce motion and animations
            </label>
            <div className="mt-5 flex flex-wrap gap-3">
              <button type="button" onClick={() => void saveAppearance()} className="rounded-lg px-4 py-2.5 text-sm font-semibold" style={{ background: "var(--eduai-accent)", color: "#07111f" }}>
                Save preferences
              </button>
              <button type="button" onClick={() => { reset(); setSaveMessage("Default theme preview applied. Save preferences to keep it."); }} className="rounded-lg border px-4 py-2.5 text-sm">
                Reset to default
              </button>
              {saveMessage && <p role="status" className="self-center text-sm" style={{ color: "var(--eduai-muted)" }}>{saveMessage}</p>}
            </div>
          </section>

          <section aria-labelledby="profile-title" className="eduai-surface-panel rounded-2xl border p-5 sm:p-7" style={cardStyle}>
            <h2 id="profile-title" className="text-xl font-semibold">Profile and personalization</h2>
            {profile ? (
              <form onSubmit={saveProfile} className="mt-4 grid gap-4 sm:grid-cols-2">
                <label className="text-sm">Course
                  <input name="course" defaultValue={profile.course} className="mt-2 block w-full rounded-lg border bg-transparent px-3 py-2" style={{ borderColor: "var(--eduai-border)" }} />
                </label>
                <label className="text-sm">Study year
                  <input name="year" type="number" min="1" max="20" defaultValue={profile.year || ""} className="mt-2 block w-full rounded-lg border bg-transparent px-3 py-2" style={{ borderColor: "var(--eduai-border)" }} />
                </label>
                <label className="text-sm">Primary interest
                  <input name="primary_interest" defaultValue={profile.primary_interest} className="mt-2 block w-full rounded-lg border bg-transparent px-3 py-2" style={{ borderColor: "var(--eduai-border)" }} />
                </label>
                <label className="text-sm">Career goal
                  <input name="career_goal" defaultValue={profile.career_goal} className="mt-2 block w-full rounded-lg border bg-transparent px-3 py-2" style={{ borderColor: "var(--eduai-border)" }} />
                </label>
                <button disabled={busy} className="w-fit rounded-lg px-4 py-2 text-sm font-semibold disabled:opacity-60" style={{ background: "var(--eduai-accent)", color: "#07111f" }}>
                  {busy ? "Saving…" : "Save profile"}
                </button>
                {profileMessage && <p role="status" className="self-center text-sm">{profileMessage}</p>}
                {profileError && <p role="alert" className="self-center text-sm text-red-400">{profileError}</p>}
              </form>
            ) : (
              <p className="mt-3 text-sm" style={{ color: "var(--eduai-muted)" }}>
                Sign in to load and edit the profile returned by the connected API.
              </p>
            )}
            {user && <p className="mt-4 text-xs" style={{ color: "var(--eduai-muted)" }}>Signed in as {user.email}</p>}
          </section>

          <section className="grid gap-6 md:grid-cols-2">
            <div className="eduai-surface-panel rounded-2xl border p-5 sm:p-7" style={cardStyle}>
              <h2 className="text-lg font-semibold">Language</h2>
              <label className="mt-4 block text-sm">Display preference
                <select
                  value={preferences.language}
                  onChange={(event) => {
                    preview({ language: event.target.value as typeof preferences.language });
                  }}
                  className="mt-2 block w-full rounded-lg border bg-transparent px-3 py-2"
                  style={{ borderColor: "var(--eduai-border)", color: "var(--eduai-text)" }}
                >
                  <option value="en">English</option><option value="hi">Hindi</option><option value="bilingual">Bilingual</option>
                </select>
              </label>
              <p className="mt-3 text-xs" style={{ color: "var(--eduai-muted)" }}>
                Hindi and bilingual interface translations are Not configured in the current frontend. Save preferences above to keep this selection.
              </p>
            </div>
            <div className="eduai-surface-panel rounded-2xl border p-5 sm:p-7" style={cardStyle}>
              <h2 className="text-lg font-semibold">Notifications and reminders</h2>
              <p className="mt-3 text-sm" style={{ color: "var(--eduai-muted)" }}>
                Not configured. No notification or reminder API is present in the current frontend integration.
              </p>
            </div>
            <div className="eduai-surface-panel rounded-2xl border p-5 sm:p-7" style={cardStyle}>
              <h2 className="text-lg font-semibold">Privacy, consent, and account</h2>
              <p className="mt-3 text-sm" style={{ color: "var(--eduai-muted)" }}>
                Profile export downloads the profile data currently returned to this signed-in browser. Consent management and account deletion are Not configured.
              </p>
              <button type="button" disabled={!user} onClick={exportProfile} className="mt-4 rounded-lg border px-3 py-2 text-sm disabled:opacity-50">
                Export my available profile data
              </button>
            </div>
            <div className="eduai-surface-panel rounded-2xl border p-5 sm:p-7" style={cardStyle}>
              <h2 className="text-lg font-semibold">Connected AI providers and integrations</h2>
              <p className="mt-3 text-sm" style={{ color: "var(--eduai-muted)" }}>
                The frontend defines EduAI API routes for learning, performance, career, and related modules. Connection status is not verified. Provider names, model deployments, and health checks are Not configured here.
              </p>
              <p className="mt-2 text-xs" style={{ color: "var(--eduai-muted)" }}>
                Credentials are never displayed in this interface.
              </p>
            </div>
          </section>

          <section className="eduai-surface-panel rounded-2xl border p-5 sm:p-7" style={cardStyle}>
            <h2 className="text-lg font-semibold">Accessibility and motion</h2>
            <p className="mt-2 text-sm" style={{ color: "var(--eduai-muted)" }}>
              Reduced motion is controlled above and applies a global animation fallback. Font size and layout density are adjustable without reloading.
            </p>
          </section>

          <section className="eduai-surface-panel rounded-2xl border p-5 sm:p-7" style={cardStyle}>
            <h2 className="text-lg font-semibold">Project information and documentation</h2>
            <p className="mt-2 text-sm" style={{ color: "var(--eduai-muted)" }}>
              View verified project configuration, API integration surfaces, and metadata gaps.
            </p>
            <Link href="/project-info" className="mt-4 inline-flex rounded-lg border px-4 py-2 text-sm">
              Open project information
            </Link>
          </section>
        </div>
      </div>
    </main>
  );
}
