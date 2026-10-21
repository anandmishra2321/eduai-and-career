import { createHash, createHmac, randomBytes, timingSafeEqual } from "node:crypto";

export const PROJECT_INFO_COOKIE = "eduai_project_info_session";
export const PROJECT_INFO_SESSION_MAX_AGE = 60 * 60;

const PASSWORD_ENV = "PROJECT_INFO_PASSWORD";
const SESSION_SECRET_ENV = "PROJECT_INFO_SESSION_SECRET";

export function projectInfoGateConfigured(): boolean {
  return Boolean(
    process.env[PASSWORD_ENV]
    && process.env[SESSION_SECRET_ENV]
    && (process.env[SESSION_SECRET_ENV]?.length ?? 0) >= 32
  );
}

function sign(payload: string, secret: string): string {
  return createHmac("sha256", secret).update(payload).digest("base64url");
}

export function verifyProjectInfoPassword(input: unknown): boolean {
  const expected = process.env[PASSWORD_ENV];
  if (!expected || typeof input !== "string") return false;

  const expectedDigest = createHash("sha256").update(expected).digest();
  const inputDigest = createHash("sha256").update(input).digest();
  return timingSafeEqual(expectedDigest, inputDigest);
}

export function createProjectInfoSession(): string {
  const secret = process.env[SESSION_SECRET_ENV];
  if (!secret || secret.length < 32) {
    throw new Error(`${SESSION_SECRET_ENV} must contain at least 32 characters.`);
  }

  const expiresAt = Math.floor(Date.now() / 1000) + PROJECT_INFO_SESSION_MAX_AGE;
  const payload = `${expiresAt}.${randomBytes(24).toString("base64url")}`;
  return `${payload}.${sign(payload, secret)}`;
}

export function verifyProjectInfoSession(value: string | undefined): boolean {
  const secret = process.env[SESSION_SECRET_ENV];
  if (!value || !secret || secret.length < 32) return false;

  const [expiresAtText, nonce, signature, extra] = value.split(".");
  if (!expiresAtText || !nonce || !signature || extra !== undefined) return false;

  const expiresAt = Number(expiresAtText);
  if (!Number.isSafeInteger(expiresAt) || expiresAt <= Math.floor(Date.now() / 1000)) return false;

  const payload = `${expiresAtText}.${nonce}`;
  const expected = Buffer.from(sign(payload, secret));
  const actual = Buffer.from(signature);
  return expected.length === actual.length && timingSafeEqual(expected, actual);
}
