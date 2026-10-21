"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function ProjectInformationActions() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [exporting, setExporting] = useState(false);

  const lockDossier = async () => {
    setError("");
    try {
      const response = await fetch("/api/project-info-access", { method: "DELETE", cache: "no-store" });
      if (!response.ok) throw new Error("Could not end the Project Information session.");
      router.refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not end the Project Information session.");
    }
  };

  const exportMarkdown = async () => {
    setError("");
    setExporting(true);
    try {
      const response = await fetch("/api/project-info-export", { cache: "no-store" });
      if (!response.ok) throw new Error(response.status === 401
        ? "Your Project Information session expired. Unlock the dossier again."
        : "Could not export Project Information.");
      const file = await response.blob();
      const url = URL.createObjectURL(file);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = "eduai-project-information.md";
      anchor.click();
      URL.revokeObjectURL(url);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not export Project Information.");
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="project-actions flex flex-wrap gap-2">
      <button type="button" onClick={() => void lockDossier()} className="rounded-lg border px-4 py-2.5 text-sm" style={{
        background: "var(--eduai-surface)",
        borderColor: "var(--eduai-border)",
      }}>
        Lock dossier
      </button>
      <button type="button" disabled={exporting} onClick={() => void exportMarkdown()} className="rounded-lg border px-4 py-2.5 text-sm disabled:opacity-60" style={{
        background: "var(--eduai-surface)",
        borderColor: "var(--eduai-border)",
      }}>
        {exporting ? "Preparing…" : "Export Markdown"}
      </button>
      <button type="button" onClick={() => window.print()} className="rounded-lg px-4 py-2.5 text-sm font-semibold" style={{ background: "var(--eduai-accent)", color: "#07111f" }}>
        Print / Save PDF
      </button>
      {error && <p role="alert" className="basis-full text-sm text-rose-400">{error}</p>}
    </div>
  );
}
