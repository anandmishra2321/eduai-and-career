"use client";

import React, { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import {
  GraduationCap,
  Network,
  Compass,
  BookOpen,
  CheckCircle,
  FileText,
  Mic,
  Calendar,
  Activity,
  Bot,
  LogOut,
  ChevronRight,
  ArrowRight,
  TrendingUp,
  Award,
  Sparkles,
  Zap,
  Settings2,
  Info,
  Bell,
  Search,
  Sun,
  Moon,
  Monitor,
  BriefcaseBusiness,
  FolderKanban,
  Target,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { GlassPanel, GlassCard } from "@/components/ui/GlassPanel";
import { CommandBar } from "@/components/ui/CommandBar";
import { VoiceState } from "@/components/ui/VoiceButton";
import { useThemePreferences } from "@/components/providers/ThemeProvider";
import { useAuth } from "@/hooks/useAuth";
import { api } from "@/lib/api";
import { AcademicPredictionResponse, CareerRecommendation, DocumentSummary, QuizQuestion, QuizResult, SkillNode } from "@/types";

const EduAICanvas = dynamic(
  () => import("@/components/3d/EduAICanvas").then((mod) => mod.EduAICanvas),
  { ssr: false }
);

const LearningLabCanvas = dynamic(
  () => import("@/components/3d/LearningLab").then((mod) => mod.LearningLabCanvas),
  { ssr: false, loading: () => <div className="h-[600px] animate-pulse rounded-2xl bg-slate-900/50" /> }
);

function safeExternalUrl(value: string): string | null {
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:" ? url.toString() : null;
  } catch {
    return null;
  }
}

type ActiveNode =
  | "overview"
  | "academic"
  | "skills"
  | "career"
  | "learning"
  | "quiz"
  | "resume"
  | "interview"
  | "habits"
  | "goals"
  | "jobs"
  | "projects"
  | "lab"
  | "agent";

export function EduAIWorld({ onLogout }: { onLogout?: () => void }) {
  const { user, profile, logout, isDemo } = useAuth();
  const { preferences, preview: previewTheme } = useThemePreferences();
  const [activeNode, setActiveNode] = useState<ActiveNode>("overview");
  const [voiceState, setVoiceState] = useState<VoiceState>("IDLE");
  const [actionError, setActionError] = useState<string | null>(null);
  const [currentDate, setCurrentDate] = useState("");
  const [overviewAnalytics, setOverviewAnalytics] = useState<Awaited<ReturnType<typeof api.performance.getAnalytics>> | null>(null);
  const [overviewStatus, setOverviewStatus] = useState({
    performance: "loading",
    skills: "loading",
    habits: "loading",
    goals: "loading",
  });

  useEffect(() => {
    setCurrentDate(
      new Intl.DateTimeFormat("en", {
        weekday: "short",
        month: "short",
        day: "numeric",
      }).format(new Date())
    );
  }, []);

  // Academic Prediction State
  const [studyHours, setStudyHours] = useState("");
  const [attendance, setAttendance] = useState("");
  const [examScore, setExamScore] = useState("");
  const [assignmentCompletion, setAssignmentCompletion] = useState("");
  const [isPredicting, setIsPredicting] = useState(false);
  const [academicResult, setAcademicResult] = useState<AcademicPredictionResponse | null>(null);

  // Career Model State
  const [careerSpecialization, setCareerSpecialization] = useState("");
  const [careerEducationLevel, setCareerEducationLevel] = useState("");
  const [careerCgpaPercentage, setCareerCgpaPercentage] = useState("");
  const [careerSkills, setCareerSkills] = useState("");
  const [careerCertifications, setCareerCertifications] = useState("");
  const [isCalculatingCareer, setIsCalculatingCareer] = useState(false);
  const [careerRecommendations, setCareerRecommendations] = useState<CareerRecommendation[]>([]);

  // Quiz State
  const [currentQuizIndex, setCurrentQuizIndex] = useState(0);
  const [quizTopic, setQuizTopic] = useState("");
  const [quizId, setQuizId] = useState("");
  const [quizQuestions, setQuizQuestions] = useState<QuizQuestion[]>([]);
  const [quizAnswers, setQuizAnswers] = useState<Record<string, number>>({});
  const [quizResult, setQuizResult] = useState<QuizResult | null>(null);
  const [isGeneratingQuiz, setIsGeneratingQuiz] = useState(false);
  const [isSubmittingQuiz, setIsSubmittingQuiz] = useState(false);
  const [resumeAnalysis, setResumeAnalysis] = useState<Awaited<ReturnType<typeof api.resume.analyze>> | null>(null);
  const [resumeBusy, setResumeBusy] = useState(false);
  const [interviewRole, setInterviewRole] = useState("");
  const [interviewType, setInterviewType] = useState<"Technical" | "HR" | "Behavioral">("Technical");
  const [interviewSessionId, setInterviewSessionId] = useState("");
  const [interviewPrompt, setInterviewPrompt] = useState("");
  const [interviewAnswer, setInterviewAnswer] = useState("");
  const [interviewFeedback, setInterviewFeedback] = useState<{
    clarity: number;
    technical_accuracy: number;
    confidence_indicator: string;
    notes: string[];
  } | null>(null);
  const [interviewComplete, setInterviewComplete] = useState(false);
  const [interviewBusy, setInterviewBusy] = useState(false);

  // Habit State
  const [habits, setHabits] = useState<
    Array<{ id: string; name: string; streak: number; done: boolean }>
  >([]);
  const [habitsLoading, setHabitsLoading] = useState(false);
  const [agentTools, setAgentTools] = useState<Array<{ name: string; description: string }>>([]);
  const [agentResponse, setAgentResponse] = useState("");
  const [agentBusy, setAgentBusy] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showNotifications, setShowNotifications] = useState(false);
  const [documents, setDocuments] = useState<DocumentSummary[]>([]);
  const [activeDocumentId, setActiveDocumentId] = useState("");
  const [documentQuestion, setDocumentQuestion] = useState("");
  const [documentAnswer, setDocumentAnswer] = useState<{ answer: string; citations: Array<{ page: number; excerpt: string }> } | null>(null);
  const [documentBusy, setDocumentBusy] = useState(false);
  const [skills, setSkills] = useState<SkillNode[]>([]);
  const [skillDrafts, setSkillDrafts] = useState<Record<string, number>>({});
  const [skillsLoading, setSkillsLoading] = useState(false);
  const [savingSkillId, setSavingSkillId] = useState("");
  const [jobQuery, setJobQuery] = useState("");
  const [jobLocation, setJobLocation] = useState("");
  const [jobs, setJobs] = useState<Awaited<ReturnType<typeof api.jobs.search>>["jobs"]>([]);
  const [jobsLoading, setJobsLoading] = useState(false);
  const [goals, setGoals] = useState<Awaited<ReturnType<typeof api.goals.list>>>([]);
  const [goalsLoading, setGoalsLoading] = useState(false);
  const [goalTitle, setGoalTitle] = useState("");
  const [goalDeadline, setGoalDeadline] = useState("");
  const [goalTasks, setGoalTasks] = useState("");
  const [goalSaving, setGoalSaving] = useState(false);

  const navigation = [
    { id: "overview", label: "Dashboard", icon: Activity },
    { id: "academic", label: "Academic intelligence", icon: GraduationCap },
    { id: "learning", label: "Study studio", icon: BookOpen },
    { id: "quiz", label: "Quiz intelligence", icon: Award },
    { id: "skills", label: "Skill intelligence", icon: Network },
    { id: "career", label: "Career roadmap", icon: Compass },
    { id: "resume", label: "Resume center", icon: FileText },
    { id: "interview", label: "Mock interview", icon: Mic },
    { id: "habits", label: "Goals & habits", icon: Calendar },
    { id: "goals", label: "Goals", icon: Target },
    { id: "jobs", label: "Jobs", icon: BriefcaseBusiness },
    { id: "projects", label: "Projects", icon: FolderKanban },
    { id: "lab", label: "3D Learning Lab", icon: Sparkles },
    { id: "agent", label: "AI assistant", icon: Bot },
  ] as const;

  const handleGlobalSearch = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const query = searchQuery.trim().toLowerCase();
    if (!query) return;
    const match = navigation.find((item) => item.label.toLowerCase().includes(query));
    if (!match) {
      setActionError(`No workspace module matches “${searchQuery.trim()}”.`);
      return;
    }
    setActionError(null);
    setActiveNode(match.id);
    setSearchQuery("");
  };

  const handlePredictAcademic = async () => {
    const values = [studyHours, attendance, examScore, assignmentCompletion].map((value) => Number(value));
    if ([studyHours, attendance, examScore, assignmentCompletion].some((value) => !value.trim())
      || values.some((value) => !Number.isFinite(value) || value < 0)
      || values[0] > 168 || values[1] > 100 || values[2] > 100 || values[3] > 100) {
      setActionError("Enter weekly study hours and percentage values (0–100) before requesting a prediction.");
      return;
    }
    setIsPredicting(true);
    setAcademicResult(null);
    setActionError(null);
    try {
      const res = await api.performance.predict({
        study_hours: values[0],
        attendance: values[1],
        exam_score: values[2],
        assignment_completion: values[3],
      });
      setAcademicResult(res);
    } catch (err: unknown) {
      setActionError(err instanceof Error ? err.message : "Performance prediction failed.");
    } finally {
      setIsPredicting(false);
    }
  };

  const handleRecommendCareer = async () => {
    const educationLevel = careerEducationLevel.trim() || profile?.education_level?.trim();
    const specialization = careerSpecialization.trim() || profile?.primary_interest?.trim();
    const cgpaPercentage = Number(careerCgpaPercentage);
    if (!educationLevel || !specialization || !careerCgpaPercentage || !Number.isFinite(cgpaPercentage) || cgpaPercentage < 0 || cgpaPercentage > 100) {
      setActionError("Enter your education level, career direction, and CGPA percentage (0–100) before requesting recommendations.");
      return;
    }
    setIsCalculatingCareer(true);
    setActionError(null);
    try {
      const res = await api.career.recommend({
        education_level: educationLevel,
        specialization,
        skills: careerSkills.split(",").map((skill) => skill.trim()).filter(Boolean),
        certifications: careerCertifications.split(",").map((item) => item.trim()).filter(Boolean),
        cgpa_percentage: cgpaPercentage,
      });
      setCareerRecommendations(res.top_recommendations ?? []);
    } catch (err: unknown) {
      setActionError(err instanceof Error ? err.message : "Career recommendation failed.");
    } finally {
      setIsCalculatingCareer(false);
    }
  };

  const handleSaveSkill = async (skill: SkillNode) => {
    const level = skillDrafts[skill.id] ?? skill.level;
    if (!Number.isInteger(level) || level < 1 || level > 5) {
      setActionError("Skill level must be between 1 and 5.");
      return;
    }
    setSavingSkillId(skill.id);
    setActionError(null);
    try {
      await api.skills.updateSkillLevel(skill.id, level);
      const graph = await api.skills.getGraph();
      setSkills(graph.skills);
      setSkillDrafts(Object.fromEntries(graph.skills.map((item) => [item.id, item.level])));
    } catch (error) {
      setActionError(error instanceof Error ? error.message : "Skill level could not be saved.");
    } finally {
      setSavingSkillId("");
    }
  };

  const handleJobSearch = async () => {
    const query = jobQuery.trim();
    if (query.length < 2) {
      setActionError("Enter at least two characters to search jobs.");
      return;
    }
    setJobsLoading(true);
    setActionError(null);
    setJobs([]);
    try {
      const result = await api.jobs.search(query, jobLocation.trim() || undefined);
      setJobs(result.jobs);
    } catch (error) {
      setActionError(error instanceof Error ? error.message : "Job search failed.");
    } finally {
      setJobsLoading(false);
    }
  };

  const handleCreateGoal = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const title = goalTitle.trim();
    if (title.length < 2 || !goalDeadline) {
      setActionError("Enter a goal title and target date.");
      return;
    }
    setGoalSaving(true);
    setActionError(null);
    try {
      await api.goals.create({
        title,
        target_date: goalDeadline,
        milestones: goalTasks.split(",").map((task) => task.trim()).filter(Boolean),
      });
      setGoals(await api.goals.list());
      setGoalTitle("");
      setGoalDeadline("");
      setGoalTasks("");
    } catch (error) {
      setActionError(error instanceof Error ? error.message : "Goal could not be created.");
    } finally {
      setGoalSaving(false);
    }
  };

  const handleGenerateQuiz = async () => {
    const topic = quizTopic.trim();
    if (topic.length < 2) {
      setActionError("Enter a quiz topic with at least two characters.");
      return;
    }
    setIsGeneratingQuiz(true);
    setActionError(null);
    setQuizResult(null);
    try {
      const result = await api.quiz.generate({ topic, difficulty: "Medium", question_count: 5 });
      if (!result.quiz_id || result.questions.length === 0) {
        throw new Error("The quiz service returned no questions.");
      }
      setQuizId(result.quiz_id);
      setQuizQuestions(result.questions);
      setQuizAnswers({});
      setCurrentQuizIndex(0);
    } catch (error) {
      setActionError(error instanceof Error ? error.message : "Quiz generation failed.");
    } finally {
      setIsGeneratingQuiz(false);
    }
  };

  const handleSubmitQuiz = async (answers: Record<string, number>) => {
    if (!quizId) {
      setActionError("Generate a quiz before submitting answers.");
      return;
    }
    setIsSubmittingQuiz(true);
    setActionError(null);
    try {
      setQuizResult(await api.quiz.submit(quizId, answers));
    } catch (error) {
      setActionError(error instanceof Error ? error.message : "Quiz submission failed.");
    } finally {
      setIsSubmittingQuiz(false);
    }
  };

  const handleResumeUpload = async (file: File | undefined) => {
    if (!file) return;
    setResumeBusy(true);
    setActionError(null);
    setResumeAnalysis(null);
    try {
      const result = await api.resume.analyze(file);
      if (!Number.isFinite(result.ats_score)) {
        throw new Error("The resume service returned an invalid analysis.");
      }
      setResumeAnalysis(result);
    } catch (error) {
      setActionError(error instanceof Error ? error.message : "Resume analysis failed.");
    } finally {
      setResumeBusy(false);
    }
  };

  const handleStartInterview = async () => {
    if (interviewRole.trim().length < 2) {
      setActionError("Enter a role for the mock interview.");
      return;
    }
    setInterviewBusy(true);
    setActionError(null);
    setInterviewFeedback(null);
    setInterviewComplete(false);
    try {
      const session = await api.interview.start(interviewRole.trim(), interviewType);
      if (!session.session_id || !session.first_question) throw new Error("The interview service returned an incomplete session.");
      setInterviewSessionId(session.session_id);
      setInterviewPrompt(session.first_question);
      setInterviewAnswer("");
    } catch (error) {
      setActionError(error instanceof Error ? error.message : "Could not start the interview.");
    } finally {
      setInterviewBusy(false);
    }
  };

  const handleInterviewResponse = async () => {
    const answer = interviewAnswer.trim();
    if (!interviewSessionId) {
      setActionError("Start an interview before submitting an answer.");
      return;
    }
    if (answer.length < 2) {
      setActionError("Enter an answer before submitting.");
      return;
    }
    setInterviewBusy(true);
    setActionError(null);
    try {
      const result = await api.interview.respond(interviewSessionId, answer);
      setInterviewFeedback(result.feedback);
      setInterviewAnswer("");
      setInterviewComplete(result.is_complete);
      if (result.next_question) setInterviewPrompt(result.next_question);
    } catch (error) {
      setActionError(error instanceof Error ? error.message : "Could not submit the interview answer.");
    } finally {
      setInterviewBusy(false);
    }
  };

  const handleDocumentUpload = async (file: File | undefined) => {
    if (!file) return;
    setDocumentBusy(true);
    setActionError(null);
    try {
      const summary = await api.learning.uploadDocument(file);
      if (!summary.id) throw new Error("The document service returned no document identifier.");
      setDocuments((current) => [summary, ...current]);
      setActiveDocumentId(summary.id);
      setDocumentAnswer(null);
    } catch (error) {
      setActionError(error instanceof Error ? error.message : "Document upload failed.");
    } finally {
      setDocumentBusy(false);
    }
  };

  const handleAskDocument = async () => {
    const question = documentQuestion.trim();
    if (!activeDocumentId) {
      setActionError("Upload or select a document before asking a question.");
      return;
    }
    if (question.length < 2) {
      setActionError("Enter a question with at least two characters.");
      return;
    }
    setDocumentBusy(true);
    setActionError(null);
    try {
      setDocumentAnswer(await api.learning.askDocument(activeDocumentId, question));
    } catch (error) {
      setActionError(error instanceof Error ? error.message : "Document question failed.");
    } finally {
      setDocumentBusy(false);
    }
  };

  const toggleHabit = async (id: string) => {
    setActionError(null);
    try {
      await api.habits.toggle(id);
      const refreshed = await api.habits.list();
      setHabits(refreshed.map((habit) => ({
        id: habit.id,
        name: habit.name,
        streak: habit.streak_days,
        done: habit.completed_today,
      })));
    } catch (error) {
      setActionError(error instanceof Error ? error.message : "Habit update failed.");
    }
  };

  const handleAgentPrompt = async (prompt: string) => {
    setAgentBusy(true);
    setAgentResponse("");
    setActionError(null);
    setActiveNode("agent");
    try {
      const result = await api.agent.execute(prompt);
      setAgentResponse(result.text);
    } catch (error) {
      setActionError(error instanceof Error ? error.message : "AI assistant request failed.");
    } finally {
      setAgentBusy(false);
    }
  };

  useEffect(() => {
    if (activeNode !== "overview") return;
    if (isDemo) {
      setOverviewAnalytics(null);
      setOverviewStatus({
        performance: "demo",
        skills: "demo",
        habits: "demo",
        goals: "demo",
      });
      setSkills([]);
      setHabits([]);
      setGoals([]);
      return;
    }

    let cancelled = false;
    setOverviewStatus({
      performance: "loading",
      skills: "loading",
      habits: "loading",
      goals: "loading",
    });

    void api.performance.getAnalytics()
      .then((result) => {
        if (cancelled) return;
        setOverviewAnalytics(result);
        setOverviewStatus((status) => ({ ...status, performance: "ready" }));
      })
      .catch(() => {
        if (!cancelled) {
          setOverviewAnalytics(null);
          setOverviewStatus((status) => ({ ...status, performance: "unavailable" }));
        }
      });

    void api.skills.getGraph()
      .then((result) => {
        if (cancelled) return;
        setSkills(result.skills);
        setSkillDrafts(Object.fromEntries(result.skills.map((skill) => [skill.id, skill.level])));
        setOverviewStatus((status) => ({ ...status, skills: "ready" }));
      })
      .catch(() => {
        if (!cancelled) {
          setSkills([]);
          setOverviewStatus((status) => ({ ...status, skills: "unavailable" }));
        }
      });

    void api.habits.list()
      .then((result) => {
        if (cancelled) return;
        setHabits(result.map((habit) => ({
          id: habit.id,
          name: habit.name,
          streak: habit.streak_days,
          done: habit.completed_today,
        })));
        setOverviewStatus((status) => ({ ...status, habits: "ready" }));
      })
      .catch(() => {
        if (!cancelled) {
          setHabits([]);
          setOverviewStatus((status) => ({ ...status, habits: "unavailable" }));
        }
      });

    void api.goals.list()
      .then((result) => {
        if (cancelled) return;
        setGoals(result);
        setOverviewStatus((status) => ({ ...status, goals: "ready" }));
      })
      .catch(() => {
        if (!cancelled) {
          setGoals([]);
          setOverviewStatus((status) => ({ ...status, goals: "unavailable" }));
        }
      });

    return () => { cancelled = true; };
  }, [activeNode, isDemo]);

  useEffect(() => {
    if (activeNode !== "habits" || isDemo) return;
    let cancelled = false;
    setHabitsLoading(true);
    void api.habits.list()
      .then((items) => {
        if (!cancelled) {
          setHabits(items.map((habit) => ({
            id: habit.id,
            name: habit.name,
            streak: habit.streak_days,
            done: habit.completed_today,
          })));
        }
      })
      .catch((error: unknown) => {
        if (!cancelled) setActionError(error instanceof Error ? error.message : "Habits could not be loaded.");
      })
      .finally(() => {
        if (!cancelled) setHabitsLoading(false);
      });
    return () => { cancelled = true; };
  }, [activeNode, isDemo]);

  useEffect(() => {
    if (activeNode !== "skills" || isDemo) return;
    let cancelled = false;
    setSkillsLoading(true);
    void api.skills.getGraph()
      .then((graph) => {
        if (!cancelled) {
          setSkills(graph.skills);
          setSkillDrafts(Object.fromEntries(graph.skills.map((skill) => [skill.id, skill.level])));
        }
      })
      .catch((error: unknown) => {
        if (!cancelled) setActionError(error instanceof Error ? error.message : "Skills could not be loaded.");
      })
      .finally(() => {
        if (!cancelled) setSkillsLoading(false);
      });
    return () => { cancelled = true; };
  }, [activeNode, isDemo]);

  useEffect(() => {
    if (activeNode !== "goals" || isDemo) return;
    let cancelled = false;
    setGoalsLoading(true);
    void api.goals.list()
      .then((items) => { if (!cancelled) setGoals(items); })
      .catch((error: unknown) => {
        if (!cancelled) setActionError(error instanceof Error ? error.message : "Goals could not be loaded.");
      })
      .finally(() => { if (!cancelled) setGoalsLoading(false); });
    return () => { cancelled = true; };
  }, [activeNode, isDemo]);

  useEffect(() => {
    if (activeNode !== "agent" || isDemo) return;
    let cancelled = false;
    void api.agent.getToolRegistry()
      .then(({ tools }) => {
        if (!cancelled) setAgentTools(tools.map(({ name, description }) => ({ name, description })));
      })
      .catch((error: unknown) => {
        if (!cancelled) setActionError(error instanceof Error ? error.message : "AI tools could not be loaded.");
      });
    return () => { cancelled = true; };
  }, [activeNode, isDemo]);

  return (
    <div className="eduai-workspace relative min-h-screen w-full overflow-x-hidden">
      {/* 3D Background Canvas */}
      {preferences.theme === "cosmic-3d" && !preferences.reducedMotion ? (
        <EduAICanvas
          scrollProgress={activeNode === "overview" ? 0.05 : 0.4}
          voiceState={voiceState}
          isOverdrive={false}
        />
      ) : (
        <div
          aria-hidden="true"
          className="pointer-events-none fixed inset-0 z-0"
          style={{ background: "radial-gradient(ellipse at 72% 0%, var(--eduai-accent-soft), transparent 42%)" }}
        />
      )}

      <aside className="eduai-shell-panel fixed bottom-0 left-0 top-16 z-40 hidden w-52 flex-col overflow-y-auto border-r px-3 py-4 backdrop-blur-2xl lg:flex">
        <div className="flex items-center gap-3 px-1">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-cyan-300/20 bg-cyan-300/[0.08] text-cyan-300">
            <Activity className="h-4 w-4" />
          </div>
          <div>
            <div className="text-sm font-semibold tracking-wide text-white">EduAI workspace</div>
            <div className="text-[9px] uppercase tracking-[0.18em] text-slate-500">personal intelligence</div>
          </div>
        </div>

        <p className="mb-2 mt-6 px-2 text-[9px] font-medium uppercase tracking-[0.2em] text-slate-600">
          Your workspace
        </p>
        <nav aria-label="Workspace navigation" className="space-y-1">
          {navigation.map((item) => {
            const Icon = item.icon;
            const isActive = activeNode === item.id;
            return (
              <button
                key={item.id}
                type="button"
                aria-current={isActive ? "page" : undefined}
                onClick={() => setActiveNode(item.id as ActiveNode)}
                className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-[11px] transition-colors ${
                  isActive
                    ? "bg-blue-600/25 text-blue-100 ring-1 ring-blue-400/25"
                    : "text-slate-400 hover:bg-white/[0.04] hover:text-slate-100"
                }`}
              >
                <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
                <span>{item.label}</span>
                {isActive && <span className="ml-auto h-1.5 w-1.5 rounded-full bg-cyan-300" />}
              </button>
            );
          })}
        </nav>
        <nav aria-label="Project navigation" className="mt-4 space-y-1 border-t border-white/[0.07] pt-4">
          <Link href="/settings" className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-left text-[11px] text-slate-400 transition-colors hover:bg-white/[0.04] hover:text-slate-100">
            <Settings2 className="h-4 w-4 shrink-0" aria-hidden="true" /> Project settings
          </Link>
          <Link href="/project-info" className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-left text-[11px] text-slate-400 transition-colors hover:bg-white/[0.04] hover:text-slate-100">
            <Info className="h-4 w-4 shrink-0" aria-hidden="true" /> Project information
          </Link>
        </nav>

        <div className="mt-5 rounded-xl border border-white/[0.08] bg-white/[0.025] p-3">
          <Sparkles className="mb-2 h-4 w-4 text-cyan-300" />
          <p className="text-xs font-medium text-slate-200">More possibility. More you.</p>
          <p className="mt-1 text-[10px] leading-relaxed text-slate-500">
            Your learning space is ready whenever you are.
          </p>
          <button
            type="button"
            onClick={() => setActiveNode("agent")}
            className="mt-3 w-full rounded-lg border border-white/10 px-3 py-2 text-[10px] text-slate-300 transition hover:border-cyan-300/30 hover:text-cyan-200"
          >
            Explore EduAI <ArrowRight className="ml-1 inline h-3 w-3" />
          </button>
        </div>

        <div className="mt-auto flex items-center gap-3 border-t border-white/[0.07] pt-4">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-cyan-300/10 text-[10px] font-semibold text-cyan-200">
            {(user?.full_name || "S").slice(0, 1).toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <div className="truncate text-[11px] font-medium text-slate-200">{user?.full_name || "Scholar"}</div>
            <div className="truncate text-[9px] text-slate-500">{profile?.career_goal || "Personal account"}</div>
          </div>
          <button
            type="button"
            aria-label="Sign out"
            onClick={() => {
              logout();
              onLogout?.();
            }}
            className="rounded-md p-2 text-slate-500 transition hover:bg-white/[0.06] hover:text-rose-300"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </aside>

      <header className="eduai-shell-panel fixed left-0 right-0 top-0 z-30 flex h-16 items-center justify-between border-b px-4 backdrop-blur-xl lg:px-6">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-sky-400 to-blue-600 text-slate-950 shadow-[0_0_24px_rgba(56,189,248,0.22)]">
            <GraduationCap className="h-5 w-5" aria-hidden="true" />
          </div>
          <div className="min-w-0">
            <div className="text-lg font-bold leading-none tracking-tight text-white">EduAI</div>
            <div className="mt-1 hidden max-w-[250px] truncate text-[9px] leading-tight text-blue-200/80 sm:block">
              AI-Powered Personalized Learning, Performance &amp; Career Intelligence
            </div>
          </div>
          <div className="ml-2 hidden items-center gap-2 text-[11px] text-slate-500 md:flex">
            <span>Workspace</span>
            <ChevronRight className="h-3 w-3" />
            <span className="text-slate-200">{navigation.find((item) => item.id === activeNode)?.label}</span>
          </div>
        </div>
        <form onSubmit={handleGlobalSearch} role="search" className="mx-3 hidden max-w-sm flex-1 items-center gap-2 rounded-lg border border-white/10 px-3 py-2 xl:flex">
          <Search className="h-4 w-4 shrink-0 text-slate-400" aria-hidden="true" />
          <label className="sr-only" htmlFor="workspace-search">Search workspace modules</label>
          <input
            id="workspace-search"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="Search workspace"
            className="min-w-0 flex-1 bg-transparent text-xs text-slate-100 outline-none placeholder:text-slate-500 focus-visible:ring-1 focus-visible:ring-cyan-300"
          />
        </form>
        <div className="flex items-center gap-3">
          <span className="hidden text-[10px] text-slate-500 sm:block" suppressHydrationWarning>
            {currentDate}
          </span>
          <button
            type="button"
            aria-label={`Color mode: ${preferences.mode}. Change color mode`}
            title={`Color mode: ${preferences.mode}`}
            onClick={() => previewTheme({
              mode: preferences.mode === "dark" ? "light" : preferences.mode === "light" ? "system" : "dark",
            })}
            className="rounded-full border border-blue-300/20 bg-blue-950/30 p-2 text-blue-200 transition hover:border-blue-200/50 hover:bg-blue-900/40"
          >
            {preferences.mode === "light"
              ? <Sun className="h-4 w-4" aria-hidden="true" />
              : preferences.mode === "dark"
                ? <Moon className="h-4 w-4" aria-hidden="true" />
                : <Monitor className="h-4 w-4" aria-hidden="true" />}
          </button>
          <div className="relative">
            <button
              type="button"
              aria-label="Notifications"
              aria-expanded={showNotifications}
              onClick={() => setShowNotifications((visible) => !visible)}
              className="rounded-lg border border-white/10 p-2 text-slate-300 transition hover:text-cyan-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300"
            >
              <Bell className="h-4 w-4" />
            </button>
            {showNotifications && (
              <div role="status" className="absolute right-0 top-12 z-50 w-64 rounded-xl border p-4 text-xs shadow-xl" style={{ background: "var(--eduai-surface)", borderColor: "var(--eduai-border)", color: "var(--eduai-text)" }}>
                Notification and reminder services are Not configured.
              </div>
            )}
          </div>
          <Link href="/settings" aria-label="Project settings" title="Project settings" className="rounded-lg border border-white/10 p-2 text-slate-300 transition hover:text-cyan-200">
            <Settings2 className="h-4 w-4" />
          </Link>
          <div className="hidden items-center gap-2 rounded-xl border border-blue-300/10 bg-blue-900/20 px-2 py-1.5 sm:flex">
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-indigo-400 to-blue-600 text-xs font-semibold text-white">
              {(user?.full_name || "S").slice(0, 1).toUpperCase()}
            </div>
            <div className="max-w-28">
              <div className="truncate text-[10px] font-medium text-slate-100">{user?.full_name || "Student"}</div>
              <div className="truncate text-[9px] text-slate-400">{user?.email || "EduAI account"}</div>
            </div>
          </div>
        </div>
      </header>

      {/* Main OS Viewport Container */}
      <main className="pointer-events-auto relative z-20 mx-auto max-w-[1600px] px-4 pb-32 pt-20 md:px-7 lg:ml-52">
        {isDemo && (
          <div
            role="status"
            className="mb-5 rounded-xl border px-4 py-3 text-sm"
            style={{
              borderColor: "color-mix(in srgb, var(--eduai-accent) 45%, var(--eduai-border))",
              background: "var(--eduai-panel-background)",
              color: "var(--eduai-text)",
            }}
          >
            <p className="font-semibold">Offline demo — no real account or live data</p>
            <p className="mt-1 text-xs opacity-80">
              This is a UI preview only. Student records, training datasets, backend APIs, and AI services are not loaded or simulated.
            </p>
          </div>
        )}
        <nav aria-label="Workspace navigation" className="mb-5 flex gap-2 overflow-x-auto pb-1 lg:hidden">
          {navigation.map((item) => {
            const Icon = item.icon;
            const isActive = activeNode === item.id;
            return (
              <button
                key={item.id}
                type="button"
                aria-current={isActive ? "page" : undefined}
                onClick={() => setActiveNode(item.id as ActiveNode)}
                className={`flex shrink-0 items-center gap-2 rounded-lg border px-3 py-2 text-[10px] ${
                  isActive
                    ? "border-cyan-300/30 bg-cyan-300/[0.08] text-cyan-100"
                    : "border-white/[0.08] bg-white/[0.02] text-slate-400"
                }`}
              >
                <Icon className="h-3.5 w-3.5" aria-hidden="true" />
                {item.label}
              </button>
            );
          })}
        </nav>
        {actionError && (
          <div
            role="alert"
            className="mb-5 rounded-xl border border-red-500/40 bg-red-950/60 px-4 py-3 text-sm text-red-200"
          >
            {actionError}
          </div>
        )}

        {/* ========================================================
            NODE 0: UNIVERSE OVERVIEW (DASHBOARD HUB)
            ======================================================== */}
        {activeNode === "overview" && (
          <div className="space-y-5">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--eduai-accent-strong)]">Your learning workspace</p>
                <h1 className="mt-1 text-2xl font-semibold tracking-tight text-white md:text-3xl">Dashboard</h1>
                <p className="mt-1 text-sm text-slate-400">
                  {isDemo
                    ? "Offline demo preview. Connect your account to load real learning signals."
                    : `Welcome back, ${user?.full_name?.split(" ")[0] || "Student"}. Here are the learning signals your connected services have returned.`}
                </p>
              </div>
              <div className="inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-xs text-slate-300" style={{ borderColor: "var(--eduai-border)", background: "var(--eduai-panel-background)" }}>
                <Calendar className="h-4 w-4 text-[var(--eduai-accent-strong)]" />
                <span suppressHydrationWarning>{currentDate || "Today"}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
              {[
                {
                  label: "Latest performance",
                  value: overviewAnalytics?.historical_predictions.at(-1)?.predicted_final_marks,
                  suffix: "%",
                  detail: overviewStatus.performance === "ready"
                    ? overviewAnalytics?.historical_predictions.at(-1)?.performance_level ?? "No saved predictions"
                    : overviewStatus.performance === "demo" ? "Offline demo · no live data"
                    : overviewStatus.performance === "loading" ? "Checking performance service…" : "Service unavailable",
                  icon: TrendingUp,
                  tone: "#1685ff",
                  status: overviewStatus.performance,
                  click: () => setActiveNode("academic"),
                },
                {
                  label: "Study hours / week",
                  value: overviewAnalytics?.avg_study_hours,
                  suffix: "h",
                  detail: overviewStatus.performance === "ready"
                    ? "Average returned by performance API"
                    : overviewStatus.performance === "demo" ? "Offline demo · no live data"
                    : overviewStatus.performance === "loading" ? "Checking performance service…" : "Service unavailable",
                  icon: BookOpen,
                  tone: "#12c7a0",
                  status: overviewStatus.performance,
                  click: () => setActiveNode("learning"),
                },
                {
                  label: "Skills mapped",
                  value: overviewStatus.skills === "ready" ? skills.length : undefined,
                  suffix: "",
                  detail: overviewStatus.skills === "ready"
                    ? skills.length ? "From your skill graph" : "No skills returned yet"
                    : overviewStatus.skills === "demo" ? "Offline demo · no live data"
                    : overviewStatus.skills === "loading" ? "Loading your skill graph…" : "Service unavailable",
                  icon: Network,
                  tone: "#9b6cff",
                  status: overviewStatus.skills,
                  click: () => setActiveNode("skills"),
                },
                {
                  label: "Active goals",
                  value: overviewStatus.goals === "ready" ? goals.length : undefined,
                  suffix: "",
                  detail: overviewStatus.goals === "ready"
                    ? "Goals returned by your account"
                    : overviewStatus.goals === "demo" ? "Offline demo · no live data"
                    : overviewStatus.goals === "loading" ? "Loading your goals…" : "Service unavailable",
                  icon: Target,
                  tone: "#f2a83b",
                  status: overviewStatus.goals,
                  click: () => setActiveNode("goals"),
                },
              ].map((metric) => {
                const Icon = metric.icon;
                const numericValue = typeof metric.value === "number" && Number.isFinite(metric.value)
                  ? metric.value
                  : null;
                return (
                  <button
                    key={metric.label}
                    type="button"
                    onClick={metric.click}
                    className="eduai-surface-panel group min-h-28 rounded-xl border p-4 text-left transition hover:-translate-y-0.5 hover:shadow-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--eduai-accent)]"
                    style={{
                      borderColor: `color-mix(in srgb, ${metric.tone} 55%, var(--eduai-border))`,
                      background: `linear-gradient(135deg, color-mix(in srgb, ${metric.tone} 12%, var(--eduai-surface)), var(--eduai-surface))`,
                    }}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span className="text-xs text-slate-300">{metric.label}</span>
                      <span className="flex h-8 w-8 items-center justify-center rounded-full" style={{ background: `color-mix(in srgb, ${metric.tone} 22%, transparent)`, color: metric.tone }}>
                        <Icon className="h-4 w-4" aria-hidden="true" />
                      </span>
                    </div>
                    <div className="mt-1 text-2xl font-semibold tabular-nums text-white">
                      {numericValue === null ? "—" : `${Number.isInteger(numericValue) ? numericValue : numericValue.toFixed(1)}${metric.suffix}`}
                    </div>
                    <div className="mt-1 truncate text-[10px] text-slate-400">{metric.detail}</div>
                  </button>
                );
              })}
            </div>

            <div className="grid gap-4 xl:grid-cols-12">
              <section className="eduai-surface-panel rounded-2xl border p-5 xl:col-span-7" aria-labelledby="performance-trend-title">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h2 id="performance-trend-title" className="text-base font-semibold text-white">Performance trend</h2>
                    <p className="mt-1 text-xs text-slate-400">{isDemo ? "No personal or training data is shown in this preview" : "Historical predictions returned by your performance service"}</p>
                  </div>
                  <span className="rounded-full border px-2.5 py-1 text-[10px] text-slate-300" style={{ borderColor: "var(--eduai-border)" }}>
                    {overviewStatus.performance === "loading" ? "Loading" : overviewStatus.performance === "ready" ? `${overviewAnalytics?.historical_predictions.length ?? 0} records` : overviewStatus.performance === "demo" ? "Offline demo" : "Unavailable"}
                  </span>
                </div>
                {overviewStatus.performance === "loading" ? (
                  <div className="mt-5 h-48 animate-pulse rounded-xl bg-white/[0.04]" role="status">Loading performance history…</div>
                ) : overviewAnalytics?.historical_predictions.length ? (
                  <div className="mt-4">
                    <svg viewBox="0 0 600 220" className="h-48 w-full overflow-visible" role="img" aria-label="Historical predicted scores chart">
                      {[0, 25, 50, 75, 100].map((tick) => {
                        const y = 190 - tick * 1.6;
                        return (
                          <g key={tick}>
                            <line x1="42" x2="590" y1={y} y2={y} stroke="var(--eduai-border)" strokeDasharray="3 5" />
                            <text x="8" y={y + 4} fill="var(--eduai-muted)" fontSize="10">{tick}</text>
                          </g>
                        );
                      })}
                      {(() => {
                        const scores = overviewAnalytics.historical_predictions
                          .map((entry) => entry.predicted_final_marks)
                          .filter((score) => Number.isFinite(score))
                          .slice(-8);
                        if (!scores.length) return null;
                        const step = scores.length === 1 ? 0 : 548 / (scores.length - 1);
                        const coords = scores.map((score, index) => ({
                          x: 42 + index * step,
                          y: 190 - Math.max(0, Math.min(100, score)) * 1.6,
                          score,
                        }));
                        const points = coords.map((point) => `${point.x},${point.y}`).join(" ");
                        return (
                          <>
                            <defs>
                              <linearGradient id="eduai-score-fill" x1="0" x2="0" y1="0" y2="1">
                                <stop offset="0%" stopColor="var(--eduai-accent)" stopOpacity="0.35" />
                                <stop offset="100%" stopColor="var(--eduai-accent)" stopOpacity="0.015" />
                              </linearGradient>
                            </defs>
                            <polygon points={`42,190 ${points} ${coords[coords.length - 1]?.x ?? 42},190`} fill="url(#eduai-score-fill)" />
                            <polyline points={points} fill="none" stroke="var(--eduai-accent)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                            {coords.map((point, index) => (
                              <g key={`${index}-${point.score}`}>
                                <circle cx={point.x} cy={point.y} r="4" fill="var(--eduai-accent)" stroke="var(--eduai-bg)" strokeWidth="2" />
                                <text x={point.x} y="211" textAnchor="middle" fill="var(--eduai-muted)" fontSize="9">Run {index + 1}</text>
                              </g>
                            ))}
                          </>
                        );
                      })()}
                    </svg>
                    <div className="mt-2 flex items-center justify-between text-xs text-slate-400">
                      <span>Trend: <span className="capitalize text-[var(--eduai-accent-strong)]">{overviewAnalytics.trend}</span></span>
                      <span>Weekly attendance: {Number.isFinite(overviewAnalytics.attendance_rate) ? `${overviewAnalytics.attendance_rate}%` : "Not returned"}</span>
                    </div>
                  </div>
                ) : (
                  <div className="mt-5 flex min-h-48 flex-col items-center justify-center rounded-xl border border-dashed px-5 text-center" style={{ borderColor: "var(--eduai-border)" }}>
                    <Activity className="mb-2 h-7 w-7 text-[var(--eduai-accent-strong)]" />
                    <p className="text-sm font-medium text-slate-200">{overviewStatus.performance === "demo" ? "Offline demo · no performance data" : overviewStatus.performance === "ready" ? "No performance history yet" : "Performance service unavailable"}</p>
                    <p className="mt-1 max-w-sm text-xs text-slate-400">{overviewStatus.performance === "demo" ? "No training or student data is loaded in this demo. Connect the backend for live results." : overviewStatus.performance === "ready" ? "Run a prediction to begin building your personal trend." : "The dashboard will show this chart when the performance API is reachable."}</p>
                  </div>
                )}
                <button type="button" onClick={() => setActiveNode("academic")} className="mt-4 inline-flex items-center gap-2 text-xs font-medium text-[var(--eduai-accent-strong)] hover:underline">
                  Open performance <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </section>

              <section className="eduai-surface-panel rounded-2xl border p-5 xl:col-span-5" aria-labelledby="quick-actions-title">
                <div className="flex items-start justify-between">
                  <div>
                    <h2 id="quick-actions-title" className="text-base font-semibold text-white">Quick actions</h2>
                    <p className="mt-1 text-xs text-slate-400">Jump into a learning tool</p>
                  </div>
                  <Sparkles className="h-4 w-4 text-[var(--eduai-accent-strong)]" />
                </div>
                <div className="mt-5 grid grid-cols-2 gap-3">
                  {[
                    { id: "academic", label: "View performance", icon: Activity, tone: "#1685ff" },
                    { id: "learning", label: "Start learning", icon: BookOpen, tone: "#12c7a0" },
                    { id: "career", label: "Explore careers", icon: BriefcaseBusiness, tone: "#9b6cff" },
                    { id: "skills", label: "Analyze skills", icon: Network, tone: "#f2a83b" },
                  ].map((action) => {
                    const Icon = action.icon;
                    return (
                      <button
                        key={action.id}
                        type="button"
                        onClick={() => setActiveNode(action.id as ActiveNode)}
                        className="group flex min-h-24 flex-col items-start justify-between rounded-xl border p-3 text-left transition hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--eduai-accent)]"
                        style={{ background: `color-mix(in srgb, ${action.tone} 13%, var(--eduai-surface))`, borderColor: `color-mix(in srgb, ${action.tone} 38%, var(--eduai-border))` }}
                      >
                        <span className="flex h-8 w-8 items-center justify-center rounded-lg" style={{ background: `color-mix(in srgb, ${action.tone} 24%, transparent)`, color: action.tone }}>
                          <Icon className="h-4 w-4" aria-hidden="true" />
                        </span>
                        <span className="flex w-full items-center justify-between gap-1 text-xs font-medium text-slate-100">
                          {action.label}
                          <ChevronRight className="h-3.5 w-3.5 shrink-0 text-slate-400 transition group-hover:translate-x-0.5" />
                        </span>
                      </button>
                    );
                  })}
                </div>
              </section>
            </div>

            <div className="grid gap-4 xl:grid-cols-12">
              <section className="eduai-surface-panel rounded-2xl border p-5 xl:col-span-7" aria-labelledby="goals-title">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h2 id="goals-title" className="text-base font-semibold text-white">Your goals</h2>
                    <p className="mt-1 text-xs text-slate-400">Progress returned by your goals service</p>
                  </div>
                  <button type="button" onClick={() => setActiveNode("goals")} className="text-xs font-medium text-[var(--eduai-accent-strong)] hover:underline">View all</button>
                </div>
                {overviewStatus.goals === "loading" ? (
                  <p role="status" className="mt-5 text-sm text-slate-400">Loading goals…</p>
                ) : goals.length ? (
                  <div className="mt-4 space-y-3">
                    {goals.slice(0, 4).map((goal) => {
                      const progress = Number.isFinite(goal.progress) ? Math.max(0, Math.min(100, goal.progress)) : null;
                      return (
                        <div key={goal.id} className="rounded-xl border p-3" style={{ borderColor: "var(--eduai-border)" }}>
                          <div className="flex items-center justify-between gap-3">
                            <span className="truncate text-xs font-medium text-slate-100">{goal.title}</span>
                            <span className="shrink-0 text-[10px] text-slate-400">{progress === null ? "Progress unavailable" : `${progress}%`}</span>
                          </div>
                          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-800">
                            <div className="h-full rounded-full bg-[var(--eduai-accent)] transition-all" style={{ width: `${progress ?? 0}%` }} />
                          </div>
                          <p className="mt-1 text-[10px] text-slate-500">Target date: {goal.deadline || "Not provided"}</p>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="mt-5 rounded-xl border border-dashed p-5 text-center" style={{ borderColor: "var(--eduai-border)" }}>
                    <Target className="mx-auto h-6 w-6 text-[var(--eduai-accent-strong)]" />
                    <p className="mt-2 text-sm font-medium text-slate-200">{overviewStatus.goals === "demo" ? "Offline demo · no account goals" : overviewStatus.goals === "ready" ? "No goals added yet" : "Goals service unavailable"}</p>
                    <p className="mt-1 text-xs text-slate-400">{overviewStatus.goals === "demo" ? "This preview does not create or load student records." : overviewStatus.goals === "ready" ? "Add a goal to make your next milestone visible here." : "Your saved goals will appear when the API is reachable."}</p>
                    {overviewStatus.goals === "ready" && <button type="button" onClick={() => setActiveNode("goals")} className="mt-3 rounded-lg bg-[var(--eduai-accent)] px-3 py-2 text-xs font-semibold text-slate-950">Create a goal</button>}
                  </div>
                )}
              </section>

              <section className="eduai-surface-panel rounded-2xl border p-5 xl:col-span-5" aria-labelledby="skills-title">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h2 id="skills-title" className="text-base font-semibold text-white">Skill growth</h2>
                    <p className="mt-1 text-xs text-slate-400">Current levels from your skill graph</p>
                  </div>
                  <button type="button" onClick={() => setActiveNode("skills")} className="text-xs font-medium text-[var(--eduai-accent-strong)] hover:underline">Explore</button>
                </div>
                {overviewStatus.skills === "loading" ? (
                  <p role="status" className="mt-5 text-sm text-slate-400">Loading skill graph…</p>
                ) : skills.length ? (
                  <div className="mt-5 space-y-4">
                    {skills.slice(0, 5).map((skill) => {
                      const current = Math.max(0, Math.min(5, skill.level));
                      const required = Math.max(1, Math.min(5, skill.required_level));
                      return (
                        <div key={skill.id}>
                          <div className="mb-1.5 flex items-center justify-between gap-2 text-xs">
                            <span className="truncate font-medium text-slate-200">{skill.name}</span>
                            <span className="shrink-0 text-[10px] text-slate-400">Level {current} / {required} required</span>
                          </div>
                          <div className="h-1.5 overflow-hidden rounded-full bg-slate-800">
                            <div className="h-full rounded-full bg-gradient-to-r from-[var(--eduai-accent)] to-blue-400" style={{ width: `${(current / 5) * 100}%` }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="mt-5 rounded-xl border border-dashed p-5 text-center" style={{ borderColor: "var(--eduai-border)" }}>
                    <Network className="mx-auto h-6 w-6 text-[var(--eduai-accent-strong)]" />
                    <p className="mt-2 text-sm font-medium text-slate-200">{overviewStatus.skills === "demo" ? "Offline demo · no skill data" : overviewStatus.skills === "ready" ? "No skills returned yet" : "Skills service unavailable"}</p>
                    <p className="mt-1 text-xs text-slate-400">{overviewStatus.skills === "demo" ? "The trained model artifacts do not contain personal skill profiles." : overviewStatus.skills === "ready" ? "Your profile skill graph will show here when available." : "Skill progress appears here when the API is reachable."}</p>
                  </div>
                )}
              </section>
            </div>

            <section className="relative overflow-hidden rounded-2xl border p-5 md:flex md:items-center md:justify-between" style={{ background: "linear-gradient(115deg, color-mix(in srgb, var(--eduai-accent) 15%, var(--eduai-surface)), var(--eduai-surface))", borderColor: "var(--eduai-border)" }}>
              <div className="relative z-10">
                <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--eduai-accent-strong)]">Keep your momentum</p>
                <h2 className="mt-1 text-lg font-semibold text-white">Small steps add up to meaningful progress.</h2>
                <p className="mt-1 text-xs text-slate-400">{habits.length ? `${habits.filter((habit) => habit.done).length} of ${habits.length} tracked habits completed today, based on your habits service.` : overviewStatus.habits === "demo" ? "Offline demo preview; no habit data or training records are loaded." : overviewStatus.habits === "unavailable" ? "Habit tracking is not available until the backend connects." : "Choose a module to continue learning at your own pace."}</p>
              </div>
              <button type="button" onClick={() => setActiveNode("learning")} className="relative z-10 mt-4 inline-flex items-center gap-2 rounded-lg bg-[var(--eduai-accent)] px-4 py-2.5 text-xs font-semibold text-slate-950 transition hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--eduai-accent-strong)] md:mt-0">
                Continue learning <ArrowRight className="h-3.5 w-3.5" />
              </button>
              <div className="pointer-events-none absolute -right-8 -top-16 h-48 w-48 rounded-full bg-[var(--eduai-accent-soft)] blur-2xl" aria-hidden="true" />
            </section>
          </div>
        )}

        {/* ========================================================
            NODE 1: ACADEMIC INTELLIGENCE
            ======================================================== */}
        {activeNode === "academic" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <GlassPanel glow="cyan" className="lg:col-span-2 p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-3 rounded-xl bg-cyan-950/60 border border-cyan-500/40 text-cyan-300">
                  <GraduationCap className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">ACADEMIC TELEMETRY & PREDICTOR</h2>
                  <p className="text-xs text-slate-400 font-mono">
                    Prediction service availability and model details are not verified in this frontend.
                  </p>
                </div>
              </div>

              <div className="mb-6 grid grid-cols-1 gap-5 md:grid-cols-2">
                {[
                  { label: "Weekly study hours", value: studyHours, setValue: setStudyHours, max: 168, suffix: "hours" },
                  { label: "Attendance rate", value: attendance, setValue: setAttendance, max: 100, suffix: "%" },
                  { label: "Exam / test score", value: examScore, setValue: setExamScore, max: 100, suffix: "%" },
                  { label: "Assignment completion", value: assignmentCompletion, setValue: setAssignmentCompletion, max: 100, suffix: "%" },
                ].map(({ label, value, setValue, max, suffix }) => (
                  <label key={label} className="space-y-2 text-xs font-mono text-slate-300">
                    <span>{label}</span>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min="0"
                        max={max}
                        step="any"
                        required
                        value={value}
                        onChange={(event) => setValue(event.target.value)}
                        aria-label={label}
                        className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white outline-none focus:border-cyan-400"
                      />
                      <span className="w-12 text-right text-slate-500">{suffix}</span>
                    </div>
                  </label>
                ))}
              </div>

              <Button
                variant="primary"
                onClick={handlePredictAcademic}
                isLoading={isPredicting}
                rightIcon={<Zap className="w-4 h-4" />}
              >
                EXECUTE PERFORMANCE PREDICTION
              </Button>
            </GlassPanel>

            {/* Prediction Output Telemetry */}
            <GlassPanel glow="cyan" className="p-6 flex flex-col justify-between">
              <div>
                <span className="text-xs font-mono text-cyan-400 uppercase tracking-wider">
                  Model Output
                </span>
                <h3 className="text-lg font-bold text-white mt-1">FORECAST TELEMETRY</h3>

                {academicResult && (
                  <div className="mt-6 space-y-4">
                    <div className="p-4 rounded-xl bg-black/50 border border-cyan-500/25 text-center">
                      <div className="text-xs text-slate-400 font-mono">PREDICTED FINAL SCORE</div>
                      <div className="text-4xl font-extrabold text-cyan-300 font-mono mt-1">
                        {academicResult.predicted_final_marks}%
                      </div>
                      <div className="text-xs text-emerald-400 font-mono mt-1">
                        Classification: {academicResult.performance_level}
                      </div>
                    </div>

                    <div className="text-xs font-mono space-y-2">
                      <div className="text-slate-400">FEATURE WEIGHTS:</div>
                      {Object.entries(academicResult.feature_contributions || {}).map(([k, v]) => (
                        <div key={k} className="flex justify-between items-center text-slate-300">
                          <span>{k}</span>
                          <span className="text-cyan-400">{(v * 100).toFixed(0)}%</span>
                        </div>
                      ))}
                    </div>

                    <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-500/30 text-xs text-emerald-200">
                      <div className="font-semibold mb-1">Target Recommendation:</div>
                      {academicResult.recommendations?.[0]}
                    </div>
                  </div>
                )}
              </div>
            </GlassPanel>
          </div>
        )}

        {/* ========================================================
            NODE 2: SKILL GRAPH INTELLIGENCE
            ======================================================== */}
        {activeNode === "skills" && (
          <GlassPanel glow="cyan" className="p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-xl bg-cyan-950/60 border border-cyan-500/40 text-cyan-300">
                  <Network className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">SKILL GRAPH CONSTELLATION</h2>
                  <p className="text-xs text-slate-400 font-mono">{isDemo ? "Offline demo · no personal skill data is loaded." : "Skill profile returned by the configured API."}</p>
                </div>
              </div>
            </div>

            {skillsLoading ? (
              <p role="status" className="text-sm text-slate-400">Loading skill profile…</p>
            ) : skills.length === 0 ? (
              <div className="rounded-xl border border-white/10 bg-black/20 p-5 text-sm text-slate-400">
                {isDemo ? "Offline demo only. Connect the backend to load your personal skill profile." : "No skills were returned by the API. Add skills in your profile or check the backend connection."}
              </div>
            ) : (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              {skills.map((s) => (
                <div
                  key={s.id}
                  className="p-4 rounded-xl bg-black/40 border border-cyan-500/20 space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-white">{s.name}</span>
                    <span className="text-[10px] text-slate-500">{s.category}</span>
                    <span
                      className={`text-[10px] font-mono px-2 py-0.5 rounded uppercase ${
                        s.status === "mastered"
                          ? "bg-emerald-950/60 text-emerald-400 border border-emerald-500/40"
                          : s.status === "learning"
                          ? "bg-cyan-950/60 text-cyan-300 border border-cyan-500/40"
                          : "bg-amber-950/60 text-amber-300 border border-amber-500/40"
                      }`}
                    >
                      {s.status}
                    </span>
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between text-xs font-mono text-slate-400">
                      <span>Proficiency</span>
                      <span className="text-cyan-400">
                        {skillDrafts[s.id] ?? s.level} / {s.required_level} (Required)
                      </span>
                    </div>
                    <label className="sr-only" htmlFor={`skill-level-${s.id}`}>Set {s.name} skill level</label>
                    <input
                      id={`skill-level-${s.id}`}
                      type="range"
                      min="1"
                      max="5"
                      step="1"
                      value={skillDrafts[s.id] ?? s.level}
                      onChange={(event) => setSkillDrafts((drafts) => ({ ...drafts, [s.id]: Number(event.target.value) }))}
                      className="w-full accent-cyan-400"
                    />
                    <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden">
                      <div
                        className={`h-full rounded-full ${
                          s.status === "mastered"
                            ? "bg-emerald-400"
                            : s.status === "learning"
                            ? "bg-cyan-400"
                            : "bg-amber-400"
                        }`}
                        style={{ width: `${((skillDrafts[s.id] ?? s.level) / 5) * 100}%` }}
                      />
                    </div>
                  </div>
                  <button
                    type="button"
                    disabled={savingSkillId === s.id || (skillDrafts[s.id] ?? s.level) === s.level}
                    onClick={() => void handleSaveSkill(s)}
                    className="rounded-lg border border-cyan-400/20 px-3 py-2 text-xs text-cyan-200 transition hover:bg-cyan-400/10 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {savingSkillId === s.id ? "Saving…" : "Save level"}
                  </button>
                </div>
              ))}
            </div>
            )}
          </GlassPanel>
        )}

        {/* ========================================================
            NODE 3: CAREER INTELLIGENCE (CATBOOST MODEL)
            ======================================================== */}
        {activeNode === "career" && (
          <div className="space-y-6">
            <GlassPanel glow="gold" className="p-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-xl bg-amber-950/50 border border-amber-500/40 text-amber-300">
                    <Compass className="w-6 h-6" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-white">CAREER INTELLIGENCE ENGINE</h2>
                    <p className="text-xs text-slate-400 font-mono">Career recommendation API · availability not verified</p>
                  </div>
                </div>

                <div className="grid w-full gap-2 sm:w-auto sm:grid-cols-2">
                  <input
                    type="text"
                    value={careerSpecialization}
                    onChange={(e) => setCareerSpecialization(e.target.value)}
                    placeholder="Enter career direction..."
                    aria-label="Career direction"
                    className="w-full rounded-xl border border-amber-500/30 bg-black/50 px-3.5 py-2 text-xs text-white outline-none focus:border-amber-400"
                  />
                  <input
                    type="text"
                    value={careerEducationLevel || profile?.education_level || ""}
                    onChange={(event) => setCareerEducationLevel(event.target.value)}
                    placeholder="Education level"
                    aria-label="Education level"
                    className="w-full rounded-xl border border-amber-500/30 bg-black/50 px-3.5 py-2 text-xs text-white outline-none focus:border-amber-400"
                  />
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="0.01"
                    value={careerCgpaPercentage}
                    onChange={(event) => setCareerCgpaPercentage(event.target.value)}
                    placeholder="CGPA percentage"
                    aria-label="CGPA percentage"
                    className="w-full rounded-xl border border-amber-500/30 bg-black/50 px-3.5 py-2 text-xs text-white outline-none focus:border-amber-400"
                  />
                  <input
                    type="text"
                    value={careerSkills}
                    onChange={(event) => setCareerSkills(event.target.value)}
                    placeholder="Skills (comma separated)"
                    aria-label="Skills, comma separated"
                    className="w-full rounded-xl border border-amber-500/30 bg-black/50 px-3.5 py-2 text-xs text-white outline-none focus:border-amber-400"
                  />
                  <input
                    type="text"
                    value={careerCertifications}
                    onChange={(event) => setCareerCertifications(event.target.value)}
                    placeholder="Certifications (optional)"
                    aria-label="Certifications, comma separated"
                    className="w-full rounded-xl border border-amber-500/30 bg-black/50 px-3.5 py-2 text-xs text-white outline-none focus:border-amber-400 sm:col-span-2"
                  />
                  <Button
                    variant="gold"
                    size="sm"
                    onClick={handleRecommendCareer}
                    isLoading={isCalculatingCareer}
                  >
                    EVALUATE
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {careerRecommendations.map((career) => (
                  <div
                    key={career.career_title}
                    className="p-5 rounded-2xl bg-black/45 border border-amber-500/25 space-y-4 hover:border-amber-400/50 transition-all"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="text-[10px] font-mono text-amber-400 uppercase tracking-widest">
                          {career.category}
                        </div>
                        <h3 className="text-lg font-bold text-white mt-0.5">
                          {career.career_title}
                        </h3>
                      </div>
                      <div className="text-right">
                        <div className="text-xl font-extrabold text-amber-300 font-mono">
                          {career.recommendation_score}%
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono">Recommendation Score</div>
                      </div>
                    </div>

                    <p className="text-xs text-slate-300 leading-relaxed">
                      {career.roadmap_summary}
                    </p>

                    <div className="space-y-1.5 font-mono text-xs">
                      <div className="text-slate-400 text-[10px]">REQUIRED PREREQUISITES:</div>
                      <div className="flex flex-wrap gap-1.5">
                        {career.key_prerequisites.map((p) => (
                          <span
                            key={p}
                            className="px-2 py-0.5 rounded bg-amber-950/60 border border-amber-500/30 text-amber-200 text-[11px]"
                          >
                            {p}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-amber-500/15 text-xs font-mono">
                      <span className="text-slate-400">Demand: <span className="text-emerald-400 font-semibold">{career.market_demand}</span></span>
                      <span className="text-amber-300">{career.median_salary_range}</span>
                    </div>
                  </div>
                ))}
              </div>
            </GlassPanel>
          </div>
        )}

        {/* ========================================================
            NODE 4: STUDY STUDIO & RAG
            ======================================================== */}
        {activeNode === "learning" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <GlassPanel glow="cyan" className="p-6 lg:col-span-1">
              <h3 className="text-base font-bold text-white mb-2">MATERIAL VAULT</h3>
              <p className="text-xs text-slate-400 font-mono mb-4">Upload a learning document to the configured document service.</p>
              <label className="mb-4 block cursor-pointer rounded-2xl border-2 border-dashed border-cyan-500/30 p-6 text-center transition-all hover:border-cyan-400 focus-within:ring-2 focus-within:ring-cyan-300">
                <BookOpen className="mx-auto mb-2 h-8 w-8 text-cyan-400" />
                <span className="block text-xs font-semibold text-slate-200">{documentBusy ? "Working…" : "Choose study material"}</span>
                <span className="mt-1 block text-[10px] font-mono text-slate-400">The backend determines supported formats.</span>
                <input
                  type="file"
                  disabled={documentBusy}
                  onChange={(event) => { void handleDocumentUpload(event.target.files?.[0]); event.currentTarget.value = ""; }}
                  className="sr-only"
                />
              </label>

              <div className="space-y-2">
                <div className="text-xs font-mono text-slate-400 uppercase">Indexed Documents</div>
                {documents.length === 0 && <p className="text-xs text-slate-500">No documents loaded in this session.</p>}
                {documents.map((doc) => (
                  <div
                    key={doc.id}
                    className={`flex items-center justify-between gap-2 rounded-xl border p-2.5 text-xs text-slate-300 ${activeDocumentId === doc.id ? "border-cyan-400" : "border-cyan-500/20"}`}
                  >
                    <button type="button" onClick={() => { setActiveDocumentId(doc.id); setDocumentAnswer(null); }} className="truncate text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300">
                      {doc.filename}
                    </button>
                    <span className="text-[10px] font-mono text-slate-400">API response</span>
                  </div>
                ))}
              </div>
            </GlassPanel>

            <GlassPanel glow="cyan" className="p-6 lg:col-span-2 space-y-4">
              <h3 className="text-base font-bold text-white">ASK THIS MATERIAL (RAG RETRIEVAL)</h3>
              <form onSubmit={(event) => { event.preventDefault(); void handleAskDocument(); }} className="flex flex-col gap-2 sm:flex-row">
                <input
                  type="text"
                  value={documentQuestion}
                  onChange={(event) => setDocumentQuestion(event.target.value)}
                  required
                  minLength={2}
                  maxLength={1000}
                  placeholder="Ask a question about the selected document"
                  className="flex-1 px-4 py-2.5 rounded-xl bg-black/50 border border-cyan-500/30 text-white text-xs font-mono focus:border-cyan-400 outline-none"
                />
                <Button type="submit" variant="primary" size="sm" isLoading={documentBusy} disabled={!activeDocumentId}>
                  QUERY
                </Button>
              </form>

              {documentAnswer ? (
                <div className="space-y-3 rounded-xl border border-cyan-500/25 bg-black/30 p-4">
                  <div className="flex items-center gap-2 text-cyan-400"><Sparkles className="h-4 w-4" /><span className="font-semibold">Document service response</span></div>
                  <p className="text-sm leading-relaxed text-slate-200">{documentAnswer.answer}</p>
                  {documentAnswer.citations.map((citation) => (
                    <blockquote key={`${citation.page}-${citation.excerpt}`} className="rounded-lg border border-cyan-500/20 p-2.5 text-xs text-slate-300">
                      Page {citation.page}: {citation.excerpt}
                    </blockquote>
                  ))}
                </div>
              ) : (
                <p className="rounded-xl border border-cyan-500/15 p-4 text-sm text-slate-400">Upload a document and ask a question to see a backend response and citations here.</p>
              )}
            </GlassPanel>
          </div>
        )}

        {/* ========================================================
            NODE 5: ADAPTIVE QUIZ SYSTEM
            ======================================================== */}
        {activeNode === "quiz" && (
          <GlassPanel glow="cyan" className="p-6 max-w-2xl mx-auto space-y-6">
            <div>
              <p className="text-xs font-mono uppercase tracking-wider text-cyan-400">Backend-connected quiz</p>
              <h3 className="mt-1 text-lg font-bold text-white">Quiz intelligence</h3>
              <p className="mt-1 text-xs text-slate-400">Questions and results come from the configured quiz API.</p>
            </div>

            {!quizQuestions.length && (
              <form onSubmit={(event) => { event.preventDefault(); void handleGenerateQuiz(); }} className="flex flex-col gap-3 sm:flex-row">
                <label className="sr-only" htmlFor="quiz-topic">Quiz topic</label>
                <input
                  id="quiz-topic"
                  type="text"
                  value={quizTopic}
                  onChange={(event) => setQuizTopic(event.target.value)}
                  required
                  minLength={2}
                  maxLength={120}
                  placeholder="Enter a topic"
                  className="min-w-0 flex-1 rounded-xl border border-cyan-500/30 bg-black/40 px-4 py-2.5 text-sm text-white outline-none focus-visible:ring-2 focus-visible:ring-cyan-300"
                />
                <Button type="submit" variant="primary" size="sm" isLoading={isGeneratingQuiz}>
                  Generate quiz
                </Button>
              </form>
            )}

            {quizQuestions.length > 0 && !quizResult && (
              <>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-xs text-slate-400">
                    Question {currentQuizIndex + 1} of {quizQuestions.length} · {quizTopic}
                  </p>
                  <p className="text-xs text-slate-400">Results are submitted to the quiz service.</p>
                </div>
                <div className="rounded-2xl border border-cyan-500/20 bg-black/30 p-4 font-medium text-slate-100">
                  {quizQuestions[currentQuizIndex].question}
                </div>
                <div className="space-y-3">
                  {quizQuestions[currentQuizIndex].options.map((option, index) => (
                    <button
                      key={`${quizQuestions[currentQuizIndex].id}-${index}`}
                      type="button"
                      disabled={isSubmittingQuiz}
                      onClick={() => {
                        const answers = { ...quizAnswers, [quizQuestions[currentQuizIndex].id]: index };
                        setQuizAnswers(answers);
                        if (currentQuizIndex < quizQuestions.length - 1) {
                          setCurrentQuizIndex((current) => current + 1);
                        } else {
                          void handleSubmitQuiz(answers);
                        }
                      }}
                      className="w-full rounded-xl border border-cyan-500/20 bg-black/30 p-3.5 text-left text-sm text-slate-300 transition hover:border-cyan-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300 disabled:opacity-60"
                    >
                      {option}
                    </button>
                  ))}
                </div>
                {isSubmittingQuiz && <p role="status" className="text-sm text-slate-400">Submitting your answers…</p>}
              </>
            )}

            {quizResult && (
              <div className="rounded-2xl border border-emerald-500/40 bg-emerald-950/30 p-4 font-mono">
                <h4 className="font-semibold text-emerald-300">Quiz result</h4>
                <p className="mt-1 text-sm text-slate-200">
                  Score: {quizResult.score} / {quizResult.total_questions} · accuracy {quizResult.accuracy}%
                </p>
                {quizResult.weak_topics.length > 0 && <p className="mt-2 text-xs text-slate-300">Review: {quizResult.weak_topics.join(", ")}</p>}
                {quizResult.recommended_actions.length > 0 && (
                  <ul className="mt-2 list-disc space-y-1 pl-5 text-xs text-slate-300">
                    {quizResult.recommended_actions.map((action) => <li key={action}>{action}</li>)}
                  </ul>
                )}
                <button
                  type="button"
                  onClick={() => { setQuizQuestions([]); setQuizResult(null); setQuizId(""); setQuizAnswers({}); setCurrentQuizIndex(0); }}
                  className="mt-4 rounded-lg border border-white/15 px-3 py-2 text-xs"
                >
                  Create another quiz
                </button>
              </div>
            )}
          </GlassPanel>
        )}

        {/* ========================================================
            NODE 6: HABIT CADENCE SYSTEM
            ======================================================== */}
        {activeNode === "habits" && (
          <GlassPanel glow="cyan" className="p-6 space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-xl bg-sky-950/60 border border-sky-500/40 text-sky-300">
                  <Calendar className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">HABIT & PERFORMANCE CADENCE</h2>
                  <p className="text-xs text-slate-400 font-mono">
                    {isDemo ? "Offline demo · habit tracking is not connected." : "Track daily rituals driving student academic excellence and cognitive focus"}
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {habitsLoading ? (
                <p role="status" className="col-span-full text-sm text-slate-400">Loading habits…</p>
              ) : habits.length === 0 ? (
                <p className="col-span-full text-sm text-slate-400">{isDemo ? "Offline demo only. Connect the backend to load or update habits." : "No habits returned by the connected service."}</p>
              ) : habits.map((habit) => (
                <button
                  type="button"
                  key={habit.id}
                  onClick={() => void toggleHabit(habit.id)}
                  className={`rounded-2xl border p-4 text-left transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300 ${
                    habit.done
                      ? "bg-cyan-950/30 border-cyan-400/50 shadow-[0_0_20px_rgba(0,240,255,0.15)]"
                      : "bg-black/40 border-slate-800 hover:border-slate-700"
                  }`}
                  aria-pressed={habit.done}
                >
                  <div className="mb-3 flex items-center justify-between">
                    <span className="text-xs font-mono text-cyan-400">{habit.done ? "Completed today" : "Mark complete"}</span>
                    <CheckCircle className={`h-5 w-5 ${habit.done ? "text-cyan-400" : "text-slate-600"}`} />
                  </div>
                  <div className="mb-2 text-sm font-semibold text-white">{habit.name}</div>
                  <div className="text-xs font-mono text-slate-400">
                    Streak: <span className="font-bold text-emerald-400">{habit.streak} days</span>
                  </div>
                </button>
              ))}
            </div>
          </GlassPanel>
        )}

        {activeNode === "goals" && (
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(280px,0.8fr)]">
            <GlassPanel glow="cyan" className="space-y-5 p-6">
              <div className="flex items-center gap-3">
                <Target className="h-6 w-6 text-cyan-300" />
                <div>
                  <h2 className="text-xl font-bold text-white">GOALS</h2>
                  <p className="text-xs text-slate-400">{isDemo ? "Offline demo · account goals are not loaded." : "Goals returned by the configured API."}</p>
                </div>
              </div>
              {goalsLoading ? (
                <p role="status" className="text-sm text-slate-400">Loading goals…</p>
              ) : goals.length === 0 ? (
                <p className="rounded-xl border border-white/10 p-4 text-sm text-slate-400">{isDemo ? "Offline demo only. Connect the backend to load or create account goals." : "No goals returned yet."}</p>
              ) : (
                <div className="space-y-3">
                  {goals.map((goal) => (
                    <article key={goal.id} className="rounded-xl border border-white/10 bg-black/20 p-4">
                      <div className="flex items-start justify-between gap-3">
                        <h3 className="font-medium text-white">{goal.title}</h3>
                        <span className="shrink-0 text-xs text-slate-400">{goal.deadline || "No deadline"}</span>
                      </div>
                      <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-800">
                        <div className="h-full rounded-full bg-cyan-400" style={{ width: `${Math.max(0, Math.min(100, goal.progress || 0))}%` }} />
                      </div>
                      <p className="mt-1 text-right text-xs text-slate-400">{goal.progress}%</p>
                      {goal.tasks?.length > 0 && <ul className="mt-3 list-inside list-disc space-y-1 text-xs text-slate-400">{goal.tasks.map((task, index) => <li key={`${goal.id}-${index}`}>{task}</li>)}</ul>}
                    </article>
                  ))}
                </div>
              )}
            </GlassPanel>
            <GlassPanel glow="cyan" className="p-6">
              <h3 className="mb-4 font-semibold text-white">Create a goal</h3>
              <form className="space-y-3" onSubmit={(event) => void handleCreateGoal(event)}>
                <label className="block text-xs text-slate-300">
                  Goal title
                  <input required minLength={2} value={goalTitle} onChange={(event) => setGoalTitle(event.target.value)} className="mt-1 w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-white" />
                </label>
                <label className="block text-xs text-slate-300">
                  Target date
                  <input required type="date" value={goalDeadline} onChange={(event) => setGoalDeadline(event.target.value)} className="mt-1 w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-white" />
                </label>
                <label className="block text-xs text-slate-300">
                  Milestones (comma separated)
                  <textarea value={goalTasks} onChange={(event) => setGoalTasks(event.target.value)} rows={3} className="mt-1 w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-white" />
                </label>
                <Button type="submit" isLoading={goalSaving}>Create goal</Button>
              </form>
            </GlassPanel>
          </div>
        )}

        {activeNode === "jobs" && (
          <GlassPanel glow="cyan" className="space-y-5 p-6">
            <div>
              <h2 className="text-xl font-bold text-white">JOB SEARCH</h2>
              <p className="text-xs text-slate-400">Listings are shown only when returned by the connected job-search API.</p>
            </div>
            <form className="grid gap-3 md:grid-cols-[1fr_1fr_auto]" onSubmit={(event) => { event.preventDefault(); void handleJobSearch(); }}>
              <input aria-label="Job title or keywords" required minLength={2} value={jobQuery} onChange={(event) => setJobQuery(event.target.value)} placeholder="Job title or keywords" className="rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-white" />
              <input aria-label="Location (optional)" value={jobLocation} onChange={(event) => setJobLocation(event.target.value)} placeholder="Location (optional)" className="rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-white" />
              <Button type="submit" isLoading={jobsLoading}>Search jobs</Button>
            </form>
            {jobsLoading ? <p role="status" className="text-sm text-slate-400">Searching…</p> : jobs.length === 0 ? (
              <p className="rounded-xl border border-white/10 p-4 text-sm text-slate-400">No results to display. Search to request current results from the service.</p>
            ) : (
              <div className="grid gap-3 md:grid-cols-2">
                {jobs.map((job) => {
                  const applyUrl = safeExternalUrl(job.apply_url);
                  return (
                    <article key={job.id} className="rounded-xl border border-white/10 bg-black/20 p-4">
                      <h3 className="font-semibold text-white">{job.title}</h3>
                      <p className="mt-1 text-sm text-slate-300">{job.company} · {job.location}</p>
                      <p className="mt-2 text-xs text-slate-400">{job.salary_estimate || "Salary not provided"} · Match score returned by API: {job.match_percentage}%</p>
                      {job.matched_skills.length > 0 && <p className="mt-2 text-xs text-emerald-300">Matched: {job.matched_skills.join(", ")}</p>}
                      {job.missing_skills.length > 0 && <p className="mt-1 text-xs text-amber-300">Skills to develop: {job.missing_skills.join(", ")}</p>}
                      {applyUrl && <a href={applyUrl} target="_blank" rel="noreferrer" className="mt-3 inline-block text-sm text-cyan-300 underline focus-visible:outline focus-visible:outline-2">View application</a>}
                    </article>
                  );
                })}
              </div>
            )}
          </GlassPanel>
        )}

        {activeNode === "projects" && (
          <GlassPanel glow="cyan" className="space-y-3 p-6">
            <h2 className="text-xl font-bold text-white">PROJECTS</h2>
            <p className="text-sm text-slate-300">Project management is not configured: this frontend has no verified projects API or route.</p>
            <Link href="/project-info" className="inline-flex text-sm text-cyan-300 underline">View configured project information</Link>
          </GlassPanel>
        )}

        {activeNode === "lab" && (
          <GlassPanel glow="cyan" className="space-y-4 p-4 md:p-6">
            <div>
              <h2 className="text-xl font-bold text-white">3D LEARNING LAB</h2>
              <p className="text-xs text-slate-400">Preset human-heart learning demo; explanations and quiz content are not AI-generated.</p>
            </div>
            <LearningLabCanvas reducedMotion={preferences.reducedMotion} />
          </GlassPanel>
        )}

        {/* ========================================================
            NODE 7: RESUME & ATS INTELLIGENCE
            ======================================================== */}
        {activeNode === "resume" && (
          <GlassPanel glow="cyan" className="p-6 space-y-6">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-cyan-950/60 border border-cyan-500/40 text-cyan-300">
                <FileText className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">RESUME & ATS INTELLIGENCE</h2>
                <p className="text-xs text-slate-400 font-mono">Upload a resume to request analysis from the connected API.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="p-6 rounded-2xl bg-black/40 border border-cyan-500/20 text-center font-mono">
                <div className="text-xs text-slate-400">ATS MATCH SCORE</div>
                <div className="text-3xl font-extrabold text-cyan-400 mt-2">
                  {resumeAnalysis ? `${resumeAnalysis.ats_score} / 100` : resumeBusy ? "Analyzing…" : "Not analyzed"}
                </div>
                <label className="mt-4 block text-left text-xs text-slate-400">
                  Choose a resume file
                  <input
                    type="file"
                    accept=".pdf,.doc,.docx"
                    disabled={resumeBusy}
                    onChange={(event) => { void handleResumeUpload(event.target.files?.[0]); event.currentTarget.value = ""; }}
                    className="mt-2 block w-full text-xs file:mr-2 file:rounded-md file:border-0 file:bg-cyan-400 file:px-3 file:py-2 file:text-slate-950"
                  />
                </label>
              </div>

              <div className="md:col-span-2 p-5 rounded-2xl bg-black/40 border border-cyan-500/20 space-y-3 font-mono text-xs">
                {resumeAnalysis ? (
                  <>
                    <div className="text-slate-300 font-bold">ANALYSIS FROM THE RESUME SERVICE</div>
                    <p className="text-slate-400">Detected skills: {resumeAnalysis.detected_skills.join(", ") || "None returned"}</p>
                    <p className="text-amber-300">Missing skills: {resumeAnalysis.missing_skills.join(", ") || "None returned"}</p>
                    <ul className="list-disc space-y-1 pl-5 text-slate-300">
                      {resumeAnalysis.suggestions.map((suggestion) => <li key={suggestion}>{suggestion}</li>)}
                    </ul>
                    {resumeAnalysis.bullet_point_improvements.map((item) => (
                      <div key={`${item.original}-${item.improved}`} className="border-t border-white/10 pt-2">
                        <p>Before: {item.original}</p><p>Suggested: {item.improved}</p><p className="text-slate-400">{item.reason}</p>
                      </div>
                    ))}
                  </>
                ) : (
                  <p className="text-slate-400">No resume analysis yet. No score or recommendations are displayed until the API returns them.</p>
                )}
              </div>
            </div>
          </GlassPanel>
        )}

        {/* ========================================================
            NODE 8: CINEMATIC MOCK INTERVIEW
            ======================================================== */}
        {activeNode === "interview" && (
          <GlassPanel glow="cyan" className="p-6 max-w-3xl mx-auto space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-xl bg-rose-950/60 border border-rose-500/40 text-rose-300">
                  <Mic className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">AI MOCK INTERVIEW SUITE</h2>
                  <p className="text-xs text-slate-400 font-mono">Questions and feedback are supplied by the configured interview API.</p>
                </div>
              </div>
              {interviewSessionId && <span className="rounded-full border border-rose-500/30 bg-rose-950/50 px-3 py-1 text-xs font-mono text-rose-300">Session active</span>}
            </div>

            {!interviewSessionId ? (
              <div className="grid gap-3 sm:grid-cols-3">
                <label className="text-xs text-slate-400 sm:col-span-2">
                  Interview role
                  <input
                    value={interviewRole}
                    onChange={(event) => setInterviewRole(event.target.value)}
                    minLength={2}
                    maxLength={120}
                    placeholder="e.g. Data analyst"
                    className="mt-1 block w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2.5 text-sm text-white"
                  />
                </label>
                <label className="text-xs text-slate-400">
                  Interview type
                  <select
                    value={interviewType}
                    onChange={(event) => setInterviewType(event.target.value as typeof interviewType)}
                    className="mt-1 block w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2.5 text-sm text-white"
                  >
                    <option>Technical</option><option>HR</option><option>Behavioral</option>
                  </select>
                </label>
                <Button type="button" variant="primary" size="sm" isLoading={interviewBusy} onClick={() => void handleStartInterview()}>
                  Start interview
                </Button>
              </div>
            ) : (
              <>
                <div className="space-y-2 rounded-2xl border border-rose-500/25 bg-black/30 p-5">
                  <div className="text-xs font-mono font-semibold uppercase text-rose-400">Interviewer prompt</div>
                  <p className="text-sm text-slate-200">{interviewPrompt}</p>
                </div>
                {!interviewComplete && (
                  <div className="space-y-3">
                    <label htmlFor="interview-answer" className="text-xs text-slate-400">Your answer</label>
                    <textarea
                      id="interview-answer"
                      value={interviewAnswer}
                      onChange={(event) => setInterviewAnswer(event.target.value)}
                      required
                      minLength={2}
                      maxLength={10000}
                      rows={5}
                      className="block w-full rounded-xl border border-white/10 bg-black/40 p-3 text-sm text-white"
                    />
                    <Button type="button" variant="primary" size="sm" isLoading={interviewBusy} onClick={() => void handleInterviewResponse()}>
                      Submit answer
                    </Button>
                  </div>
                )}
                {interviewFeedback && (
                  <div aria-live="polite" className="space-y-2 rounded-xl border border-cyan-500/20 p-4 text-sm">
                    <p>Clarity: {interviewFeedback.clarity}</p>
                    <p>Technical accuracy: {interviewFeedback.technical_accuracy}</p>
                    <p>Confidence: {interviewFeedback.confidence_indicator}</p>
                    <ul className="list-disc pl-5 text-slate-300">{interviewFeedback.notes.map((note) => <li key={note}>{note}</li>)}</ul>
                  </div>
                )}
                {interviewComplete && <p role="status" className="text-sm text-emerald-300">Interview completed by the service.</p>}
              </>
            )}
          </GlassPanel>
        )}

        {/* ========================================================
            NODE 9: AUTONOMOUS AI AGENT
            ======================================================== */}
        {activeNode === "agent" && (
          <GlassPanel glow="cyan" className="p-6 space-y-6">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-cyan-950/60 border border-cyan-500/40 text-cyan-300">
                <Bot className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">AUTONOMOUS MULTI-TOOL AGENT</h2>
                <p className="text-xs text-slate-400 font-mono">
                  Live responses and tool list are supplied by the configured EduAI API.
                </p>
              </div>
            </div>

            {agentBusy && <p role="status" className="text-sm text-slate-400">Waiting for the AI service…</p>}
            {agentResponse && <div aria-live="polite" className="rounded-xl border border-cyan-500/25 bg-black/30 p-4 text-sm leading-relaxed text-slate-200">{agentResponse}</div>}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono text-xs">
              {agentTools.map((tool) => (
                <div
                  key={tool.name}
                  title={tool.description}
                  className="flex items-center gap-2 rounded-xl border border-cyan-500/25 bg-black/50 p-3 text-cyan-300"
                >
                  <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                  <span className="truncate">{tool.name}</span>
                </div>
              ))}
            </div>
            {agentTools.length === 0 && !actionError && (
              <p className="text-xs text-slate-400">No tools have been verified from the backend registry.</p>
            )}
          </GlassPanel>
        )}
      </main>

      {/* Floating Command Bar accessible everywhere */}
      <CommandBar
        onVoiceStateChange={setVoiceState}
        onExecutePrompt={(prompt) => { void handleAgentPrompt(prompt); }}
        onUploadFile={(file) => {
          setActiveNode("learning");
          void handleDocumentUpload(file);
        }}
      />
    </div>
  );
}
