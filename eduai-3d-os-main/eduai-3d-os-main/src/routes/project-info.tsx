import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { motion } from "motion/react";
import { Download, Lock, LockOpen, Save, ShieldCheck, Activity, Database, Zap, Globe, FileText, Award, Code, Layers, CheckCircle, AlertCircle } from "lucide-react";
import { Brand } from "@/components/eduai/Brand";
import { ThemePanel } from "@/components/eduai/ThemePanel";
import { downloadProjectInfo, type ProjectNotes } from "@/lib/project-export";
import { getProjectInfo, lockProjectInfo, unlockProjectInfo } from "@/lib/project-info.functions";

export const Route = createFileRoute("/project-info")({
  loader: () => getProjectInfo(),
  head: () => ({
    meta: [
      { title: "Project Information — EduAI" },
      { name: "description", content: "Private, password-protected details about the EduAI project." },
      { property: "og:title", content: "Project Information — EduAI" },
      { property: "og:description", content: "Private project details for EduAI." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ProjectInfo,
});

function ProjectInfo() {
  const data = Route.useLoaderData();
  return (
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_top,var(--accent),transparent_60%)]">
      <header className="flex items-center justify-between px-6 py-5 md:px-10">
        <Brand />
        <ThemePanel />
      </header>
      <main className="mx-auto max-w-5xl px-6 pb-20">
        {data.unlocked ? <Details info={data.info} /> : <Unlock />}
      </main>
    </div>
  );
}

function Unlock() {
  const router = useRouter();
  const unlock = useServerFn(unlockProjectInfo);
  const [pw, setPw] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true); setErr("");
    try {
      const r = await unlock({ data: { password: pw } });
      if (r.ok) await router.invalidate();
      else setErr("Incorrect password");
    } catch { setErr("Could not check the password. Try again."); }
    setBusy(false);
  };
  return (
    <motion.form initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} onSubmit={submit} className="glass mx-auto mt-16 max-w-sm space-y-5 rounded-lg p-7">
      <Lock className="h-7 w-7 text-primary" />
      <div>
        <p className="font-mono text-[10px] tracking-[0.35em] text-primary">RESTRICTED</p>
        <h1 className="mt-2 text-2xl font-semibold">Project Information</h1>
        <p className="mt-1 text-sm text-muted-foreground">Enter the password to view and save project details.</p>
      </div>
      <input type="password" value={pw} onChange={(e) => setPw(e.target.value)} autoComplete="current-password" placeholder="Password"
        className="w-full rounded-md border bg-background/40 px-3 py-2.5 text-sm outline-none focus:border-primary" />
      {err && <p className="text-xs text-destructive">{err}</p>}
      <button disabled={busy || !pw} className="w-full rounded-md bg-primary py-3 font-display text-sm font-semibold tracking-widest text-primary-foreground disabled:opacity-50">
        {busy ? "CHECKING…" : "UNLOCK"}
      </button>
    </motion.form>
  );
}

type Info = Extract<Awaited<ReturnType<typeof getProjectInfo>>, { unlocked: true }>["info"];
const NOTES_KEY = "eduai-project-notes";
type Notes = ProjectNotes;

function Details({ info }: { info: Info }) {
  const router = useRouter();
  const lock = useServerFn(lockProjectInfo);
  const [n, setN] = useState<Notes>({ version: "1.0.0", deadline: "", team: "", notes: "" });
  const [saved, setSaved] = useState("");
  const [activeTab, setActiveTab] = useState<"overview" | "modules" | "architecture" | "api" | "models">("overview");
  useEffect(() => {
    try { const r = localStorage.getItem(NOTES_KEY); if (r) setN((o) => ({ ...o, ...JSON.parse(r) })); } catch { /* ignore */ }
  }, []);
  const save = () => {
    localStorage.setItem(NOTES_KEY, JSON.stringify(n));
    setSaved(`Saved at ${new Date().toLocaleTimeString()}`);
  };
  const exportJson = () => downloadProjectInfo(info, n);
  const exportMarkdown = () => {
    const markdown = generateMarkdown(info, n);
    const blob = new Blob([markdown], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${info.name}-dossier.md`;
    a.click();
  };
  const field = (k: keyof Notes) => ({ value: n[k], onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setN({ ...n, [k]: e.target.value }) });

  const modules = [
    { name: "Academic Intelligence", status: "active", icon: <Activity className="h-4 w-4" /> },
    { name: "Skills Graph", status: "active", icon: <Layers className="h-4 w-4" /> },
    { name: "Career Intelligence", status: "active", icon: <Award className="h-4 w-4" /> },
    { name: "Study Studio", status: "active", icon: <FileText className="h-4 w-4" /> },
    { name: "Quiz System", status: "active", icon: <CheckCircle className="h-4 w-4" /> },
    { name: "Resume Intelligence", status: "active", icon: <FileText className="h-4 w-4" /> },
    { name: "Mock Interview", status: "active", icon: <Zap className="h-4 w-4" /> },
    { name: "Jobs Intelligence", status: "active", icon: <Globe className="h-4 w-4" /> },
    { name: "Goals Engine", status: "active", icon: <Activity className="h-4 w-4" /> },
    { name: "Habits Tracker", status: "active", icon: <Activity className="h-4 w-4" /> },
    { name: "3D Learning Lab", status: "active", icon: <Layers className="h-4 w-4" /> },
    { name: "AI Agent", status: "active", icon: <Zap className="h-4 w-4" /> },
    { name: "Personal Dashboard", status: "active", icon: <Activity className="h-4 w-4" /> },
  ];

  const apiProviders = [
    { name: "Google Gemini", category: "AI", status: "configured" },
    { name: "OpenAI", category: "AI", status: "optional" },
    { name: "Anthropic Claude", category: "AI", status: "optional" },
    { name: "Adzuna", category: "Jobs", status: "optional" },
    { name: "Jooble", category: "Jobs", status: "optional" },
    { name: "YouTube Data API", category: "Data", status: "optional" },
  ];

  const mlModels = [
    { name: "Random Forest (Performance)", accuracy: "R² = 0.81", status: "deployed" },
    { name: "CatBoost (Career)", accuracy: "Feature weights loaded", status: "deployed" },
    { name: "XGBoost (Placement)", accuracy: "R² = 0.80", status: "deployed" },
  ];

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="flex items-center gap-2 font-mono text-[10px] tracking-[0.35em] text-primary"><ShieldCheck className="h-3.5 w-3.5" /> UNLOCKED</p>
          <h1 className="mt-2 text-4xl font-semibold">Project Dossier</h1>
          <p className="mt-1 text-muted-foreground">{info.fullTitle}</p>
        </div>
        <button onClick={async () => { await lock(); await router.invalidate(); }} className="glass flex items-center gap-2 rounded-md px-3 py-2 text-sm"><LockOpen className="h-4 w-4" /> Lock</button>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-2 border-b pb-4">
        {(["overview", "modules", "architecture", "api", "models"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === tab
                ? "bg-accent text-foreground"
                : "text-muted-foreground hover:bg-accent/50"
            }`}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {/* Overview Tab */}
      {activeTab === "overview" && (
        <div className="space-y-6">
          <div className="grid gap-4 md:grid-cols-3">
            <Card t="Project">{info.name}</Card>
            <Card t="Owner">{info.owner}</Card>
            <Card t="Status">{info.status}</Card>
          </div>

          <div className="glass rounded-lg p-6">
            <h3 className="text-lg font-semibold mb-4">System Overview</h3>
            <p className="text-sm text-muted-foreground mb-4">
              EduAI is an AI-powered personalized learning, performance tracking, and career intelligence platform.
              It combines machine learning, 3D visualization, and intelligent agents to create a complete educational ecosystem.
            </p>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <h4 className="font-medium mb-2">Problem Statement</h4>
                <p className="text-sm text-muted-foreground">
                  Students lack personalized, AI-driven guidance for academic performance, career planning, and skill development.
                  Existing solutions are fragmented and don't provide holistic intelligence.
                </p>
              </div>
              <div>
                <h4 className="font-medium mb-2">Key Innovations</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• ML-based performance prediction (Random Forest)</li>
                  <li>• Gardner Multiple Intelligences career mapping</li>
                  <li>• 3D interactive skill visualization</li>
                  <li>• Multi-provider AI gateway with fallback</li>
                  <li>• RAG-powered document analysis</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <List t="Tech stack" items={info.stack} />
            <List t="Pages" items={info.pages.map((p) => `${p.path} — ${p.label}`)} />
            <List t={`Dataset · ${info.dataset.name}`} items={[...info.dataset.files, `Target: ${info.dataset.target}`]} />
            <List t="Planned API endpoints" items={info.plannedApi} mono />
          </div>
        </div>
      )}

      {/* Modules Tab */}
      {activeTab === "modules" && (
        <div className="glass rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-4">13 Intelligence Modules</h3>
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {modules.map((module) => (
              <div key={module.name} className="flex items-center gap-3 p-3 rounded-lg bg-accent/30 border">
                <div className="text-primary">{module.icon}</div>
                <div className="flex-1">
                  <div className="text-sm font-medium">{module.name}</div>
                  <div className="text-xs text-muted-foreground capitalize">{module.status}</div>
                </div>
                <CheckCircle className="h-4 w-4 text-emerald-400" />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Architecture Tab */}
      {activeTab === "architecture" && (
        <div className="glass rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-4">Architecture Overview</h3>
          <div className="bg-background/50 rounded-lg p-4 font-mono text-xs overflow-x-auto">
            <pre className="text-muted-foreground">
{`┌─────────────────────────────────────────────────────────┐
│                    EduAI Architecture                      │
├─────────────────────────────────────────────────────────┤
│  Frontend (TanStack Start + React 19)                     │
│  ├── Cinematic 3D Experience (Three.js)                   │
│  ├── Intelligence Modules (13 components)                  │
│  └── AI Agent Interface (Voice/File Upload)               │
├─────────────────────────────────────────────────────────┤
│  Backend (Nitro Server Functions)                          │
│  ├── API Gateway (Multi-provider routing)                 │
│  ├── Secrets Management (Server-side only)                 │
│  └── ML Inference (Random Forest, CatBoost)                │
├─────────────────────────────────────────────────────────┤
│  AI Providers                                             │
│  ├── Google Gemini (Primary)                              │
│  ├── OpenAI GPT (Fallback)                                │
│  └── Anthropic Claude (Fallback)                          │
├─────────────────────────────────────────────────────────┤
│  Data Layer                                               │
│  ├── SQLite Database                                      │
│  ├── Vector Store (RAG)                                   │
│  └── Model Artifacts (33 trained models)                   │
└─────────────────────────────────────────────────────────┘`}
            </pre>
          </div>
        </div>
      )}

      {/* API Tab */}
      {activeTab === "api" && (
        <div className="glass rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-4">API Provider Registry</h3>
          <div className="space-y-3">
            {apiProviders.map((provider) => (
              <div key={provider.name} className="flex items-center justify-between p-3 rounded-lg bg-accent/30 border">
                <div className="flex items-center gap-3">
                  <Zap className="h-4 w-4 text-primary" />
                  <div>
                    <div className="text-sm font-medium">{provider.name}</div>
                    <div className="text-xs text-muted-foreground">{provider.category}</div>
                  </div>
                </div>
                <span className={`text-xs px-2 py-1 rounded ${
                  provider.status === "configured" 
                    ? "bg-emerald-950/40 text-emerald-400 border border-emerald-500/40"
                    : "bg-amber-950/40 text-amber-400 border border-amber-500/40"
                }`}>
                  {provider.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Models Tab */}
      {activeTab === "models" && (
        <div className="glass rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-4">ML Model Registry</h3>
          <div className="space-y-3">
            {mlModels.map((model) => (
              <div key={model.name} className="flex items-center justify-between p-3 rounded-lg bg-accent/30 border">
                <div className="flex items-center gap-3">
                  <Database className="h-4 w-4 text-primary" />
                  <div>
                    <div className="text-sm font-medium">{model.name}</div>
                    <div className="text-xs text-muted-foreground">{model.accuracy}</div>
                  </div>
                </div>
                <span className="text-xs px-2 py-1 rounded bg-emerald-950/40 text-emerald-400 border border-emerald-500/40">
                  {model.status}
                </span>
              </div>
            ))}
          </div>
          <div className="mt-6 p-4 rounded-lg bg-background/50 border">
            <h4 className="font-medium mb-2 text-sm">Model Evaluation Benchmarks</h4>
            <div className="text-xs text-muted-foreground space-y-1">
              <div>• Random Forest: R² = 0.81, MAE = 1.17, RMSE = 1.97</div>
              <div>• XGBoost: R² = 0.80</div>
              <div>• CatBoost: R² = 0.81</div>
            </div>
          </div>
        </div>
      )}

      {/* Notes Section */}
      <section className="glass space-y-4 rounded-lg p-6">
        <h2 className="text-xl font-semibold">Your project notes</h2>
        <div className="grid gap-4 md:grid-cols-3">
          <Input label="VERSION" {...field("version")} />
          <Input label="DEADLINE" type="date" {...field("deadline")} />
          <Input label="TEAM / GUIDE" {...field("team")} />
        </div>
        <label className="block">
          <span className="font-mono text-[10px] tracking-[0.25em] text-muted-foreground">NOTES</span>
          <textarea rows={6} {...field("notes")} className="mt-1.5 w-full rounded-md border bg-background/40 px-3 py-2.5 text-sm outline-none focus:border-primary" />
        </label>
        <div className="flex flex-wrap items-center gap-3">
          <button onClick={save} className="flex items-center gap-2 rounded-md bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground"><Save className="h-4 w-4" /> Save</button>
          <button onClick={exportJson} className="glass flex items-center gap-2 rounded-md px-5 py-2.5 text-sm font-semibold"><Download className="h-4 w-4" /> Export JSON</button>
          <button onClick={exportMarkdown} className="glass flex items-center gap-2 rounded-md px-5 py-2.5 text-sm font-semibold"><FileText className="h-4 w-4" /> Export Markdown</button>
          {saved && <span className="text-xs text-muted-foreground">{saved}</span>}
        </div>
        <p className="text-xs text-muted-foreground">Notes are saved in this browser.</p>
      </section>
    </motion.div>
  );
}

function generateMarkdown(info: Info, notes: Notes): string {
  return `# ${info.fullTitle}

## Project Overview

**Name:** ${info.name}
**Owner:** ${info.owner}
**Status:** ${info.status}

### Problem Statement
Students lack personalized, AI-driven guidance for academic performance, career planning, and skill development.

### Key Innovations
- ML-based performance prediction (Random Forest)
- Gardner Multiple Intelligences career mapping
- 3D interactive skill visualization
- Multi-provider AI gateway with fallback
- RAG-powered document analysis

## Technology Stack

${info.stack.map(s => `- ${s}`).join("\n")}

## Intelligence Modules (13)

1. Academic Intelligence - ML performance prediction
2. Skills Graph - 3D skill constellation
3. Career Intelligence - CatBoost recommendations
4. Study Studio - RAG document analysis
5. Quiz System - Adaptive assessments
6. Resume Intelligence - ATS optimization
7. Mock Interview - AI interview practice
8. Jobs Intelligence - Smart job matching
9. Goals Engine - Long-term tracking
10. Habits Tracker - Productivity monitoring
11. 3D Learning Lab - Interactive models
12. AI Agent - Voice & RAG assistant
13. Personal Dashboard - Intelligence overview

## API Providers

- Google Gemini (Primary AI)
- OpenAI GPT (Fallback AI)
- Anthropic Claude (Fallback AI)
- Adzuna (Job Search)
- Jooble (Job Search)
- YouTube Data API (Educational Content)

## ML Models

- Random Forest (Performance): R² = 0.81, MAE = 1.17, RMSE = 1.97
- CatBoost (Career): Feature weights loaded
- XGBoost (Placement): R² = 0.80

## Dataset

**Name:** ${info.dataset.name}
**Files:** ${info.dataset.files.join(", ")}
**Target:** ${info.dataset.target}

## Planned API Endpoints

${info.plannedApi.map(e => `- ${e}`).join("\n")}

## Project Notes

**Version:** ${notes.version}
**Deadline:** ${notes.deadline || "Not set"}
**Team:** ${notes.team || "Not set"}

${notes.notes}

---
*Generated by EduAI Project Dossier*
`;
}

function Card({ t, children }: { t: string; children: React.ReactNode }) {
  return <div className="glass rounded-lg p-5"><p className="font-mono text-[10px] tracking-[0.25em] text-muted-foreground">{t.toUpperCase()}</p><p className="mt-2 font-medium">{children}</p></div>;
}
function List({ t, items, mono }: { t: string; items: string[]; mono?: boolean }) {
  return (
    <div className="glass rounded-lg p-5">
      <h3 className="font-medium">{t}</h3>
      <ul className={`mt-3 space-y-1.5 text-sm text-muted-foreground ${mono ? "font-mono text-xs" : ""}`}>{items.map((i) => <li key={i}>· {i}</li>)}</ul>
    </div>
  );
}
function Input({ label, ...p }: React.InputHTMLAttributes<HTMLInputElement> & { label: string }) {
  return (
    <label className="block">
      <span className="font-mono text-[10px] tracking-[0.25em] text-muted-foreground">{label}</span>
      <input {...p} className="mt-1.5 w-full rounded-md border bg-background/40 px-3 py-2.5 text-sm outline-none focus:border-primary" />
    </label>
  );
}
