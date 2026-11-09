/**
 * EduAI Centralized API Client
 * Clean interface to all FastAPI backend endpoints with token injection and typed responses.
 */

import {
  AuthResponse,
  User,
  StudentProfile,
  AcademicPredictionRequest,
  AcademicPredictionResponse,
  CareerRecommendationRequest,
  CareerRecommendation,
  AIProviderId,
  JobRoleRecommendation,
  JobRoleRecommendationRequest,
  SkillGraphData,
  QuizQuestion,
  QuizResult,
  AgentMessage,
  DocumentSummary,
} from "@/types";
import { isOfflineDemoSession } from "@/lib/demo-auth";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "";

class ApiError extends Error {
  status: number;
  data: unknown;

  constructor(message: string, status: number, data?: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.data = data;
  }
}

function formatErrorDetail(detail: unknown): string | undefined {
  if (typeof detail === "string") {
    return detail;
  }

  if (!Array.isArray(detail)) {
    return undefined;
  }

  const messages = detail.flatMap((item: unknown) => {
    if (!item || typeof item !== "object") {
      return [];
    }

    const error = item as { loc?: unknown; msg?: unknown };
    const location = Array.isArray(error.loc)
      ? error.loc.filter((part) => part !== "body").map(String).join(".")
      : "";
    const message = typeof error.msg === "string" ? error.msg : "";
    const formatted = [location, message].filter(Boolean).join(": ");
    return formatted ? [formatted] : [];
  });

  return messages.length > 0 ? messages.join("; ") : undefined;
}

function assertAuthResponse(response: AuthResponse): AuthResponse {
  if (
    !response
    || typeof response !== "object"
    || typeof response.access_token !== "string"
    || response.access_token.trim().length === 0
    || !response.user
    || typeof response.user.id !== "string"
    || typeof response.user.email !== "string"
    || typeof response.user.full_name !== "string"
  ) {
    throw new ApiError(
      "The authentication service returned an incomplete response. It must provide an access token and user profile.",
      502
    );
  }
  return response;
}

async function request<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  if (isOfflineDemoSession()) {
    throw new ApiError(
      "This is an offline demo session. Connect the EduAI backend to use live student data, AI modules, or account services.",
      503
    );
  }

  const token = typeof window !== "undefined" ? localStorage.getItem("eduai_token") : null;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  // Remove Content-Type for FormData
  if (options.body instanceof FormData) {
    delete headers["Content-Type"];
  }

  const url = `${API_BASE_URL}${endpoint}`;
  try {
    const res = await fetch(url, {
      ...options,
      headers,
    });

    if (!res.ok) {
      const responseText = await res.text();
      let errData: unknown = responseText;
      try {
        errData = responseText ? JSON.parse(responseText) : null;
      } catch {
        // Preserve non-JSON error bodies as text.
      }
      const detail = errData && typeof errData === "object" && "detail" in errData
        ? formatErrorDetail(errData.detail)
        : "";
      throw new ApiError(
        detail || (typeof errData === "string" && errData) || `API Request failed with status ${res.status}`,
        res.status,
        errData
      );
    }

    return (await res.json()) as T;
  } catch (err: unknown) {
    if (err instanceof ApiError) throw err;
    if (err instanceof TypeError) {
      throw new ApiError(
        "Unable to reach the EduAI backend. Confirm the service is running, NEXT_PUBLIC_API_URL is correct, and the backend allows this app's origin.",
        503
      );
    }
    throw new ApiError(
      err instanceof Error ? err.message : "An unexpected network error occurred.",
      500
    );
  }
}

export const api = {
  health: {
    check: async (): Promise<{ status: "ok"; service: string; database: "ok" }> => {
      return request("/api/health");
    },
  },

  // -----------------------------------------------------------
  // Authentication & Profile
  // -----------------------------------------------------------
  auth: {
    login: async (credentials: { email: string; password: string }): Promise<AuthResponse> => {
      const response = await request<AuthResponse>("/api/auth/login", {
        method: "POST",
        body: JSON.stringify(credentials),
      });
      const res = assertAuthResponse(response);
      if (typeof window !== "undefined") {
        localStorage.setItem("eduai_token", res.access_token);
        localStorage.setItem("eduai_user", JSON.stringify(res.user));
      }
      return res;
    },

    register: async (payload: {
      email: string;
      password: string;
      full_name: string;
      education_level?: string;
      course?: string;
      year?: number;
      primary_interest?: string;
      career_goal?: string;
    }): Promise<AuthResponse> => {
      const response = await request<AuthResponse>("/api/auth/register", {
        method: "POST",
        body: JSON.stringify(payload),
      });
      const res = assertAuthResponse(response);
      if (typeof window !== "undefined") {
        localStorage.setItem("eduai_token", res.access_token);
        localStorage.setItem("eduai_user", JSON.stringify(res.user));
      }
      return res;
    },

    logout: () => {
      if (typeof window !== "undefined") {
        localStorage.removeItem("eduai_token");
        localStorage.removeItem("eduai_user");
      }
    },

    me: async (): Promise<{ user: User; profile: StudentProfile | null }> => {
      return request<{ user: User; profile: StudentProfile | null }>("/api/auth/me");
    },
  },

  // -----------------------------------------------------------
  // Student Profile
  // -----------------------------------------------------------
  student: {
    getProfile: async (): Promise<StudentProfile> => {
      return request<StudentProfile>("/api/student/profile");
    },
    updateProfile: async (data: Partial<StudentProfile>): Promise<StudentProfile> => {
      return request<StudentProfile>("/api/student/profile", {
        method: "PUT",
        body: JSON.stringify(data),
      });
    },
  },

  // -----------------------------------------------------------
  // Academic Intelligence (RandomForest ML Model)
  // -----------------------------------------------------------
  performance: {
    predict: async (data: AcademicPredictionRequest): Promise<AcademicPredictionResponse> => {
      return request<AcademicPredictionResponse>("/api/performance/predict", {
        method: "POST",
        body: JSON.stringify(data),
      });
    },
    getAnalytics: async () => {
      return request<{
        historical_predictions: AcademicPredictionResponse[];
        trend: "improving" | "stable" | "declining";
        attendance_rate: number;
        avg_study_hours: number;
      }>("/api/performance/analytics");
    },
  },

  // -----------------------------------------------------------
  // Career Intelligence (CatBoost ML Model)
  // -----------------------------------------------------------
  career: {
    recommend: async (data: CareerRecommendationRequest): Promise<{
      top_recommendations: CareerRecommendation[];
      identified_strengths: string[];
      suitability_score: number;
      method: string;
      provider: AIProviderId | null;
      model: string | null;
      disclaimer: string;
    }> => {
      return request("/api/career/recommend", {
        method: "POST",
        body: JSON.stringify(data),
      });
    },
    getRoadmap: async (careerTitle: string) => {
      return request<{
        career: string;
        phases: Array<{
          phase: number;
          title: string;
          duration_weeks: number;
          milestones: string[];
          projects: string[];
        }>;
      }>(`/api/career/roadmap?title=${encodeURIComponent(careerTitle)}`);
    },
  },

  // -----------------------------------------------------------
  // Skill Intelligence
  // -----------------------------------------------------------
  skills: {
    getGraph: async (): Promise<SkillGraphData> => {
      return request<SkillGraphData>("/api/skills/graph");
    },
    updateSkillLevel: async (skillId: string, level: number) => {
      return request(`/api/skills/${skillId}`, {
        method: "PATCH",
        body: JSON.stringify({ level }),
      });
    },
    getSkillGaps: async (targetCareer: string) => {
      return request<{
        mastered: string[];
        in_progress: string[];
        missing: string[];
        recommended_courses: Array<{ title: string; provider: string; url: string }>;
      }>(`/api/skills/gap?career=${encodeURIComponent(targetCareer)}`);
    },
  },

  // -----------------------------------------------------------
  // Learning & Study Studio (RAG)
  // -----------------------------------------------------------
  learning: {
    listDocuments: async (): Promise<DocumentSummary[]> => {
      return request<DocumentSummary[]>("/api/documents");
    },
    uploadDocument: async (file: File): Promise<DocumentSummary> => {
      const formData = new FormData();
      formData.append("file", file);
      return request<DocumentSummary>("/api/documents/upload", {
        method: "POST",
        body: formData,
      });
    },
    askDocument: async (documentId: string, question: string) => {
      return request<{
        answer: string;
        citations: Array<{ page: number; excerpt: string }>;
      }>("/api/documents/ask", {
        method: "POST",
        body: JSON.stringify({ document_id: documentId, question }),
      });
    },
    askDocumentWithAI: async (documentId: string, question: string) => {
      return request<{
        answer: string;
        citations: Array<{ page: number; excerpt: string }>;
        provider: AIProviderId;
        model: string;
      }>(`/api/documents/${encodeURIComponent(documentId)}/ask-ai`, {
        method: "POST",
        body: JSON.stringify({ question }),
      });
    },
    summarizeDocument: async (documentId: string) => {
      return request<{ summary: string; provider: "local"; model: string }>(
        `/api/documents/${encodeURIComponent(documentId)}/summarize`,
        { method: "POST" }
      );
    },
    generateFlashcards: async (documentId: string) => {
      return request<{ flashcards: Array<{ front: string; back: string }> }>(
        `/api/documents/${documentId}/flashcards`
      );
    },
  },

  // -----------------------------------------------------------
  // Quiz System
  // -----------------------------------------------------------
  quiz: {
    generateRandomBank: async (
      questionCount: number,
      difficulty: "Any" | "Easy" | "Medium" | "Hard"
    ): Promise<{ quiz_id: string; questions: QuizQuestion[] }> => {
      return request("/api/quiz/random-bank", {
        method: "POST",
        body: JSON.stringify({ question_count: questionCount, difficulty }),
      });
    },
    generateFromDocument: async (
      documentId: string,
      questionCount: number
    ): Promise<{ quiz_id: string; questions: QuizQuestion[] }> => {
      return request(`/api/documents/${encodeURIComponent(documentId)}/quiz`, {
        method: "POST",
        body: JSON.stringify({ question_count: questionCount }),
      });
    },
    generate: async (options: {
      topic: string;
      difficulty: "Easy" | "Medium" | "Hard";
      question_count: number;
    }): Promise<{ quiz_id: string; questions: QuizQuestion[] }> => {
      return request("/api/quiz/generate", {
        method: "POST",
        body: JSON.stringify(options),
      });
    },
    submit: async (quizId: string, answers: Record<string, number>): Promise<QuizResult> => {
      return request<QuizResult>("/api/quiz/submit", {
        method: "POST",
        body: JSON.stringify({ quiz_id: quizId, answers }),
      });
    },
    explainAnswer: async (quizId: string, questionId: string) => {
      return request<{
        explanation: string;
        is_correct: boolean;
        correct_answer: string;
        provider: AIProviderId;
        model: string;
      }>(`/api/quiz/${encodeURIComponent(quizId)}/questions/${encodeURIComponent(questionId)}/explain`, {
        method: "POST",
      });
    },
  },

  // -----------------------------------------------------------
  // Personal AI Agent
  // -----------------------------------------------------------
  agent: {
    execute: async (
      prompt: string,
      context?: Record<string, unknown>,
      conversationId?: string
    ): Promise<AgentMessage> => {
      return request<AgentMessage>("/api/agent/chat", {
        method: "POST",
        body: JSON.stringify({ prompt, context, conversation_id: conversationId }),
      });
    },
    getToolRegistry: async () => {
      return request<{ tools: Array<{ name: string; description: string; parameters: Record<string, unknown> }> }>(
        "/api/agent/tools"
      );
    },
  },

  ai: {
    summarize: async (text: string, language: "auto" | "English" | "Hindi" = "auto") => {
      return request<{ summary: string; provider: AIProviderId; model: string }>("/api/ai/summarize", {
        method: "POST",
        body: JSON.stringify({ text, language }),
      });
    },
    getProviderSettings: async () => {
      return request<{
        primary_provider: AIProviderId;
        fallback_provider: AIProviderId;
        providers: Array<{
          id: AIProviderId;
          name: string;
          enabled: boolean;
          configured: boolean;
          masked_credential: string;
          model: string;
          status: string;
          last_checked_at: string | null;
          last_error: string | null;
          usage: { request_count: number; error_count: number; average_response_time_ms: number };
        }>;
      }>("/api/admin/ai/settings");
    },
    saveProviderSettings: async (settings: {
      primary_provider: AIProviderId;
      fallback_provider: AIProviderId;
      providers: Array<{ provider: AIProviderId; enabled: boolean; model: string | null }>;
    }) => request<{ status: string }>("/api/admin/ai/settings", {
      method: "PUT",
      body: JSON.stringify(settings),
    }),
    testProvider: async (provider: AIProviderId) => {
      return request<{
        provider: AIProviderId;
        status: "connected";
        response_time_ms: number;
        models: string[];
      }>(`/api/admin/ai/providers/${provider}/test`, { method: "POST" });
    },
  },

  // -----------------------------------------------------------
  // Resume Intelligence
  // -----------------------------------------------------------
  resume: {
    analyze: async (file: File) => {
      const formData = new FormData();
      formData.append("file", file);
      return request<{
        ats_score: number;
        detected_skills: string[];
        missing_skills: string[];
        suggestions: string[];
        bullet_point_improvements: Array<{ original: string; improved: string; reason: string }>;
      }>("/api/resume/analyze", {
        method: "POST",
        body: formData,
      });
    },
    aiSuggestions: async (file: File) => {
      const formData = new FormData();
      formData.append("file", file);
      return request<{
        filename: string;
        suggestions: string;
        provider: AIProviderId;
        model: string;
      }>("/api/resume/ai-suggestions", {
        method: "POST",
        body: formData,
      });
    },
  },

  // -----------------------------------------------------------
  // Mock Interview
  // -----------------------------------------------------------
  interview: {
    start: async (role: string, type: "Technical" | "HR" | "Behavioral") => {
      return request<{ session_id: string; first_question: string }>("/api/interview/start", {
        method: "POST",
        body: JSON.stringify({ role, type }),
      });
    },
    respond: async (sessionId: string, answerText: string) => {
      return request<{
        feedback: {
          clarity: number;
          technical_accuracy: number;
          confidence_indicator: string;
          notes: string[];
        };
        next_question?: string;
        is_complete: boolean;
      }>("/api/interview/respond", {
        method: "POST",
        body: JSON.stringify({ session_id: sessionId, answer: answerText }),
      });
    },
  },

  // -----------------------------------------------------------
  // Jobs & Internship Intelligence
  // -----------------------------------------------------------
  jobs: {
    recommend: async (data: JobRoleRecommendationRequest) => {
      return request<{
        roles: JobRoleRecommendation[];
        provider: AIProviderId;
        model: string;
        disclaimer: string;
      }>("/api/jobs/recommend", {
        method: "POST",
        body: JSON.stringify(data),
      });
    },
    search: async (query: string, location?: string) => {
      return request<{
        jobs: Array<{
          id: string;
          title: string;
          company: string;
          location: string;
          salary_estimate: string;
          match_percentage: number;
          matched_skills: string[];
          missing_skills: string[];
          apply_url: string;
        }>;
      }>(`/api/jobs/search?q=${encodeURIComponent(query)}&loc=${encodeURIComponent(location || "")}`);
    },
  },

  // -----------------------------------------------------------
  // Goals & Habits
  // -----------------------------------------------------------
  goals: {
    list: async () => request<Array<{ id: string; title: string; progress: number; deadline: string; tasks: string[] }>>("/api/goals"),
    create: async (data: { title: string; target_date: string; milestones: string[] }) =>
      request("/api/goals", { method: "POST", body: JSON.stringify(data) }),
  },
  habits: {
    list: async () => request<Array<{ id: string; name: string; streak_days: number; completed_today: boolean }>>("/api/habits"),
    toggle: async (habitId: string) => request(`/api/habits/${habitId}/toggle`, { method: "POST" }),
  },
};
