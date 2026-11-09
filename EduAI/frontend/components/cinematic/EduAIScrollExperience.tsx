"use client";

import React, { useState, useEffect, useRef } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import anime from "animejs";
import { motion } from "motion/react";
import {
  ChevronDown,
  Sparkles,
  GraduationCap,
  Network,
  Compass,
  BookOpen,
  Bot,
  Lock,
  ArrowRight,
  ShieldCheck,
  UserCheck,
  Settings2,
  Eye,
  EyeOff,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { GlassPanel } from "@/components/ui/GlassPanel";
import { CommandBar } from "@/components/ui/CommandBar";
import { VoiceState } from "@/components/ui/VoiceButton";
import { useAuth } from "@/hooks/useAuth";
import { useThemePreferences } from "@/components/providers/ThemeProvider";
import { api } from "@/lib/api";

// Dynamically import 3D Canvas with ssr: false
const EduAICanvas = dynamic(
  () => import("@/components/3d/EduAICanvas").then((mod) => mod.EduAICanvas),
  { ssr: false }
);

interface EduAIScrollExperienceProps {
  onEnterApp?: () => void;
}

export function EduAIScrollExperience({ onEnterApp }: EduAIScrollExperienceProps) {
  const [scrollProgress, setScrollProgress] = useState(0);
  const [backendStatus, setBackendStatus] = useState<"checking" | "online" | "offline">("checking");
  const [voiceState, setVoiceState] = useState<VoiceState>("IDLE");
  const [isOverdrive, setIsOverdrive] = useState(false);
  const [authMode, setAuthMode] = useState<"login" | "register">("login");
  const [authError, setAuthError] = useState<string | null>(null);
  const [isBuildingProfile, setIsBuildingProfile] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [agentReply, setAgentReply] = useState("");
  const [agentError, setAgentError] = useState("");
  const [agentBusy, setAgentBusy] = useState(false);
  const [agentConversationId, setAgentConversationId] = useState<string>();
  const [systemPrefersDark, setSystemPrefersDark] = useState(false);

  // Form states
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [course, setCourse] = useState("Computer Science & Engineering");
  const [careerGoal, setCareerGoal] = useState("AI & Machine Learning Engineer");
  const [regStep, setRegStep] = useState(1);

  const containerRef = useRef<HTMLDivElement>(null);
  const progressBarRef = useRef<HTMLDivElement>(null);
  const { login, register, startOfflineDemo, isAuthenticated, user } = useAuth();
  const { preferences } = useThemePreferences();
  const shouldRenderCanvas = !preferences.reducedMotion
    && (preferences.mode === "dark" || (preferences.mode === "system" && systemPrefersDark));

  useEffect(() => {
    const colorScheme = window.matchMedia("(prefers-color-scheme: dark)");
    const updateSystemColorScheme = () => setSystemPrefersDark(colorScheme.matches);
    updateSystemColorScheme();
    colorScheme.addEventListener("change", updateSystemColorScheme);
    return () => colorScheme.removeEventListener("change", updateSystemColorScheme);
  }, []);

  useEffect(() => {
    let cancelled = false;
    void api.health.check()
      .then(() => {
        if (!cancelled) setBackendStatus("online");
      })
      .catch(() => {
        if (!cancelled) setBackendStatus("offline");
      });
    return () => { cancelled = true; };
  }, []);

  // Scroll tracking with smooth animation frame
  useEffect(() => {
    const handleScroll = () => {
      const totalHeight = document.documentElement.scrollHeight - window.innerHeight;
      if (totalHeight <= 0) return;
      const current = window.scrollY / totalHeight;
      setScrollProgress(Math.min(1, Math.max(0, current)));
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const progressBar = progressBarRef.current;
    if (!progressBar) return;

    anime.remove(progressBar);
    if (preferences.reducedMotion) {
      progressBar.style.transform = `scaleX(${scrollProgress})`;
      return;
    }
    anime({
      targets: progressBar,
      scaleX: scrollProgress,
      duration: 180,
      easing: "easeOutQuad",
    });

    return () => anime.remove(progressBar);
  }, [preferences.reducedMotion, scrollProgress]);

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    try {
      // Trigger 3D Hyperdrive transition
      setIsOverdrive(true);

      await login(email, password);

      setTimeout(() => {
        setIsOverdrive(false);
        onEnterApp?.();
      }, 1600);
    } catch (err: unknown) {
      setIsOverdrive(false);
      setAuthError((err as Error).message || "Authentication failed. Check credentials.");
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setIsBuildingProfile(true);

    try {
      await register({
        email,
        password,
        full_name: fullName || "EduAI Scholar",
        course,
        career_goal: careerGoal,
      });

      setTimeout(() => {
        setIsBuildingProfile(false);
        setIsOverdrive(true);
        setTimeout(() => {
          setIsOverdrive(false);
          onEnterApp?.();
        }, 1600);
      }, 2000);
    } catch (err: unknown) {
      setIsBuildingProfile(false);
      setAuthError((err as Error).message || "Registration failed.");
    }
  };

  const handleOfflineDemo = () => {
    setAuthError(null);
    startOfflineDemo();
    onEnterApp?.();
  };

  const scrollToAuth = () => {
    window.scrollTo({
      top: document.documentElement.scrollHeight,
      behavior: preferences.reducedMotion ? "auto" : "smooth",
    });
  };

  return (
    <div ref={containerRef} className="relative w-full bg-[#030712] text-slate-100 min-h-[700vh]">
      {/* Fixed Fullscreen 3D Canvas */}
      {shouldRenderCanvas && (
        <EduAICanvas
          scrollProgress={scrollProgress}
          voiceState={voiceState}
          isOverdrive={isOverdrive}
        />
      )}

      <div
        className="fixed top-0 left-0 right-0 z-50 h-0.5 bg-cyan-950/80"
        aria-hidden="true"
      >
        <div
          ref={progressBarRef}
          className="h-full origin-left bg-gradient-to-r from-cyan-400 to-blue-500 shadow-[0_0_10px_rgba(0,240,255,0.8)]"
          style={{ transform: "scaleX(0)" }}
        />
      </div>

      {/* Floating HUD Header */}
      <header className="fixed top-0 left-0 w-full z-40 px-6 py-5 flex items-center justify-between pointer-events-auto backdrop-blur-md bg-[#030712]/30 border-b border-cyan-500/10">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center shadow-[0_0_15px_rgba(0,240,255,0.5)]">
            <Sparkles className="w-4 h-4 text-black" />
          </div>
          <div>
            <span className="font-mono font-bold tracking-widest text-lg text-white">EDUAI</span>
            <span className="hidden sm:inline-block ml-2 text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-cyan-950/60 border border-cyan-500/30 text-cyan-300">
              v2.0 OS
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Link href="/settings" aria-label="Project settings" className="rounded-lg border border-white/10 p-2 text-slate-300 transition hover:text-cyan-200">
            <Settings2 className="h-4 w-4" />
          </Link>
          {isAuthenticated ? (
            <Button
              size="sm"
              variant="primary"
              onClick={onEnterApp}
              rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
            >
              Resume Workspace ({user?.full_name || "Scholar"})
            </Button>
          ) : (
            <Button size="sm" variant="ghost" onClick={scrollToAuth}>
              Access Terminal
            </Button>
          )}
        </div>
      </header>

      {/* Scroll Down Indicator (visible in first section) */}
      {scrollProgress < 0.12 && (
        <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-30 flex flex-col items-center gap-2 pointer-events-none text-cyan-400/80 animate-bounce">
          <span className="text-xs font-mono uppercase tracking-widest text-slate-400">
            Scroll to Navigate
          </span>
          <ChevronDown className="w-5 h-5 text-cyan-400" />
        </div>
      )}

      {/* ========================================================
          SCENE 0: INTRO & SINGULARITY (0% - 15%)
          ======================================================== */}
      <section className="h-[100vh] flex flex-col items-center justify-center relative z-20 px-6 pointer-events-none">
        <motion.div
          className="text-center max-w-3xl pointer-events-auto"
          initial={{ opacity: 0, y: 28 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.35 }}
          transition={{ duration: 0.7, ease: "easeOut" }}
        >
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-cyan-950/50 border border-cyan-500/30 text-cyan-300 text-xs font-mono mb-6 backdrop-blur-md">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
            <span>AI-POWERED PERSONAL EDUCATION OPERATING SYSTEM</span>
          </div>
          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-4 text-white">
            EDU<span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500 cyan-text-glow">AI</span>
          </h1>
          <p className="text-lg md:text-xl text-slate-300 max-w-xl mx-auto mb-8 font-light">
            A connected workspace for learning, performance, skills, and career planning. Available data depends on configured EduAI services.
          </p>
          <div className="flex items-center justify-center gap-4">
            <Button
              size="lg"
              variant="primary"
              onClick={scrollToAuth}
              rightIcon={<ArrowRight className="w-4 h-4" />}
            >
              INITIALIZE SYSTEM
            </Button>
          </div>
        </motion.div>
      </section>

      {/* ========================================================
          SCENE 1: ACADEMIC INTELLIGENCE (15% - 30%)
          ======================================================== */}
      <section className="h-[100vh] flex items-center justify-start relative z-20 px-8 md:px-20 pointer-events-none">
        <GlassPanel
          glow="cyan"
          className="max-w-md pointer-events-auto transform -translate-y-4"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2.5 rounded-xl bg-cyan-950/60 border border-cyan-500/40 text-cyan-300">
              <GraduationCap className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xs font-mono text-cyan-400 uppercase tracking-wider">
                Module 01
              </span>
              <h2 className="text-xl font-bold text-white tracking-wide">
                YOUR PERFORMANCE. ANALYZED.
              </h2>
            </div>
          </div>
          <p className="text-sm text-slate-300 mb-5 leading-relaxed">
            Academic estimates and analytics are available through the EduAI API. Estimates use a local heuristic, not a trained prediction model.
          </p>
          <div className="grid grid-cols-3 gap-2 p-3 rounded-xl bg-black/40 border border-cyan-500/15 font-mono text-xs">
            <div>
              <div className="text-slate-400 text-[10px]">PREDICTION</div>
              <div className="text-emerald-400 font-bold text-sm">Heuristic API</div>
            </div>
            <div>
              <div className="text-slate-400 text-[10px]">ANALYTICS</div>
              <div className={`font-bold text-sm ${backendStatus === "online" ? "text-emerald-400" : backendStatus === "offline" ? "text-rose-400" : "text-cyan-300"}`}>
                {backendStatus === "online" ? "API connected" : backendStatus === "offline" ? "API unavailable" : "Checking API"}
              </div>
            </div>
            <div>
              <div className="text-slate-400 text-[10px]">PROFILE DATA</div>
              <div className="text-sky-300 font-bold text-sm">Sign in to load</div>
            </div>
          </div>
        </GlassPanel>
      </section>

      {/* ========================================================
          SCENE 2: SKILL GRAPH (30% - 48%)
          ======================================================== */}
      <section className="h-[100vh] flex items-center justify-end relative z-20 px-8 md:px-20 pointer-events-none">
        <GlassPanel
          glow="cyan"
          className="max-w-md pointer-events-auto transform translate-y-4"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2.5 rounded-xl bg-cyan-950/60 border border-cyan-500/40 text-cyan-300">
              <Network className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xs font-mono text-cyan-400 uppercase tracking-wider">
                Module 02
              </span>
              <h2 className="text-xl font-bold text-white tracking-wide">
                YOUR SKILLS. MAPPED.
              </h2>
            </div>
          </div>
          <p className="text-sm text-slate-300 mb-4 leading-relaxed">
            A skills graph API is available to supply competencies and gaps. No personal skill graph is loaded on this landing page.
          </p>
          <div className="flex flex-wrap gap-2 text-xs font-mono">
            <span className="px-2.5 py-1 rounded-md bg-emerald-950/50 border border-emerald-500/40 text-emerald-300">
              Skills graph · sign in to load
            </span>
            <span className={`px-2.5 py-1 rounded-md border font-mono ${backendStatus === "online" ? "bg-emerald-950/50 border-emerald-500/40 text-emerald-300" : backendStatus === "offline" ? "bg-rose-950/50 border-rose-500/40 text-rose-300" : "bg-cyan-950/50 border-cyan-500/40 text-cyan-300"}`}>
              {backendStatus === "online" ? "Backend · connected" : backendStatus === "offline" ? "Backend · unavailable" : "Backend · checking"}
            </span>
          </div>
        </GlassPanel>
      </section>

      {/* ========================================================
          SCENE 3: CAREER INTELLIGENCE (48% - 65%)
          ======================================================== */}
      <section className="h-[100vh] flex items-center justify-start relative z-20 px-8 md:px-20 pointer-events-none">
        <GlassPanel
          glow="gold"
          className="max-w-md pointer-events-auto"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2.5 rounded-xl bg-amber-950/50 border border-amber-500/40 text-amber-300">
              <Compass className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xs font-mono text-amber-400 uppercase tracking-wider">
                Module 03
              </span>
              <h2 className="text-xl font-bold text-white tracking-wide">
                YOUR CAREER. PLANNED.
              </h2>
            </div>
          </div>
          <p className="text-sm text-slate-300 mb-4 leading-relaxed">
            Career recommendations and roadmaps are available through the EduAI API using local matching heuristics. Live market data is not connected.
          </p>
          <div className="p-3 rounded-xl bg-black/40 border border-amber-500/20 font-mono text-xs">
            <div className="text-slate-400 text-[10px]">CAREER API</div>
            <div className="text-amber-300 font-bold text-sm mt-0.5">No recommendation loaded</div>
            <div className="text-slate-400 text-[10px] mt-1">Recommendation method: local skill matching</div>
          </div>
        </GlassPanel>
      </section>

      {/* ========================================================
          SCENE 4: STUDY STUDIO & RAG (65% - 80%)
          ======================================================== */}
      <section className="h-[100vh] flex items-center justify-end relative z-20 px-8 md:px-20 pointer-events-none">
        <GlassPanel
          glow="cyan"
          className="max-w-md pointer-events-auto"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2.5 rounded-xl bg-cyan-950/60 border border-cyan-500/40 text-cyan-300">
              <BookOpen className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xs font-mono text-cyan-400 uppercase tracking-wider">
                Module 04
              </span>
              <h2 className="text-xl font-bold text-white tracking-wide">
                YOUR LEARNING. PERSONALIZED.
              </h2>
            </div>
          </div>
          <p className="text-sm text-slate-300 mb-4 leading-relaxed">
            Upload study material and ask questions grounded in its extracted text. Document processing and storage are provided by the connected backend.
          </p>
          <div className={`flex items-center gap-2 text-xs font-mono ${backendStatus === "online" ? "text-emerald-300" : backendStatus === "offline" ? "text-rose-300" : "text-cyan-300"}`}>
            <span className={`w-2 h-2 rounded-full ${backendStatus === "online" ? "bg-emerald-400" : backendStatus === "offline" ? "bg-rose-400" : "bg-cyan-400 animate-pulse"}`} />
            <span>{backendStatus === "online" ? "Document API · connected" : backendStatus === "offline" ? "Document API · unavailable" : "Document API · checking"}</span>
          </div>
        </GlassPanel>
      </section>

      {/* ========================================================
          SCENE 5: AUTONOMOUS AI AGENT (80% - 90%)
          ======================================================== */}
      <section className="h-[100vh] flex items-center justify-center relative z-20 px-8 pointer-events-none">
        <GlassPanel
          glow="cyan"
          className="max-w-lg text-center pointer-events-auto"
        >
          <div className="inline-flex p-3 rounded-2xl bg-cyan-950/60 border border-cyan-500/40 text-cyan-300 mb-3">
            <Bot className="w-8 h-8" />
          </div>
          <div className="text-xs font-mono text-cyan-400 uppercase tracking-widest mb-1">
            Autonomous Multi-Tool Agent
          </div>
          <h2 className="text-2xl font-bold text-white mb-3">
            YOUR AI COMPANION. READY.
          </h2>
          <p className="text-sm text-slate-300 mb-6 max-w-md mx-auto leading-relaxed">
            AI chat and a tool-registry API are defined in the frontend. Live capabilities depend on the connected backend and are not assumed here.
          </p>
          <Button
            size="md"
            variant="primary"
            onClick={scrollToAuth}
            rightIcon={<ArrowRight className="w-4 h-4" />}
          >
            INITIALIZE YOUR AGENT
          </Button>
        </GlassPanel>
      </section>

      {/* ========================================================
          SCENE 6: CINEMATIC HOLOGRAPHIC AUTH PORTAL (90% - 100%)
          ======================================================== */}
      <section className="relative z-30 flex min-h-screen items-center justify-center px-6 py-24">
        <div className="grid w-full max-w-5xl overflow-hidden rounded-[2rem] border border-slate-200/80 bg-white shadow-[0_32px_100px_rgba(37,99,235,0.16)] md:grid-cols-[1.05fr_0.95fr]">
          <div
            className="eduai-auth-hero relative hidden min-h-[620px] flex-col justify-between overflow-hidden p-10 text-white lg:p-12 md:flex"
            style={{ background: "linear-gradient(145deg, #2563eb 0%, #4f46e5 52%, #0891b2 100%)" }}
          >
            <div aria-hidden="true" className="pointer-events-none absolute -right-24 -top-24 h-80 w-80 rounded-full bg-cyan-200/30 blur-3xl" />
            <div aria-hidden="true" className="pointer-events-none absolute -bottom-28 -left-20 h-80 w-80 rounded-full bg-rose-300/25 blur-3xl" />
            <div className="relative flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/30 bg-white/15 shadow-lg backdrop-blur">
                <GraduationCap className="h-6 w-6 text-white" aria-hidden="true" />
              </div>
              <div>
                <div className="text-lg font-bold tracking-tight text-white">EduAI</div>
                <div className="text-[10px] font-medium uppercase tracking-[0.18em] text-white">Learning intelligence</div>
              </div>
            </div>

            <div className="relative my-12">
              <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-3 py-1.5 text-xs font-medium text-white backdrop-blur">
                <Sparkles className="h-3.5 w-3.5 text-white" aria-hidden="true" />
                A clearer path to what is next
              </div>
              <h2 className="max-w-md text-4xl font-semibold leading-[1.12] tracking-tight text-white xl:text-5xl">
                Make your next big step feel possible.
              </h2>
              <p className="mt-5 max-w-sm text-sm leading-6 text-white">
                Bring learning, progress, and career planning into one personal workspace built around your goals.
              </p>
              <div className="mt-9 flex flex-wrap gap-2">
                {["Learn with focus", "Track your growth", "Plan your future"].map((item) => (
                  <span key={item} className="rounded-full border border-white/25 bg-white/10 px-3 py-2 text-xs font-medium text-white backdrop-blur">
                    {item}
                  </span>
                ))}
              </div>
            </div>

            <div className="relative flex items-center justify-between border-t border-white/20 pt-5 text-xs text-white">
              <span>Personalized learning, one step at a time</span>
              <ShieldCheck className="h-4 w-4 text-white" aria-hidden="true" />
            </div>
          </div>

          <GlassPanel
            glow="none"
            className="w-full max-w-none rounded-none border-0 p-7 sm:p-10"
          >
          {isBuildingProfile ? (
            <div className="py-12 text-center">
              <div className="w-16 h-16 mx-auto mb-4 border-4 border-cyan-500/30 border-t-cyan-400 rounded-full animate-spin" />
              <h3 className="text-lg font-bold text-white mb-2 font-mono">
                Building your EduAI profile...
              </h3>
              <p className="text-xs text-slate-400 font-mono">
                Initializing Academic Telemetry, Skill Graph & Career Intelligence
              </p>
            </div>
          ) : authMode === "login" ? (
            // ================= LOGIN FORM =================
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div className="text-center mb-6">
                <div className="inline-flex p-3 rounded-2xl bg-cyan-950/60 border border-cyan-500/40 text-cyan-300 mb-2">
                  <Lock className="w-6 h-6" />
                </div>
                <h3 className="text-2xl font-bold text-white tracking-wide">EDUAI</h3>
                <p className="text-xs text-slate-400 font-mono mt-1">Welcome back. Enter credentials.</p>
              </div>

              {authError && (
                <div role="alert" aria-live="assertive" className="p-3 rounded-xl bg-red-950/60 border border-red-500/40 text-red-300 text-xs font-mono">
                  {authError}
                </div>
              )}

              <div>
                <label className="block text-xs font-mono text-slate-300 mb-1.5 uppercase">
                  Institutional Email
                </label>
                <input
                  type="email"
                  required
                  autoComplete="username"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="student@university.edu"
                  className="w-full px-4 py-2.5 rounded-xl bg-black/50 border border-cyan-500/30 text-white placeholder-slate-500 text-sm focus:border-cyan-400 focus:outline-none focus:ring-1 focus:ring-cyan-400 transition-all font-mono"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-mono text-slate-300 uppercase">
                    Security Passcode
                  </label>
                  <a
                    href="#forgot"
                    onClick={(e) => {
                      e.preventDefault();
                      setAuthError("Password reset is not configured in the connected authentication API.");
                    }}
                    className="text-xs text-cyan-400 hover:underline"
                  >
                    Forgot passcode?
                  </a>
                </div>
                <div className="relative">
                  <input
                    id="eduai-login-password"
                    type={showPassword ? "text" : "password"}
                    required
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full px-4 py-2.5 pr-12 rounded-xl bg-black/50 border border-cyan-500/30 text-white placeholder-slate-500 text-sm focus:border-cyan-400 focus:outline-none focus:ring-1 focus:ring-cyan-400 transition-all font-mono"
                  />
                  <button
                    type="button"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    aria-pressed={showPassword}
                    onClick={() => setShowPassword((visible) => !visible)}
                    className="absolute inset-y-0 right-2 flex items-center rounded-lg px-2 text-slate-400 transition hover:text-cyan-500"
                  >
                    {showPassword
                      ? <EyeOff className="h-4 w-4" aria-hidden="true" />
                      : <Eye className="h-4 w-4" aria-hidden="true" />}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                size="lg"
                variant="primary"
                className="w-full mt-2"
                isLoading={isOverdrive}
                rightIcon={<ArrowRight className="w-4 h-4" />}
              >
                ENTER EDUAI
              </Button>

              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setAuthMode("register");
                    setAuthError(null);
                  }}
                  className="text-xs text-slate-400 hover:text-cyan-300 transition-colors font-mono"
                >
                  New Scholar? <span className="text-cyan-400 underline font-semibold">Initialize Account</span>
                </button>
              </div>
              <div className="border-t border-white/10 pt-4">
                <Button
                  type="button"
                  variant="ghost"
                  className="w-full"
                  onClick={handleOfflineDemo}
                >
                  Open offline demo
                </Button>
                <p className="mt-2 text-center text-[10px] leading-relaxed text-slate-400">
                  Preview only. No real account, student data, or live AI services.
                </p>
              </div>
            </form>
          ) : (
            // ================= REGISTER FORM (PROGRESSIVE) =================
            <form onSubmit={handleRegisterSubmit} className="space-y-4">
              <div className="text-center mb-4">
                <div className="inline-flex p-3 rounded-2xl bg-cyan-950/60 border border-cyan-500/40 text-cyan-300 mb-2">
                  <UserCheck className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold text-white tracking-wide">INITIALIZE PROFILE</h3>
                <p className="text-xs text-slate-400 font-mono mt-1">
                  Step {regStep} of 2 — {regStep === 1 ? "Credentials" : "Academic Intelligence"}
                </p>
              </div>

              {authError && (
                <div role="alert" aria-live="assertive" className="p-3 rounded-xl bg-red-950/60 border border-red-500/40 text-red-300 text-xs font-mono">
                  {authError}
                </div>
              )}

              {regStep === 1 ? (
                <>
                  <div>
                    <label className="block text-xs font-mono text-slate-300 mb-1 uppercase">
                      Full Name
                    </label>
                    <input
                      type="text"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Alex Chen"
                      className="w-full px-4 py-2 rounded-xl bg-black/50 border border-cyan-500/30 text-white text-sm focus:border-cyan-400 focus:outline-none font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-mono text-slate-300 mb-1 uppercase">
                      Email
                    </label>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="alex@university.edu"
                      className="w-full px-4 py-2 rounded-xl bg-black/50 border border-cyan-500/30 text-white text-sm focus:border-cyan-400 focus:outline-none font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-mono text-slate-300 mb-1 uppercase">
                      Password
                    </label>
                    <input
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••••••"
                      className="w-full px-4 py-2 rounded-xl bg-black/50 border border-cyan-500/30 text-white text-sm focus:border-cyan-400 focus:outline-none font-mono"
                    />
                  </div>
                  <Button
                    type="button"
                    variant="primary"
                    className="w-full mt-2"
                    onClick={() => setRegStep(2)}
                    rightIcon={<ArrowRight className="w-4 h-4" />}
                  >
                    CONTINUE TO ACADEMICS
                  </Button>
                </>
              ) : (
                <>
                  <div>
                    <label className="block text-xs font-mono text-slate-300 mb-1 uppercase">
                      Course / Specialization
                    </label>
                    <input
                      type="text"
                      required
                      value={course}
                      onChange={(e) => setCourse(e.target.value)}
                      placeholder="Computer Science & Engineering"
                      className="w-full px-4 py-2 rounded-xl bg-black/50 border border-cyan-500/30 text-white text-sm focus:border-cyan-400 focus:outline-none font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-mono text-slate-300 mb-1 uppercase">
                      Career Goal
                    </label>
                    <input
                      type="text"
                      required
                      value={careerGoal}
                      onChange={(e) => setCareerGoal(e.target.value)}
                      placeholder="AI / Machine Learning Engineer"
                      className="w-full px-4 py-2 rounded-xl bg-black/50 border border-cyan-500/30 text-white text-sm focus:border-cyan-400 focus:outline-none font-mono"
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="ghost"
                      className="w-1/3"
                      onClick={() => setRegStep(1)}
                    >
                      BACK
                    </Button>
                    <Button
                      type="submit"
                      variant="primary"
                      className="w-2/3"
                      rightIcon={<ShieldCheck className="w-4 h-4" />}
                    >
                      COMPLETE SETUP
                    </Button>
                  </div>
                </>
              )}

              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setAuthMode("login");
                    setRegStep(1);
                    setAuthError(null);
                  }}
                  className="text-xs text-slate-400 hover:text-cyan-300 transition-colors font-mono"
                >
                  Already have access? <span className="text-cyan-400 underline font-semibold">Login</span>
                </button>
              </div>
              <div className="border-t border-white/10 pt-4">
                <Button
                  type="button"
                  variant="ghost"
                  className="w-full"
                  onClick={handleOfflineDemo}
                >
                  Open offline demo
                </Button>
                <p className="mt-2 text-center text-[10px] leading-relaxed text-slate-400">
                  Preview only. No real account, student data, or live AI services.
                </p>
              </div>
            </form>
          )}
          </GlassPanel>
        </div>
      </section>

      {scrollProgress < 0.86 && (agentBusy || agentReply || agentError) && (
        <div
          role={agentError ? "alert" : "status"}
          aria-live="polite"
          className="fixed bottom-24 left-1/2 z-40 max-h-40 w-[min(92vw,48rem)] -translate-x-1/2 overflow-auto rounded-xl border p-4 text-sm shadow-xl"
          style={{ background: "var(--eduai-surface)", borderColor: "var(--eduai-border)", color: "var(--eduai-text)" }}
        >
          {agentBusy ? "Waiting for the AI service…" : agentError || agentReply}
        </div>
      )}

      {/* Floating AI Command Bar (accessible throughout the experience) */}
      {scrollProgress < 0.86 && (
        <CommandBar
          onVoiceStateChange={setVoiceState}
          onExecutePrompt={async (prompt) => {
            setAgentBusy(true);
            setAgentReply("");
            setAgentError("");
            try {
              const response = await api.agent.execute(prompt, undefined, agentConversationId);
              setAgentConversationId(response.conversation_id);
              setAgentReply(response.text);
            } catch (error) {
              setAgentError(error instanceof Error ? error.message : "AI assistant request failed.");
            } finally {
              setAgentBusy(false);
            }
          }}
        />
      )}
    </div>
  );
}
