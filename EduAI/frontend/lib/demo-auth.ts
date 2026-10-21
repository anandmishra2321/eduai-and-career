export const DEMO_SESSION_KEY = "eduai_offline_demo";

export const DEMO_USER = {
  id: "eduai-offline-demo",
  email: "offline-demo@eduai.local",
  full_name: "Demo Student",
  role: "student" as const,
  created_at: "1970-01-01T00:00:00.000Z",
};

export const DEMO_PROFILE = {
  id: "eduai-offline-demo-profile",
  user_id: DEMO_USER.id,
  education_level: "",
  course: "",
  year: 0,
  primary_interest: "",
  career_goal: "",
  created_at: "1970-01-01T00:00:00.000Z",
};

export function isOfflineDemoSession(): boolean {
  return typeof window !== "undefined"
    && window.sessionStorage.getItem(DEMO_SESSION_KEY) === "true";
}
