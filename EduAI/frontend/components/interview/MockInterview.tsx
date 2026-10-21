"use client";

import { useEffect, useState } from "react";
import { Bot, Clock, MessageSquare, RotateCcw, Send, User } from "lucide-react";
import { GlassPanel } from "@/components/ui/GlassPanel";
import { Button } from "@/components/ui/Button";
import { api } from "@/lib/api";

type InterviewType = "Technical" | "HR" | "Behavioral";
type InterviewFeedback = Awaited<ReturnType<typeof api.interview.respond>>["feedback"];

interface InterviewTurn {
  question: string;
  answer: string;
  feedback: InterviewFeedback;
}

export function MockInterview() {
  const [role, setRole] = useState("");
  const [type, setType] = useState<InterviewType>("Technical");
  const [sessionId, setSessionId] = useState("");
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [turns, setTurns] = useState<InterviewTurn[]>([]);
  const [complete, setComplete] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    if (!sessionId || complete) return;
    const interval = window.setInterval(() => setElapsed((time) => time + 1), 1000);
    return () => window.clearInterval(interval);
  }, [sessionId, complete]);

  const start = async () => {
    if (role.trim().length < 2) {
      setError("Enter a role with at least two characters.");
      return;
    }
    setBusy(true);
    setError("");
    setTurns([]);
    setElapsed(0);
    setComplete(false);
    setQuestion("");
    setSessionId("");
    try {
      const result = await api.interview.start(role.trim(), type);
      if (!result.session_id || !result.first_question) throw new Error("The interview service returned an incomplete session.");
      setSessionId(result.session_id);
      setQuestion(result.first_question);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not start an interview.");
    } finally {
      setBusy(false);
    }
  };

  const submit = async () => {
    const submittedAnswer = answer.trim();
    if (!sessionId) {
      setError("Start an interview session first.");
      return;
    }
    if (submittedAnswer.length < 2) {
      setError("Enter an answer with at least two characters.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      const result = await api.interview.respond(sessionId, submittedAnswer);
      setTurns((current) => [...current, { question, answer: submittedAnswer, feedback: result.feedback }]);
      setAnswer("");
      setComplete(result.is_complete);
      setQuestion(result.next_question ?? "");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not submit your answer.");
    } finally {
      setBusy(false);
    }
  };

  const formatTime = (seconds: number) => `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(280px,0.8fr)]">
      <GlassPanel glow="cyan" className="space-y-5 p-6">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-white">Mock interview</h2>
            <p className="mt-1 text-xs text-slate-400">Questions and feedback come from the configured interview API.</p>
          </div>
          {sessionId && <span className="flex items-center gap-1 text-xs text-slate-400"><Clock className="h-3.5 w-3.5" />{formatTime(elapsed)}</span>}
        </div>

        {!sessionId ? (
          <div className="space-y-4">
            <label className="block text-sm text-slate-300">
              Role
              <input value={role} onChange={(event) => setRole(event.target.value)} minLength={2} required placeholder="e.g. Data analyst" className="mt-1 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2.5 text-white" />
            </label>
            <label className="block text-sm text-slate-300">
              Interview type
              <select value={type} onChange={(event) => setType(event.target.value as InterviewType)} className="mt-1 w-full rounded-xl border border-white/10 bg-slate-900 px-3 py-2.5 text-white">
                <option>Technical</option>
                <option>HR</option>
                <option>Behavioral</option>
              </select>
            </label>
            <Button type="button" isLoading={busy} onClick={() => void start()}>Start interview</Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-xs text-slate-400"><MessageSquare className="h-4 w-4 text-cyan-300" />{type} interview · {role}</div>
            {!complete && question && (
              <div className="rounded-2xl border border-cyan-500/20 bg-black/30 p-5">
                <div className="mb-2 flex items-center gap-2 text-xs uppercase tracking-wide text-cyan-300"><Bot className="h-4 w-4" />Interviewer</div>
                <p className="text-base leading-relaxed text-white">{question}</p>
                <label className="mt-5 block text-sm text-slate-300">
                  Your answer
                  <textarea value={answer} onChange={(event) => setAnswer(event.target.value)} rows={6} minLength={2} className="mt-1 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2.5 text-white" />
                </label>
                <Button type="button" isLoading={busy} disabled={answer.trim().length < 2} onClick={() => void submit()} rightIcon={<Send className="h-4 w-4" />}>Submit answer</Button>
              </div>
            )}
            {complete && <div role="status" className="rounded-xl border border-emerald-500/30 bg-emerald-950/20 p-4 text-sm text-emerald-200">The interview service marked this session complete.</div>}
          </div>
        )}
        {error && <p role="alert" className="text-sm text-rose-300">{error}</p>}
      </GlassPanel>

      <GlassPanel glow="cyan" className="space-y-4 p-6">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-white">Interview feedback</h3>
          {sessionId && <button type="button" onClick={() => { setSessionId(""); setQuestion(""); setAnswer(""); setTurns([]); setComplete(false); setError(""); }} className="inline-flex items-center gap-1 text-xs text-cyan-300"><RotateCcw className="h-3.5 w-3.5" />New session</button>}
        </div>
        {turns.length === 0 ? (
          <p className="text-sm text-slate-400">Feedback will appear here after the interview API processes an answer.</p>
        ) : (
          <div className="max-h-[640px] space-y-4 overflow-y-auto">
            {turns.map((turn, index) => (
              <article key={`${index}-${turn.question}`} className="space-y-3 rounded-xl border border-white/10 bg-black/20 p-4">
                <p className="text-sm text-slate-200"><span className="mr-1 inline-flex align-middle"><Bot className="h-4 w-4 text-cyan-300" /></span>{turn.question}</p>
                <p className="text-sm text-slate-400"><span className="mr-1 inline-flex align-middle"><User className="h-4 w-4" /></span>{turn.answer}</p>
                <div className="border-t border-white/10 pt-3 text-xs text-slate-300">
                  <p>Clarity: {turn.feedback.clarity} · Technical accuracy: {turn.feedback.technical_accuracy}</p>
                  <p className="mt-1">Confidence: {turn.feedback.confidence_indicator}</p>
                  {turn.feedback.notes.length > 0 && <ul className="mt-2 list-inside list-disc space-y-1">{turn.feedback.notes.map((note, noteIndex) => <li key={`${noteIndex}-${note}`}>{note}</li>)}</ul>}
                </div>
              </article>
            ))}
          </div>
        )}
      </GlassPanel>
    </div>
  );
}
