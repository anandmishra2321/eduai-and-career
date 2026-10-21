import { NextRequest, NextResponse } from "next/server";
import { projectInformationMarkdown } from "@/lib/project-information";
import { PROJECT_INFO_COOKIE, verifyProjectInfoSession } from "@/lib/project-info-auth";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  if (!verifyProjectInfoSession(request.cookies.get(PROJECT_INFO_COOKIE)?.value)) {
    return NextResponse.json({ error: "Project Information session is not authorized." }, {
      status: 401,
      headers: { "Cache-Control": "no-store" },
    });
  }

  return new NextResponse(projectInformationMarkdown(), {
    headers: {
      "Cache-Control": "private, no-store, max-age=0",
      "Content-Disposition": 'attachment; filename="eduai-project-information.md"',
      "Content-Type": "text/markdown; charset=utf-8",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
