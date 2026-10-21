import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Moon, Palette, RotateCcw, Sun, X } from "lucide-react";
import { ACCENTS, useTheme } from "@/lib/theme";

export function ThemePanel() {
  const [open, setOpen] = useState(false);
  const { t, set, reset } = useTheme();
  return (
    <>
      <button aria-label="Theme settings" onClick={() => setOpen(true)} className="glass flex items-center gap-2 rounded-md px-3 py-1.5 font-mono text-xs text-muted-foreground hover:text-foreground">
        <Palette className="h-3.5 w-3.5" /> Theme
      </button>
      <AnimatePresence>
        {open && (
          <motion.div className="fixed inset-0 z-50 bg-background/50 backdrop-blur-sm" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setOpen(false)}>
            <motion.aside onClick={(e) => e.stopPropagation()} initial={{ x: 40, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: 40, opacity: 0 }}
              className="glass absolute right-4 top-4 w-[92vw] max-w-sm space-y-6 rounded-lg p-6 text-left">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-mono text-[10px] tracking-[0.3em] text-primary">ADVANCED THEME</p>
                  <h2 className="mt-1 text-lg font-semibold">Customize EduAI</h2>
                </div>
                <button aria-label="Close" onClick={() => setOpen(false)} className="text-muted-foreground hover:text-foreground"><X className="h-4 w-4" /></button>
              </div>

              <Section label="MODE">
                <div className="grid grid-cols-2 gap-2">
                  {(["dark", "light"] as const).map((m) => (
                    <button key={m} onClick={() => set({ mode: m })} className={`flex items-center justify-center gap-2 rounded-md border py-2 text-sm ${t.mode === m ? "border-primary text-foreground glow" : "text-muted-foreground"}`}>
                      {m === "dark" ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />} {m === "dark" ? "Dark" : "Light"}
                    </button>
                  ))}
                </div>
              </Section>

              <Section label="ACCENT">
                <div className="grid grid-cols-4 gap-2">
                  {ACCENTS.map((a) => (
                    <button key={a.id} title={a.label} aria-label={a.label} onClick={() => set({ accent: a.id })}
                      className={`h-10 rounded-md border-2 ${t.accent === a.id ? "border-foreground" : "border-transparent"}`} style={{ background: a.swatch }} />
                  ))}
                </div>
              </Section>

              <Range label="CORNER RADIUS" value={t.radius} min={0} max={1} step={0.05} onChange={(v) => set({ radius: v })} fmt={(v) => `${v.toFixed(2)}rem`} />
              <Range label="GLASS BLUR" value={t.glass} min={0} max={40} step={1} onChange={(v) => set({ glass: v })} fmt={(v) => `${v}px`} />
              <Range label="TEXT SIZE" value={t.fontScale} min={85} max={120} step={5} onChange={(v) => set({ fontScale: v })} fmt={(v) => `${v}%`} />

              <label className="flex items-center justify-between text-sm">
                <span className="font-mono text-[10px] tracking-[0.25em] text-muted-foreground">ANIMATIONS</span>
                <input type="checkbox" checked={t.motion} onChange={(e) => set({ motion: e.target.checked })} className="h-4 w-4 accent-[var(--primary)]" />
              </label>

              <button onClick={reset} className="flex w-full items-center justify-center gap-2 rounded-md border py-2 text-sm text-muted-foreground hover:text-foreground">
                <RotateCcw className="h-3.5 w-3.5" /> Reset to default
              </button>
            </motion.aside>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return <div><p className="mb-2 font-mono text-[10px] tracking-[0.25em] text-muted-foreground">{label}</p>{children}</div>;
}

function Range({ label, value, min, max, step, onChange, fmt }: { label: string; value: number; min: number; max: number; step: number; onChange: (v: number) => void; fmt: (v: number) => string }) {
  return (
    <label className="block">
      <span className="flex justify-between font-mono text-[10px] tracking-[0.25em] text-muted-foreground"><span>{label}</span><span>{fmt(value)}</span></span>
      <input type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(Number(e.target.value))} className="mt-2 w-full accent-[var(--primary)]" />
    </label>
  );
}
