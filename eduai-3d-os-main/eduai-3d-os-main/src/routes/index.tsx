import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { motion } from "motion/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lenis from "lenis";
import { ArrowRight } from "lucide-react";
import { AICoreScene, type CoreState } from "@/components/eduai/AICore";
import { Brand } from "@/components/eduai/Brand";
import { MODULES } from "@/lib/modules";

export const Route = createFileRoute("/")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "EduAI — Your Personal Education Intelligence System" },
      { name: "description", content: "EduAI is an AI-powered platform for personalised learning, performance insight and career intelligence." },
      { property: "og:title", content: "EduAI — Personal Education Intelligence" },
      { property: "og:description", content: "Learn. Understand. Create. Grow. An AI operating system for your education." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Landing,
});

const CHAPTERS = [
  { k: "01", t: "Understand how you learn", d: "Academic signals, study patterns and quiz results become one picture of your progress." },
  { k: "02", t: "Grow real skills", d: "A living skill graph, projects and a 3D lab turn knowledge into ability." },
  { k: "03", t: "Shape your career", d: "Resume, mock interviews and matched opportunities, guided by your own data." },
];

function Landing() {
  const state = useRef<CoreState>({ scroll: 0, energy: 0, warp: 0 });
  const [booted, setBooted] = useState(false);

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);
    const lenis = new Lenis();
    lenis.on("scroll", ScrollTrigger.update);
    const tick = (t: number) => lenis.raf(t * 1000);
    gsap.ticker.add(tick);
    const st = ScrollTrigger.create({ start: 0, end: "max", onUpdate: (s) => (state.current.scroll = s.progress) });
    const ctx = gsap.context(() => {
      gsap.utils.toArray<HTMLElement>(".chapter").forEach((el) =>
        gsap.from(el, { y: 80, opacity: 0, scrollTrigger: { trigger: el, start: "top 85%", end: "top 45%", scrub: true } }),
      );
    });
    const t = setTimeout(() => setBooted(true), 1400);
    return () => { clearTimeout(t); st.kill(); ctx.revert(); gsap.ticker.remove(tick); lenis.destroy(); };
  }, []);

  return (
    <div className="relative">
      <div className="fixed inset-0 -z-0"><AICoreScene state={state} /></div>
      <motion.div className="pointer-events-none fixed inset-0 z-40 bg-background" initial={{ opacity: 1 }} animate={{ opacity: 0 }} transition={{ delay: 0.6, duration: 1.4 }} />

      <header className="fixed inset-x-0 top-0 z-30 flex items-center justify-between px-6 py-5 md:px-10">
        <Brand />
        <nav className="flex items-center gap-2 text-sm">
          <Link to="/login" className="px-3 py-1.5 text-muted-foreground hover:text-foreground">Sign in</Link>
          <Link to="/register" className="glass rounded-md px-3 py-1.5 hover:glow">Create account</Link>
        </nav>
      </header>

      <main className="relative z-10">
        <section className="flex h-screen flex-col items-center justify-end pb-20 text-center">
          <motion.p initial={{ opacity: 0, letterSpacing: "1em" }} animate={booted ? { opacity: 1, letterSpacing: "0.5em" } : {}} transition={{ duration: 1.2 }} className="font-mono text-xs text-primary">SYSTEM ONLINE</motion.p>
          <motion.h1 initial={{ opacity: 0, y: 20 }} animate={booted ? { opacity: 1, y: 0 } : {}} transition={{ delay: 0.2, duration: 1 }} className="mt-4 text-6xl font-semibold md:text-8xl text-gradient">EDUAI</motion.h1>
          <motion.p initial={{ opacity: 0 }} animate={booted ? { opacity: 1 } : {}} transition={{ delay: 0.5 }} className="mt-3 text-muted-foreground">Your Personal Education Intelligence System</motion.p>
          <motion.span initial={{ opacity: 0 }} animate={booted ? { opacity: 1 } : {}} transition={{ delay: 1 }} className="mt-10 font-mono text-[10px] tracking-[0.4em] text-muted-foreground">SCROLL TO ENTER</motion.span>
        </section>

        {CHAPTERS.map((c, i) => (
          <section key={c.k} className={`flex min-h-screen items-center px-6 md:px-16 ${i % 2 ? "justify-end" : "justify-start"}`}>
            <div className="chapter glass max-w-md rounded-lg p-8">
              <span className="font-mono text-xs text-primary">{c.k} / 03</span>
              <h2 className="mt-3 text-3xl font-semibold md:text-4xl">{c.t}</h2>
              <p className="mt-3 text-muted-foreground">{c.d}</p>
            </div>
          </section>
        ))}

        <section className="min-h-screen px-6 py-24 md:px-16">
          <h2 className="chapter text-center text-4xl font-semibold md:text-5xl">Thirteen intelligences. <span className="text-gradient">One system.</span></h2>
          <div className="mx-auto mt-14 grid max-w-6xl gap-px overflow-hidden rounded-lg border sm:grid-cols-2 lg:grid-cols-4">
            {MODULES.map((m) => (
              <div key={m.slug} className="chapter bg-background/70 p-6 backdrop-blur-md">
                <m.icon className="h-5 w-5 text-primary" />
                <h3 className="mt-4 font-medium">{m.name}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{m.tagline}</p>
              </div>
            ))}
          </div>
          <div className="mt-20 flex justify-center">
            <Link to="/login" className="group flex items-center gap-3 rounded-md bg-primary px-8 py-4 font-display font-semibold tracking-widest text-primary-foreground glow transition-transform hover:scale-[1.03]">
              ENTER EDUAI <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </div>
        </section>
      </main>
    </div>
  );
}
