import { NextRequest, NextResponse } from "next/server";
import {
  createProjectInfoSession,
  PROJECT_INFO_COOKIE,
  PROJECT_INFO_SESSION_MAX_AGE,
  projectInfoGateConfigured,
  verifyProjectInfoPassword,
} from "@/lib/project-info-auth";

export const runtime = "nodejs";

const attemptsByClient = new Map<string, { attempts: number; resetAt: number }>();
const MAX_ATTEMPTS = 8;
const WINDOW_MS = 15 * 60 * 1000;

function clientKey(request: NextRequest): string {
  return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
    || request.headers.get("x-real-ip")
    || "local";
}

function rateLimitedResponse(retryAfterSeconds: number) {
  return NextResponse.json(
    { error: "Too many attempts. Wait before trying again." },
    { status: 429, headers: { "Retry-After": String(retryAfterSeconds) } }
  );
}

export async function POST(request: NextRequest) {
  if (!projectInfoGateConfigured()) {
    return NextResponse.json(
      { error: "Project Information access is not configured. Set the server environment values and restart the app." },
      { status: 503 }
    );
  }

  const now = Date.now();
  if (attemptsByClient.size > 1000) {
    for (const [client, state] of attemptsByClient) {
      if (state.resetAt <= now) attemptsByClient.delete(client);
    }
  }
  const key = clientKey(request);
  const current = attemptsByClient.get(key);
  if (current && current.resetAt <= now) attemptsByClient.delete(key);
  const active = attemptsByClient.get(key);
  if (active && active.attempts >= MAX_ATTEMPTS) {
    return rateLimitedResponse(Math.max(1, Math.ceil((active.resetAt - now) / 1000)));
  }

  const contentLength = Number(request.headers.get("content-length") ?? 0);
  if (contentLength > 4096) {
    return NextResponse.json({ error: "Request is too large." }, { status: 413 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Send a valid JSON request." }, { status: 400 });
  }

  const password = body && typeof body === "object" && "password" in body
    ? (body as { password?: unknown }).password
    : undefined;
  if (!verifyProjectInfoPassword(password)) {
    attemptsByClient.set(key, {
      attempts: (active?.attempts ?? 0) + 1,
      resetAt: active?.resetAt ?? now + WINDOW_MS,
    });
    return NextResponse.json({ error: "Password was not accepted." }, { status: 401 });
  }

  attemptsByClient.delete(key);
  const response = NextResponse.json({ ok: true });
  response.cookies.set(PROJECT_INFO_COOKIE, createProjectInfoSession(), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: PROJECT_INFO_SESSION_MAX_AGE,
  });
  response.headers.set("Cache-Control", "no-store");
  return response;
}

export async function DELETE() {
  const response = NextResponse.json({ ok: true });
  response.cookies.set(PROJECT_INFO_COOKIE, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: 0,
  });
  response.headers.set("Cache-Control", "no-store");
  return response;
}
