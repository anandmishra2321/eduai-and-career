import type { Metadata } from "next";
import { cookies } from "next/headers";
import { ProjectInformationGate } from "@/components/project-info/ProjectInformationGate";
import ProjectInformationContent from "@/components/project-info/ProjectInformationContent";
import {
  PROJECT_INFO_COOKIE,
  projectInfoGateConfigured,
  verifyProjectInfoSession,
} from "@/lib/project-info-auth";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata: Metadata = {
  title: "Restricted Project Information | EduAI",
  robots: { index: false, follow: false },
};

export default async function ProjectInformationPage() {
  const configured = projectInfoGateConfigured();
  const cookieStore = await cookies();
  const authorized = configured
    && verifyProjectInfoSession(cookieStore.get(PROJECT_INFO_COOKIE)?.value);

  return authorized ? <ProjectInformationContent /> : <ProjectInformationGate />;
}
