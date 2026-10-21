export const PROJECT_INFORMATION = {
  name: "EduAI",
  fullName: "EduAI — AI-Powered Personalized Learning, Performance & Career Intelligence Platform",
  overview:
    "A personalized learning and career-intelligence workspace combining academic support, study tools, skill development, and career guidance.",
  problem:
    "Learning progress, academic performance, and career planning often live in separate tools, making it harder for learners to connect them.",
  objectives: [
    "Bring study, performance, skills, and career tools into one learner workspace.",
    "Provide personalized features through existing EduAI API integrations when configured.",
    "Support interactive 3D learning experiences with accessible alternatives.",
  ],
  targetUsers: ["Students and lifelong learners"],
  innovations: [
    "A cinematic, interactive 3D learning workspace.",
    "A shared interface for academic, skills, study, and career intelligence.",
  ],
  stack: [
    "Next.js 15.1 (configured dependency range)",
    "React 19 (configured dependency range)",
    "TypeScript 5.6 (configured development dependency range)",
    "Tailwind CSS 3.4",
    "Three.js 0.170 with React Three Fiber 9",
    "Recharts 2.13",
  ],
  modelNotes: [
    "Performance API client is documented as using RandomForest; model version and training details are Not configured.",
    "Career API client is documented as using CatBoost; model version and training details are Not configured.",
  ],
  apiRoutes: [
    "Authentication and student profile",
    "Performance predictions and analytics",
    "Career recommendations and roadmaps",
    "Skills graph and skill gaps",
    "Document upload, questions, and flashcards",
    "Quiz generation and submission",
    "AI agent chat and tool registry",
    "Resume analysis and mock interviews",
    "Job search, goals, and habits",
  ],
};

export function projectInformationMarkdown() {
  return [
    `# ${PROJECT_INFORMATION.fullName}`,
    "",
    "## Overview",
    PROJECT_INFORMATION.overview,
    "",
    "## Problem statement",
    PROJECT_INFORMATION.problem,
    "",
    "## Objectives",
    ...PROJECT_INFORMATION.objectives.map((item) => `- ${item}`),
    "",
    "## Target users",
    ...PROJECT_INFORMATION.targetUsers.map((item) => `- ${item}`),
    "",
    "## Key innovations",
    ...PROJECT_INFORMATION.innovations.map((item) => `- ${item}`),
    "",
    "## Team, institution, and mentor",
    "Not configured.",
    "",
    "## Frontend technology stack",
    ...PROJECT_INFORMATION.stack.map((item) => `- ${item}`),
    "",
    "## AI models",
    ...PROJECT_INFORMATION.modelNotes.map((item) => `- ${item}`),
    "",
    "## Datasets, training, evaluation, and limitations",
    "Not configured in this frontend project.",
    "",
    "## API integrations",
    ...PROJECT_INFORMATION.apiRoutes.map((item) => `- ${item} — connection status not verified`),
    "",
    "## Database, deployment, and service health",
    "Not configured / not verified.",
    "",
    "## Documentation and project artifacts",
    "User guide, architecture diagram, model report, and changelog: Not configured.",
    "",
    "Generated from verified frontend project configuration. No credentials or private profile data are included.",
  ].join("\n");
}

export function downloadProjectInformationMarkdown() {
  const file = new Blob([projectInformationMarkdown()], { type: "text/markdown;charset=utf-8" });
  const url = URL.createObjectURL(file);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = "eduai-project-information.md";
  anchor.click();
  URL.revokeObjectURL(url);
}
