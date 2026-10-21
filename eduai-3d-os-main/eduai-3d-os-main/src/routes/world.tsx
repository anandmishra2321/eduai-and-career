import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { motion } from "motion/react";
import { WorldScene } from "@/components/eduai/WorldScene";
import { Brand } from "@/components/eduai/Brand";
import { CommandBar } from "@/components/eduai/CommandBar";
import { MODULES } from "@/lib/modules";

export const Route = createFileRoute("/world")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Intelligence World — EduAI" },
      { name: "description", content: "Navigate every EduAI intelligence module from one 3D world." },
      { property: "og:title", content: "Intelligence World — EduAI" },
      { property: "og:description", content: "Your learning, skills and career in one navigable 3D system." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: World,
});

function World() {
  const nav = useNavigate();
  const go = (slug: string) => nav({ to: "/module/$slug", params: { slug } });
  return (
    <div className="relative h-screen overflow-hidden">
      <motion.div className="absolute inset-0" initial={{ opacity: 0, scale: 1.3 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 1.4, ease: [0.2, 0.8, 0.2, 1] }}>
        <WorldScene onSelect={go} />
      </motion.div>
      <header className="absolute inset-x-0 top-0 z-10 flex items-center justify-between px-6 py-5 md:px-10">
        <Brand />
        <CommandBar />
      </header>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.8 }} className="absolute bottom-6 left-6 z-10 max-w-xs md:left-10">
        <p className="font-mono text-[10px] tracking-[0.35em] text-primary">INTELLIGENCE WORLD</p>
        <h1 className="mt-2 text-3xl font-semibold">Choose a node.</h1>
        <p className="mt-1 text-sm text-muted-foreground">Drag to orbit · click a node · or press ⌘K</p>
      </motion.div>
      <nav aria-label="Modules" className="absolute bottom-6 right-6 z-10 hidden max-h-[60vh] flex-col gap-1 overflow-auto md:flex">
        {MODULES.map((m) => (
          <Link key={m.slug} to="/module/$slug" params={{ slug: m.slug }} className="glass flex items-center gap-2 rounded px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground">
            <m.icon className="h-3.5 w-3.5 text-primary" /> {m.name}
          </Link>
        ))}
      </nav>
    </div>
  );
}
