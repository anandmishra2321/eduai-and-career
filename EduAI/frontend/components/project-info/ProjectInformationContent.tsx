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
      <div className="mx-auto max-w-6xl">
        <header className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div>
            <Link href="/settings" className="text-sm font-medium" style={{ color: "var(--eduai-accent)" }}>
              ← Project settings
            </Link>
            <p className="mt-4 text-xs font-semibold uppercase tracking-[0.24em]" style={{ color: "var(--eduai-accent)" }}>
              Project dossier
            </p>
            <h1 className="mt-2 text-3xl font-semibold sm:text-4xl">{PROJECT_INFORMATION.name}</h1>
            <p className="mt-2 max-w-3xl text-sm" style={{ color: "var(--eduai-muted)" }}>{PROJECT_INFORMATION.fullName}</p>
          </div>
          <ProjectInformationActions />
        </header>

        <div className="grid gap-4 md:grid-cols-3">
          <Fact label="Project" value={PROJECT_INFORMATION.name} />
          <Fact label="Frontend status" value="Existing Next.js app" />
          <Fact label="Backend API URL" value={apiBaseConfigured ? "Environment value present; service not verified" : "Local proxy fallback; service not verified"} />
        </div>

        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          <Section title="Overview">
            <p>{PROJECT_INFORMATION.overview}</p>
          </Section>
          <Section title="Problem statement">
            <p>{PROJECT_INFORMATION.problem}</p>
          </Section>
          <Section title="Objectives">
            <List items={PROJECT_INFORMATION.objectives} />
          </Section>
          <Section title="Target users and innovations">
            <p className="font-medium">Target users</p>
            <List items={PROJECT_INFORMATION.targetUsers} />
            <p className="mt-4 font-medium">Key innovations</p>
            <List items={PROJECT_INFORMATION.innovations} />
          </Section>
          <Section title="Team, institution, and acknowledgements">
            <Facts items={[
              ["Team members and roles", "Not configured"],
              ["Institution", "Not configured"],
              ["Mentor", "Not configured"],
              ["Acknowledgements", "Not configured"],
              ["Third-party credits", "Not configured"],
            ]} />
          </Section>
          <Section title="Frontend architecture and technology stack">
            <p>Next.js App Router frontend with client-side workspace modules, a centralized API client, and a FastAPI-style `/api` integration surface.</p>
            <List items={PROJECT_INFORMATION.stack} />
            <p className="mt-3 text-xs">Backend implementation details are outside this frontend folder and are Not configured in the inspected project.</p>
          </Section>
          <Section title="AI models and datasets">
            <List items={PROJECT_INFORMATION.modelNotes} />
            <Facts items={[
              ["Dataset name, source, and license", "Not configured"],
              ["Training dates and model versions", "Not configured"],
              ["Evaluation metrics", "Not configured"],
              ["Known limitations and model report", "Not configured"],
            ]} />
          </Section>
          <Section title="API integrations and service health">
            <p>These integration areas are present in the frontend API client:</p>
            <List items={PROJECT_INFORMATION.apiRoutes.map((route) => `${route} — connection not verified`)} />
            <Facts items={[
              ["Database and schema", "Not configured in this frontend"],
              ["Deployment environment", "Not configured"],
              ["Service health", "Not verified — no health-check endpoint is defined in this frontend"],
            ]} />
          </Section>
          <Section title="Documentation and project artifacts">
            <Facts items={[
              ["Documentation and user guide", "Not configured"],
              ["Architecture diagram", "Not configured"],
              ["Model report", "Not configured"],
              ["Changelog", "Not configured"],
            ]} />
            <p className="mt-4 text-xs">
              Export includes verified frontend configuration only. No credentials, private user data, or internal secrets are included.
            </p>
          </Section>
        </div>
      </div>
    </main>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div className="eduai-surface-panel fact-card rounded-xl border p-5" style={surfaceStyle}>
      <p className="text-xs uppercase tracking-wider" style={{ color: "var(--eduai-muted)" }}>{label}</p>
      <p className="mt-2 text-sm font-medium">{value}</p>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="eduai-surface-panel rounded-2xl border p-5 sm:p-6" style={surfaceStyle}>
      <h2 className="mb-3 text-lg font-semibold">{title}</h2>
      <div className="space-y-2 text-sm leading-relaxed" style={{ color: "var(--eduai-text)" }}>{children}</div>
    </section>
  );
}

function List({ items }: { items: string[] }) {
  return (
    <ul className="list-disc space-y-1 pl-5" style={{ color: "var(--eduai-muted)" }}>
      {items.map((item) => <li key={item}>{item}</li>)}
    </ul>
  );
}

function Facts({ items }: { items: Array<[string, string]> }) {
  return (
    <dl className="mt-3 divide-y" style={{ borderColor: "var(--eduai-border)" }}>
      {items.map(([label, value]) => (
        <div key={label} className="flex flex-wrap justify-between gap-2 py-2">
          <dt style={{ color: "var(--eduai-muted)" }}>{label}</dt>
          <dd className="font-medium">{value}</dd>
        </div>
      ))}
    </dl>
  );
}
