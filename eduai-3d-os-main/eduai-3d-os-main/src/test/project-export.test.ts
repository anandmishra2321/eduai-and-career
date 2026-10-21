import { describe, expect, it } from "vitest";

import { buildExportPayload, type ProjectInfo, type ProjectNotes } from "@/lib/project-export";

const info: ProjectInfo = {
  name: "EDUAI",
  fullTitle: "AI-Powered Personalized Learning, Performance & Career Intelligence Platform",
  owner: "Anand Kumar Mishra",
  status: "Frontend complete · backend pending",
  stack: ["TanStack Start (React 19)", "Three.js / React Three Fiber"],
  pages: [{ path: "/world", label: "3D Intelligence World" }],
  dataset: {
    name: "UCI Student Performance",
    files: ["student-mat.csv (Maths)", "student-por.csv (Portuguese)"],
    target: "Final grade G3 (0–20)",
  },
  plannedApi: ["GET /api/academic/summary", "POST /api/agent/chat"],
};

const notes: ProjectNotes = {
  version: "1.0.0",
  deadline: "2026-12-31",
  team: "Dr. Sharma",
  notes: "Final year project. Guide: Dr. Sharma.",
};

describe("Project Information export", () => {
  const when = new Date("2026-10-10T18:41:54.931Z");

  it("exports every project section together with the saved notes", () => {
    const payload = buildExportPayload(info, notes, when);

    expect(Object.keys(payload)).toEqual(["exportedAt", "project", "notes"]);
    expect(payload.exportedAt).toBe("2026-10-10T18:41:54.931Z");
    expect(payload.project.name).toBe("EDUAI");
    expect(payload.project.owner).toBe("Anand Kumar Mishra");
    expect(payload.project.dataset.files).toEqual(info.dataset.files);
    expect(payload.project.plannedApi).toEqual(["GET /api/academic/summary", "POST /api/agent/chat"]);
    expect(payload.notes).toEqual(notes);
  });

  it("keeps the exported copy independent of the data on screen", () => {
    const payload = buildExportPayload(info, notes, when);
    payload.project.stack.push("Something added later");
    payload.notes.notes = "changed";

    expect(info.stack).toEqual(["TanStack Start (React 19)", "Three.js / React Three Fiber"]);
    expect(notes.notes).toBe("Final year project. Guide: Dr. Sharma.");
  });
});
