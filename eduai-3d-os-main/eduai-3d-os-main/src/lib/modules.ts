import { BookOpen, Brain, Briefcase, FileText, FlaskConical, GraduationCap, ListChecks, Mic, Repeat, Sparkles, Target, Trophy, Wrench, type LucideIcon } from "lucide-react";

export type EduModule = { slug: string; name: string; tagline: string; icon: LucideIcon; endpoint: string; empty: string };

// Each module lists the API endpoint it will call once the backend exists.
export const MODULES: EduModule[] = [
  { slug: "academic", name: "Academic Intelligence", tagline: "Grades, attendance and performance trends", icon: GraduationCap, endpoint: "/api/academic/summary", empty: "Connect your academic records to see performance trends and risk signals." },
  { slug: "study", name: "Study Studio", tagline: "Notes, summaries and focused sessions", icon: BookOpen, endpoint: "/api/study/sessions", empty: "Upload notes or start a focus session to begin." },
  { slug: "quiz", name: "Quiz Intelligence", tagline: "Adaptive quizzes that find your gaps", icon: ListChecks, endpoint: "/api/quiz", empty: "No quizzes yet. Generated quizzes will appear here." },
  { slug: "skills", name: "Skill Intelligence", tagline: "Your skill graph, mapped", icon: Brain, endpoint: "/api/skills/graph", empty: "Your skill graph builds as you learn and practise." },
  { slug: "career", name: "Career Intelligence", tagline: "Paths matched to who you are becoming", icon: Trophy, endpoint: "/api/career/paths", empty: "Career recommendations appear once your profile is complete." },
  { slug: "projects", name: "Project Center", tagline: "Build a portfolio that proves skill", icon: Wrench, endpoint: "/api/projects", empty: "Add your first project to start a portfolio." },
  { slug: "resume", name: "Resume Center", tagline: "A living resume, always current", icon: FileText, endpoint: "/api/resume", empty: "Upload or build a resume to get feedback." },
  { slug: "interview", name: "Mock Interview", tagline: "Practise with an AI interviewer", icon: Mic, endpoint: "/api/interview/sessions", empty: "Start a mock interview to receive feedback." },
  { slug: "jobs", name: "Jobs & Internships", tagline: "Opportunities matched to your skills", icon: Briefcase, endpoint: "/api/jobs", empty: "Matched opportunities will appear here." },
  { slug: "goals", name: "Goals", tagline: "Long-range targets, broken down", icon: Target, endpoint: "/api/goals", empty: "Set a goal to start tracking progress." },
  { slug: "habits", name: "Habits", tagline: "Small daily systems that compound", icon: Repeat, endpoint: "/api/habits", empty: "Create a habit to build your streak." },
  { slug: "lab", name: "3D Learning Lab", tagline: "Explore concepts in three dimensions", icon: FlaskConical, endpoint: "/api/lab/scenes", empty: "Interactive 3D lessons will load here." },
  { slug: "agent", name: "AI Agent", tagline: "Your personal education copilot", icon: Sparkles, endpoint: "/api/agent/chat", empty: "Ask EduAI anything once the AI service is connected." },
];

export const getModule = (slug: string) => MODULES.find((m) => m.slug === slug);
