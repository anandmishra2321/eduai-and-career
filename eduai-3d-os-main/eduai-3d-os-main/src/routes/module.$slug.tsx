import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { motion } from "motion/react";
import { ArrowLeft, PlugZap } from "lucide-react";
import { getModule, MODULES } from "@/lib/modules";
import { Brand } from "@/components/eduai/Brand";
import { CommandBar } from "@/components/eduai/CommandBar";

export const Route = createFileRoute("/module/$slug")({
  loader: ({ params }) => {
    const m = getModule(params.slug);
    if (!m) throw notFound();
    return { slug: m.slug };
  },
  head: ({ params }) => {
    const m = getModule(params.slug);
    const t = `${m?.name ?? "Module"} — EduAI`;
    return {
      meta: [
        { title: t },
        { name: "description", content: m?.tagline ?? "EduAI module" },
        { property: "og:title", content: t },
        { property: "og:description", content: m?.tagline ?? "EduAI module" },
        { property: "og:type", content: "website" },
        { name: "twitter:card", content: "summary" },
      ],
    };
  },
  component: ModulePage,
});

function ModulePage() {
  const { slug } = Route.useLoaderData();
  const m = getModule(slug)!;
  return (
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_top,var(--accent),transparent_60%)]">
      <header className="flex items-center justify-between px-6 py-5 md:px-10">
        <Brand />
        <CommandBar />
      </header>
      <div className="grid gap-8 px-6 pb-16 md:grid-cols-[220px_1fr] md:px-10">
        <aside className="hidden flex-col gap-1 md:flex">
          <Link to="/world" className="mb-3 flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground"><ArrowLeft className="h-3.5 w-3.5" /> Intelligence World</Link>
          {MODULES.map((x) => (
            <Link key={x.slug} to="/module/$slug" params={{ slug: x.slug }} className={`flex items-center gap-2 rounded px-2 py-1.5 text-sm ${x.slug === slug ? "bg-accent text-foreground" : "text-muted-foreground hover:text-foreground"}`}>
              <x.icon className="h-4 w-4" /> {x.name}
            </Link>
          ))}
        </aside>
        <motion.main key={slug} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <m.icon className="h-7 w-7 text-primary" />
          <h1 className="mt-4 text-4xl font-semibold md:text-5xl">{m.name}</h1>
          <p className="mt-2 text-muted-foreground">{m.tagline}</p>
          <div className="glass mt-10 flex flex-col items-center rounded-lg px-6 py-16 text-center">
            <PlugZap className="h-8 w-8 text-primary" />
            <h2 className="mt-4 text-xl font-medium">Waiting for data</h2>
            <p className="mt-2 max-w-md text-sm text-muted-foreground">{m.empty}</p>
            <code className="mt-6 rounded border bg-background/50 px-3 py-1 font-mono text-xs text-muted-foreground">GET {m.endpoint}</code>
          </div>
        </motion.main>
      </div>
    </div>
  );
}
