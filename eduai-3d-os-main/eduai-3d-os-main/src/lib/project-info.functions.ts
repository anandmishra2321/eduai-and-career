import { createServerFn } from "@tanstack/react-start";
import { useSession } from "@tanstack/react-start/server";
import { createHash, timingSafeEqual } from "node:crypto";

type GateSession = { unlocked?: boolean };

function sessionConfig() {
  return {
    password: process.env["SESSION_SECRET"]!,
    name: "eduai-project-info",
    maxAge: 60 * 60 * 8,
    cookie: { httpOnly: true, secure: true, sameSite: "lax" as const, path: "/" },
  };
}

function matches(input: string, expected: string) {
  const a = createHash("sha256").update(input, "utf8").digest();
  const b = createHash("sha256").update(expected, "utf8").digest();
  return timingSafeEqual(a, b);
}

export const unlockProjectInfo = createServerFn({ method: "POST" })
  .inputValidator((d: { password: string }) => ({ password: String(d?.password ?? "").slice(0, 200) }))
  .handler(async ({ data }) => {
    const expected = process.env["PROJECT_INFO_PASSWORD"];
    if (!expected) throw new Error("Password is not configured");
    if (!matches(data.password, expected)) return { ok: false as const };
    const s = await useSession<GateSession>(sessionConfig());
    await s.update({ unlocked: true });
    return { ok: true as const };
  });

export const lockProjectInfo = createServerFn({ method: "POST" }).handler(async () => {
  const s = await useSession<GateSession>(sessionConfig());
  await s.clear();
  return { ok: true as const };
});

export const getProjectInfo = createServerFn({ method: "GET" }).handler(async () => {
  const s = await useSession<GateSession>(sessionConfig());
  if (!s.data.unlocked) return { unlocked: false as const };
  return {
    unlocked: true as const,
    info: {
      name: "EDUAI",
      fullTitle: "AI-Powered Personalized Learning, Performance & Career Intelligence Platform",
      owner: "Anand Kumar Mishra",
      status: "Frontend complete · backend pending",
      stack: ["TanStack Start (React 19)", "TypeScript", "Tailwind CSS v4", "Three.js / React Three Fiber", "GSAP + ScrollTrigger", "Motion", "Lenis smooth scroll"],
      pages: [
        { path: "/", label: "Cinematic landing with 3D AI core" },
        { path: "/login", label: "Sign in" },
        { path: "/register", label: "3-step account setup" },
        { path: "/world", label: "3D Intelligence World" },
        { path: "/module/:slug", label: "13 module pages" },
        { path: "/project-info", label: "Project Information (password protected)" },
      ],
      dataset: {
        name: "UCI Student Performance",
        files: ["student-mat.csv (Maths)", "student-por.csv (Portuguese)", "student.txt (column guide)", "student-merge.R"],
        target: "Final grade G3 (0–20), predicted from G1, G2, study time, failures, absences and background",
      },
      plannedApi: [
        "POST /api/auth/login", "POST /api/auth/register", "GET /api/academic/summary", "GET /api/study/sessions",
        "GET /api/quiz", "GET /api/skills/graph", "GET /api/career/paths", "GET /api/projects", "GET /api/resume",
        "GET /api/interview/sessions", "GET /api/jobs", "GET /api/goals", "GET /api/habits", "GET /api/lab/scenes", "POST /api/agent/chat",
      ],
    },
  };
});
