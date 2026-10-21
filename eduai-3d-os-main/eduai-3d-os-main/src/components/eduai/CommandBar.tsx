import { useEffect, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { AnimatePresence, motion } from "motion/react";
import { Command, Search } from "lucide-react";
import { MODULES } from "@/lib/modules";

export function CommandBar() {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const nav = useNavigate();
  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") { e.preventDefault(); setOpen((o) => !o); }
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, []);
  const list = MODULES.filter((m) => m.name.toLowerCase().includes(q.toLowerCase()));
  return (
    <>
      <button onClick={() => setOpen(true)} className="glass flex items-center gap-2 rounded-md px-3 py-1.5 font-mono text-xs text-muted-foreground hover:text-foreground">
        <Command className="h-3.5 w-3.5" /> Command <kbd className="ml-2 opacity-60">⌘K</kbd>
      </button>
      <AnimatePresence>
        {open && (
          <motion.div className="fixed inset-0 z-50 flex items-start justify-center bg-background/60 pt-[15vh] backdrop-blur-sm" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setOpen(false)}>
            <motion.div onClick={(e) => e.stopPropagation()} initial={{ y: -16, scale: 0.97 }} animate={{ y: 0, scale: 1 }} exit={{ y: -16, scale: 0.97 }} className="glass glow w-[92vw] max-w-lg rounded-lg p-2">
              <div className="flex items-center gap-2 border-b px-3 pb-2">
                <Search className="h-4 w-4 text-primary" />
                <input autoFocus value={q} onChange={(e) => setQ(e.target.value)} placeholder="Go to a module…" className="w-full bg-transparent py-2 text-sm outline-none placeholder:text-muted-foreground" />
              </div>
              <ul className="max-h-80 overflow-auto py-1">
                {list.map((m) => (
                  <li key={m.slug}>
                    <button onClick={() => { setOpen(false); nav({ to: "/module/$slug", params: { slug: m.slug } }); }} className="flex w-full items-center gap-3 rounded px-3 py-2 text-left text-sm hover:bg-accent">
                      <m.icon className="h-4 w-4 text-primary" /> {m.name}
                    </button>
                  </li>
                ))}
              </ul>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
