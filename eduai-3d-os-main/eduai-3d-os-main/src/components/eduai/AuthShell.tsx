import { useRef, useState, type ReactNode } from "react";
import { motion } from "motion/react";
import { useNavigate } from "@tanstack/react-router";
import gsap from "gsap";
import { AICoreScene, type CoreState } from "./AICore";
import { Brand } from "./Brand";

export function useWarp() {
  const state = useRef<CoreState>({ scroll: 0, energy: 0, warp: 0 });
  const [leaving, setLeaving] = useState(false);
  const nav = useNavigate();
  const enter = () => {
    setLeaving(true);
    const tl = gsap.timeline({ onComplete: () => nav({ to: "/world" }) });
    tl.to(state.current, { energy: 1, duration: 0.6, ease: "power2.in" })
      .to(state.current, { warp: 1, duration: 1.1, ease: "power3.in" }, "-=0.1");
  };
  return { state, leaving, enter };
}

export function AuthShell({ state, leaving, children }: { state: React.MutableRefObject<CoreState>; leaving: boolean; children: ReactNode }) {
  return (
    <div className="relative min-h-screen overflow-hidden">
      <div className="fixed inset-0"><AICoreScene state={state} /></div>
      <header className="relative z-10 px-6 py-5 md:px-10"><Brand /></header>
      <div className="relative z-10 grid min-h-[calc(100vh-72px)] items-center gap-10 px-6 pb-10 md:grid-cols-2 md:px-16">
        <motion.div animate={leaving ? { opacity: 0, x: -60 } : { opacity: 1, x: 0 }} initial={{ opacity: 0, x: -30 }} transition={{ duration: 0.8 }} className="hidden md:block">
          <h1 className="text-6xl font-semibold text-gradient">EDUAI</h1>
          <p className="mt-3 text-lg">Your Personal Education Intelligence</p>
          <p className="mt-2 font-mono text-xs tracking-[0.3em] text-muted-foreground">LEARN. UNDERSTAND. CREATE. GROW.</p>
        </motion.div>
        <motion.div animate={leaving ? { opacity: 0, scale: 0.85, z: -200, filter: "blur(8px)" } : { opacity: 1, scale: 1 }} initial={{ opacity: 0, y: 20 }} transition={{ duration: 0.8 }} className="md:justify-self-end w-full max-w-sm">
          {children}
        </motion.div>
      </div>
    </div>
  );
}

export function Field({ label, error, ...p }: React.InputHTMLAttributes<HTMLInputElement> & { label: string; error?: string | undefined; right?: ReactNode }) {
  const { right, ...rest } = p as typeof p & { right?: ReactNode };
  return (
    <label className="block">
      <span className="font-mono text-[10px] tracking-[0.25em] text-muted-foreground">{label}</span>
      <div className="relative mt-1.5">
        <input {...rest} className={`w-full rounded-md border bg-background/40 px-3 py-2.5 text-sm outline-none transition-all focus:border-primary focus:shadow-[var(--shadow-glow)] ${error ? "border-destructive" : ""}`} />
        {right && <div className="absolute inset-y-0 right-2 flex items-center">{right}</div>}
      </div>
      {error && <motion.span initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} className="mt-1 block text-xs text-destructive">{error}</motion.span>}
    </label>
  );
}
