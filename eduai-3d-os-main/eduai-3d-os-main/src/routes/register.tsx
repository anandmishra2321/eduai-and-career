import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { AuthShell, Field, useWarp } from "@/components/eduai/AuthShell";

export const Route = createFileRoute("/register")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Create account — EduAI" },
      { name: "description", content: "Create your EduAI account and set up your learning profile." },
      { property: "og:title", content: "Create account — EduAI" },
      { property: "og:description", content: "Set up your personal education intelligence system." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Register,
});

const STEPS = ["IDENTITY", "ACADEMICS", "AMBITION"] as const;

function Register() {
  const { state, leaving, enter } = useWarp();
  const [step, setStep] = useState(0);
  const [f, setF] = useState({ name: "", email: "", password: "", institution: "", level: "", goal: "", interests: "" });
  const [err, setErr] = useState<Partial<Record<"name" | "email" | "password" | "institution" | "goal", string>>>({});
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement>) => setF({ ...f, [k]: e.target.value });

  const validate = () => {
    const n: typeof err = {};
    if (step === 0) {
      if (!f.name.trim()) n.name = "Required";
      if (!/^\S+@\S+\.\S+$/.test(f.email)) n.email = "Enter a valid email";
      if (f.password.length < 8) n.password = "At least 8 characters";
    }
    if (step === 1 && !f.institution.trim()) n.institution = "Required";
    if (step === 2 && !f.goal.trim()) n.goal = "Tell us one goal";
    setErr(n);
    return !Object.keys(n).length;
  };
  const next = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    if (step < 2) setStep(step + 1);
    else enter(); // TODO: POST /api/auth/register
  };

  return (
    <AuthShell state={state} leaving={leaving}>
      <form onSubmit={next} className="glass space-y-5 rounded-lg p-7">
        <div className="flex gap-1.5">
          {STEPS.map((s, i) => <div key={s} className={`h-0.5 flex-1 rounded transition-colors ${i <= step ? "bg-primary" : "bg-border"}`} />)}
        </div>
        <div>
          <p className="font-mono text-[10px] tracking-[0.35em] text-primary">STEP {step + 1} / 3 · {STEPS[step]}</p>
          <h2 className="mt-2 text-2xl font-semibold">Create your system</h2>
        </div>
        <AnimatePresence mode="wait">
          <motion.div key={step} initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -24 }} className="space-y-4">
            {step === 0 && <>
              <Field label="FULL NAME" value={f.name} onChange={set("name")} error={err.name} />
              <Field label="EMAIL" type="email" value={f.email} onChange={set("email")} error={err.email} />
              <Field label="PASSWORD" type="password" value={f.password} onChange={set("password")} error={err.password} />
            </>}
            {step === 1 && <>
              <Field label="INSTITUTION" value={f.institution} onChange={set("institution")} error={err.institution} />
              <Field label="LEVEL / YEAR" placeholder="e.g. B.Tech 2nd year" value={f.level} onChange={set("level")} />
            </>}
            {step === 2 && <>
              <Field label="PRIMARY GOAL" placeholder="e.g. Become a data scientist" value={f.goal} onChange={set("goal")} error={err.goal} />
              <Field label="INTERESTS" placeholder="AI, design, finance…" value={f.interests} onChange={set("interests")} />
            </>}
          </motion.div>
        </AnimatePresence>
        <div className="flex gap-2">
          {step > 0 && <button type="button" onClick={() => setStep(step - 1)} className="glass rounded-md px-4"><ArrowLeft className="h-4 w-4" /></button>}
          <button className="flex flex-1 items-center justify-center gap-2 rounded-md bg-primary py-3 font-display text-sm font-semibold tracking-widest text-primary-foreground transition-transform hover:scale-[1.02] hover:glow">
            {step < 2 ? "CONTINUE" : "ACTIVATE EDUAI"} <ArrowRight className="h-4 w-4" />
          </button>
        </div>
        <p className="text-center text-xs text-muted-foreground">Already have an account? <Link to="/login" className="text-primary">Sign in</Link></p>
      </form>
    </AuthShell>
  );
}
