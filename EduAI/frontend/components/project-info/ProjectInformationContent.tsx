import type { ReactNode } from "react";
import Link from "next/link";
import ProjectInformationActions from "@/components/project-info/ProjectInformationActions";
import { PROJECT_INFORMATION } from "@/lib/project-information";

const surfaceStyle = {
  background: "var(--eduai-panel-background)",
  borderColor: "var(--eduai-panel-border)",
};

export default function ProjectInformationContent() {
  const apiBaseConfigured = Boolean(process.env.NEXT_PUBLIC_API_URL);

  return (
    <main className="project-information min-h-screen px-4 py-7 sm:px-8">
      <div className="mx-auto max-w-7xl">
        <header className="mb-8 rounded-3xl border p-6 sm:p-9" style={surfaceStyle}>
          <div className="flex flex-wrap items-start justify-between gap-6">
            <div className="max-w-3xl">
              <Link href="/settings" className="text-sm font-medium" style={{ color: "var(--eduai-accent)" }}>
                ← Project settings
              </Link>
              <p className="mt-6 text-xs font-semibold uppercase tracking-[0.24em]" style={{ color: "var(--eduai-accent)" }}>
                EduAI · Project dossier
              </p>
              <h1 className="mt-2 text-3xl font-semibold sm:text-5xl">{PROJECT_INFORMATION.name}</h1>
              <p className="mt-3 text-base font-medium sm:text-lg" style={{ color: "var(--eduai-muted)" }}>
                {PROJECT_INFORMATION.fullName}
              </p>
              <p className="mt-5 max-w-3xl text-sm leading-7">{PROJECT_INFORMATION.overview}</p>
              <div className="mt-5 flex flex-wrap gap-2">
                <Badge>Next.js + React</Badge>
                <Badge>FastAPI + Python</Badge>
                <Badge>SQLite · schema v6</Badge>
                <Badge>Local models + configurable AI</Badge>
              </div>
            </div>
            <ProjectInformationActions />
          </div>
        </header>

        <section aria-label="Project architecture at a glance" className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Fact label="Frontend" value="Next.js App Router · React 19" />
          <Fact label="Backend" value="Python · FastAPI" />
          <Fact label="Persistence" value="SQLite · versioned migrations" />
          <Fact
            label="API configuration"
            value={apiBaseConfigured ? "NEXT_PUBLIC_API_URL is set" : "Frontend proxy fallback"}
            detail="Configuration presence only; service health is not checked here."
          />
        </section>

        <Section title="What EduAI includes" description="Implemented student workflows, including how each one is powered and where its boundaries are.">
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {PROJECT_INFORMATION.features.map((feature, index) => (
              <article key={feature.name} className="rounded-2xl border p-5" style={{ borderColor: "var(--eduai-border)", background: "var(--eduai-surface)" }}>
                <div className="flex items-center gap-3">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-sm font-bold" style={{ background: "var(--eduai-accent-soft)", color: "var(--eduai-accent-strong)" }}>
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <h3 className="font-semibold">{feature.name}</h3>
                </div>
                <p className="mt-4 text-sm leading-6" style={{ color: "var(--eduai-muted)" }}>{feature.summary}</p>
                <p className="mt-3 text-xs leading-5"><strong>How it works:</strong> {feature.operation}</p>
                <p className="mt-2 text-xs leading-5" style={{ color: "var(--eduai-muted)" }}><strong>Availability:</strong> {feature.availability}</p>
              </article>
            ))}
          </div>
        </Section>

        <div className="mt-5 grid gap-5 lg:grid-cols-2">
          <Section title="Architecture" description="The frontend, API, database, and model execution layers are part of this project.">
            <div className="space-y-3">
              {PROJECT_INFORMATION.architecture.map((item) => (
                <div key={item.layer} className="rounded-xl border p-4" style={{ borderColor: "var(--eduai-border)" }}>
                  <h3 className="font-medium">{item.layer}</h3>
                  <p className="mt-1 text-sm leading-6" style={{ color: "var(--eduai-muted)" }}>{item.description}</p>
                </div>
              ))}
            </div>
          </Section>

          <Section title="Technology stack" description="Key runtime and user-interface technologies declared by the project.">
            <List items={PROJECT_INFORMATION.stack} />
            <div className="mt-5 rounded-xl border p-4" style={{ borderColor: "var(--eduai-border)" }}>
              <h3 className="font-medium">Project objective</h3>
              <p className="mt-2 text-sm leading-6" style={{ color: "var(--eduai-muted)" }}>{PROJECT_INFORMATION.problem}</p>
              <List items={PROJECT_INFORMATION.objectives} />
            </div>
          </Section>
        </div>

        <Section title="Models and AI boundaries" description="Local trained models are kept distinct from cloud-provider-generated guidance.">
          <div className="grid gap-3 md:grid-cols-2">
            {PROJECT_INFORMATION.models.map((model) => (
              <article key={model.name} className="rounded-2xl border p-5" style={{ borderColor: "var(--eduai-border)" }}>
                <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--eduai-accent)" }}>{model.type}</p>
                <h3 className="mt-2 text-base font-semibold">{model.name}</h3>
                <p className="mt-2 text-sm leading-6">{model.purpose}</p>
                <p className="mt-3 text-xs leading-5" style={{ color: "var(--eduai-muted)" }}>{model.boundary}</p>
              </article>
            ))}
          </div>
          <div className="mt-4 rounded-2xl border p-5" style={{ borderColor: "var(--eduai-border)" }}>
            <h3 className="font-semibold">Configurable cloud providers</h3>
            <p className="mt-1 text-sm" style={{ color: "var(--eduai-muted)" }}>
              Provider credentials remain backend-side. An administrator can configure providers and discover available models in Project Settings.
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {PROJECT_INFORMATION.providers.map((provider) => <Badge key={provider}>{provider}</Badge>)}
            </div>
            <p className="mt-4 text-xs leading-5" style={{ color: "var(--eduai-muted)" }}>
              Personalized career and job-role recommendations require student consent. Scores are estimates, not validated predictions; generated job-role ideas are not live vacancies.
            </p>
          </div>
        </Section>

        <div className="mt-5 grid gap-5 lg:grid-cols-2">
          <Section title="Data practices" description="What the implementation does and does not send or store.">
            <List items={PROJECT_INFORMATION.dataPractices} />
          </Section>
          <Section title="Known limitations and project metadata" description="Unverified information is identified rather than guessed.">
            <List items={PROJECT_INFORMATION.limitations} />
            <div className="mt-4 rounded-xl border p-4" style={{ borderColor: "var(--eduai-border)" }}>
              <p className="text-sm font-medium">Target users</p>
              <List items={PROJECT_INFORMATION.targetUsers} />
              <p className="mt-4 text-sm font-medium">Team, institution, mentor, and acknowledgements</p>
              <p className="mt-1 text-sm" style={{ color: "var(--eduai-muted)" }}>Not identified in the project source.</p>
            </div>
          </Section>
        </div>

        <Section title="Backend API surface" description="Implemented route groups. A route listed here does not imply a deployed service is reachable.">
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {PROJECT_INFORMATION.apiGroups.map((group) => (
              <article key={group.name} className="rounded-xl border p-4" style={{ borderColor: "var(--eduai-border)" }}>
                <h3 className="font-semibold">{group.name}</h3>
                <ul className="mt-3 space-y-2">
                  {group.routes.map((route) => (
                    <li key={route} className="break-all font-mono text-xs leading-5" style={{ color: "var(--eduai-muted)" }}>{route}</li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
        </Section>

        <footer className="mt-5 rounded-2xl border p-4 text-xs leading-5" style={{ ...surfaceStyle, color: "var(--eduai-muted)" }}>
          This dossier is generated from project configuration and source documentation. It excludes credentials and private user data. Deployment status and live service health are not verified here.
        </footer>
      </div>
    </main>
  );
}

function Badge({ children }: { children: ReactNode }) {
  return (
    <span className="rounded-full border px-3 py-1 text-xs font-medium" style={{
      background: "var(--eduai-accent-soft)",
      borderColor: "var(--eduai-panel-border)",
      color: "var(--eduai-accent-strong)",
    }}>
      {children}
    </span>
  );
}

function Fact({ label, value, detail }: { label: string; value: string; detail?: string }) {
  return (
    <div className="eduai-surface-panel fact-card rounded-xl border p-5" style={surfaceStyle}>
      <p className="text-xs uppercase tracking-wider" style={{ color: "var(--eduai-muted)" }}>{label}</p>
      <p className="mt-2 text-sm font-semibold">{value}</p>
      {detail && <p className="mt-1 text-xs leading-5" style={{ color: "var(--eduai-muted)" }}>{detail}</p>}
    </div>
  );
}

function Section({ title, description, children }: { title: string; description: string; children: ReactNode }) {
  return (
    <section className="eduai-surface-panel mt-5 rounded-2xl border p-5 sm:p-6" style={surfaceStyle}>
      <h2 className="text-lg font-semibold">{title}</h2>
      <p className="mb-4 mt-1 text-sm leading-6" style={{ color: "var(--eduai-muted)" }}>{description}</p>
      {children}
    </section>
  );
}

function List({ items }: { items: string[] }) {
  return (
    <ul className="list-disc space-y-2 pl-5 text-sm leading-6" style={{ color: "var(--eduai-muted)" }}>
      {items.map((item) => <li key={item}>{item}</li>)}
    </ul>
  );
}
