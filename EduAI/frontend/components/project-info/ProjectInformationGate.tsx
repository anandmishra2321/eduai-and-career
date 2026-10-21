"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";

export function ProjectInformationGate() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const unlock = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/project-info-access", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
        cache: "no-store",
      });
      const result = await response.json() as { error?: string };
      if (!response.ok) throw new Error(result.error || "Could not unlock Project Information.");
      setPassword("");
      router.refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not unlock Project Information.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-12">
      <section className="w-full max-w-md rounded-3xl border p-7 shadow-2xl sm:p-9" style={{
        background: "var(--eduai-surface)",
        borderColor: "var(--eduai-border)",
        color: "var(--eduai-text)",
      }}>
        <a href="/settings" className="text-sm font-medium" style={{ color: "var(--eduai-accent-strong)" }}>← Project settings</a>
        <div className="mt-8 mb-5 flex h-14 w-14 items-center justify-center rounded-2xl border text-xl" style={{
          borderColor: "var(--eduai-border)",
          background: "var(--eduai-accent-soft)",
          color: "var(--eduai-accent-strong)",
        }} aria-hidden="true">E</div>
        <p className="text-xs font-semibold uppercase tracking-[0.22em]" style={{ color: "var(--eduai-accent-strong)" }}>Restricted project area</p>
        <h1 className="mt-2 text-2xl font-semibold">Project Information</h1>
        <p className="mt-2 text-sm" style={{ color: "var(--eduai-muted)" }}>
          Enter the project access password to view the dossier. Access expires automatically after one hour.
        </p>
        <form onSubmit={(event) => void unlock(event)} className="mt-6 space-y-4">
          <label className="block text-sm font-medium" htmlFor="project-info-password">Access password</label>
          <input
            id="project-info-password"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            autoComplete="current-password"
            required
            maxLength={256}
            className="w-full rounded-xl border bg-transparent px-4 py-3 text-sm outline-none focus-visible:ring-2"
            style={{ borderColor: "var(--eduai-border)", color: "var(--eduai-text)" }}
          />
          {error && <p role="alert" className="text-sm text-rose-400">{error}</p>}
          <button
            type="submit"
            disabled={busy || password.length === 0}
            className="w-full rounded-xl px-4 py-3 text-sm font-semibold transition hover:brightness-110 disabled:cursor-wait disabled:opacity-60 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
            style={{ background: "var(--eduai-accent)", color: "#07111f" }}
          >
            {busy ? "Verifying…" : "Unlock project dossier"}
          </button>
        </form>
      </section>
    </main>
  );
}
