// Browser-safe export helpers for the Project Information page.
// Kept free of server imports so both the UI and unit tests can use it.

export type ProjectInfo = {
  name: string;
  fullTitle: string;
  owner: string;
  status: string;
  stack: string[];
  pages: { path: string; label: string }[];
  dataset: { name: string; files: string[]; target: string };
  plannedApi: string[];
};

export type ProjectNotes = { version: string; deadline: string; team: string; notes: string };

export type ExportPayload = {
  exportedAt: string;
  project: ProjectInfo;
  notes: ProjectNotes;
};

/** Everything the page shows, plus the notes as currently filled in. */
export function buildExportPayload(info: ProjectInfo, notes: ProjectNotes, exportedAt: Date): ExportPayload {
  return {
    exportedAt: exportedAt.toISOString(),
    project: {
      name: info.name,
      fullTitle: info.fullTitle,
      owner: info.owner,
      status: info.status,
      stack: [...info.stack],
      pages: info.pages.map((p) => ({ ...p })),
      dataset: { ...info.dataset, files: [...info.dataset.files] },
      plannedApi: [...info.plannedApi],
    },
    notes: { ...notes },
  };
}

/** Builds the payload and hands the browser a JSON file to download. */
export function downloadProjectInfo(info: ProjectInfo, notes: ProjectNotes, now: Date = new Date()) {
  const payload = buildExportPayload(info, notes, now);
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `eduai-project-info-${now.toISOString().slice(0, 10)}.json`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  return payload;
}
