/**
 * EduAI Core Type Definitions
 */

export interface User {
  id: string;
  email: string;
  full_name: string;
  role: "student" | "mentor" | "admin";
  created_at: string;
}

export interface StudentProfile {
  id: string;
  user_id: string;
  education_level: string;
  course: string;
  year: number;
  primary_interest: string;
  career_goal: string;
  institution?: string;
  cgpa?: number;
  attendance?: number;
  study_hours_weekly?: number;
  preferences?: Record<string, unknown>;
  created_at: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user: User;
  profile?: StudentProfile;
}

// -------------------------------------------------------------
// Academic Intelligence Types
// -------------------------------------------------------------
export interface AcademicPredictionRequest {
  study_hours: number;
  attendance: number;
  assignments: number;
  internal_marks: number;
  test_score: number;
}

export interface AcademicPredictionResponse {
  predicted_final_marks: number;
  performance_level: "Exceptional" | "Proficient" | "Average" | "At Risk";
  prediction_method: string;
  risk_factors: string[];
  recommendations: string[];
}

// -------------------------------------------------------------
// Career Intelligence Types
// -------------------------------------------------------------
export type AIProviderId = "gemini" | "openai" | "sambanova" | "cohere";

export interface CareerRecommendationRequest {
  education_level: string;
  specialization: string;
  skills: string[];
  certifications: string[];
  cgpa_percentage: number;
  consent_to_ai_processing?: boolean;
  intelligences?: {
    linguistic?: number;
    musical?: number;
    bodily?: number;
    logical_mathematical?: number;
    spatial_visualization?: number;
    interpersonal?: number;
    intrapersonal?: number;
    naturalist?: number;
  };
}

export interface CareerRecommendation {
  career_title: string;
  recommendation_score: number; // 0 - 100
  category: string;
  fit_reason: string;
  key_prerequisites: string[];
  skills_to_build: string[];
  market_demand: string;
  median_salary_range: string;
  roadmap_summary: string;
}

export interface JobRoleRecommendationRequest {
  query: string;
  location?: string;
  education_level?: string;
  skills?: string[];
  certifications?: string[];
  consent_to_ai_processing: boolean;
}

export interface JobRoleRecommendation {
  title: string;
  fit_reason: string;
  skills_to_build: string[];
  search_query: string;
}

export interface CareerRoadmapPhase {
  phase: number;
  title: string;
  duration_weeks: number;
  milestones: string[];
  recommended_projects: string[];
  certifications: string[];
}

// -------------------------------------------------------------
// Skills Intelligence Types
// -------------------------------------------------------------
export type SkillStatus = "mastered" | "learning" | "weak" | "required";

export interface SkillNode {
  id: string;
  name: string;
  category: string;
  level: number; // 1 - 5
  required_level: number;
  status: SkillStatus;
  gap: number;
  projects: string[];
  resources: string[];
  coordinates?: [number, number, number]; // 3D coordinates in constellation
}

export interface SkillGraphData {
  skills: SkillNode[];
  edges: { source: string; target: string; strength: number }[];
}

// -------------------------------------------------------------
// Study & Learning RAG Types
// -------------------------------------------------------------
export interface DocumentSummary {
  id: string;
  filename: string;
  file_type: string;
  summary: string;
  key_concepts: string[];
  definitions: { term: string; explanation: string }[];
  important_questions: string[];
  flashcards: { front: string; back: string }[];
  mind_map_json?: Record<string, unknown>;
}

// -------------------------------------------------------------
// Quiz System Types
// -------------------------------------------------------------
export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  difficulty: "Easy" | "Medium" | "Hard";
  topic: string;
}

export interface QuizResult {
  score: number;
  total_questions: number;
  accuracy: number;
  time_seconds: number;
  weak_topics: string[];
  strong_topics: string[];
  recommended_actions: string[];
}

// -------------------------------------------------------------
// Agent & Conversation Types
// -------------------------------------------------------------
export interface AgentMessage {
  id: string;
  sender: "user" | "agent" | "system";
  text: string;
  timestamp: string;
  conversation_id?: string;
  provider?: AIProviderId;
  model?: string;
  suggested_actions?: string[];
  tool_executed?: string;
  tool_result?: Record<string, unknown>;
}

// -------------------------------------------------------------
// 3D Scene Navigation
// -------------------------------------------------------------
export type EduAIScene =
  | "intro"
  | "academic"
  | "skills"
  | "career"
  | "learning"
  | "agent"
  | "auth"
  | "dashboard";

export interface CameraWaypoint {
  progress: number;
  position: [number, number, number];
  target: [number, number, number];
  fov: number;
  scene: EduAIScene;
}
