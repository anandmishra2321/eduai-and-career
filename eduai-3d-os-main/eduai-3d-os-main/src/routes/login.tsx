import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Eye, EyeOff, ArrowRight } from "lucide-react";
import { AuthShell, Field, useWarp } from "@/components/eduai/AuthShell";

export const Route = createFileRoute("/login")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Sign in — EduAI" },
      { name: "description", content: "Sign in to your EduAI education intelligence system." },
      { property: "og:title", content: "Sign in — EduAI" },
      { property: "og:description", content: "Enter your personal education intelligence system." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Login,
});

function Login() {
  const { state, leaving, enter } = useWarp();
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [show, setShow] = useState(false);
  const [err, setErr] = useState<{ email?: string | undefined; pw?: string | undefined }>({});

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const n: typeof err = {};
    if (!/^\S+@\S+\.\S+$/.test(email)) n.email = "Enter a valid email";
    if (pw.length < 8) n.pw = "At least 8 characters";
    setErr(n);
    // TODO: call POST /api/auth/login when the backend exists
    if (!Object.keys(n).length) enter();
  };

  return (
    <AuthShell state={state} leaving={leaving}>
      <form onSubmit={submit} className="glass space-y-5 rounded-lg p-7">
        <div>
          <p className="font-mono text-[10px] tracking-[0.35em] text-primary">AUTHENTICATE</p>
          <h2 className="mt-2 text-2xl font-semibold">WELCOME BACK</h2>
        </div>
        <Field label="EMAIL" type="email" value={email} onChange={(e) => setEmail(e.target.value)} error={err.email} autoComplete="email" />
        <Field label="PASSWORD" type={show ? "text" : "password"} value={pw} onChange={(e) => setPw(e.target.value)} error={err.pw} autoComplete="current-password"
          {...{ right: <button type="button" aria-label="Toggle password" onClick={() => setShow(!show)} className="text-muted-foreground hover:text-foreground">{show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</button> }} />
        <button disabled={leaving} className="group relative flex w-full items-center justify-center gap-2 overflow-hidden rounded-md bg-primary py-3 font-display text-sm font-semibold tracking-widest text-primary-foreground transition-transform hover:scale-[1.02] hover:glow">
          ENTER EDUAI <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
        </button>
        <div className="flex justify-between text-xs text-muted-foreground">
          <button type="button" className="hover:text-foreground">Forgot password?</button>
          <Link to="/register" className="hover:text-primary">Create account</Link>
        </div>
      </form>
    </AuthShell>
  );
}
