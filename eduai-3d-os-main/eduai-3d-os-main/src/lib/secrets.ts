/**
 * EduAI Secrets Management
 * Server-side secure access to API keys and secrets
 * NEVER import this file in client-side components
 */

// ============================================
// Secret Configuration Schema
// ============================================

export interface SecretConfig {
  key: string;
  name: string;
  description: string;
  required: boolean;
  category: "ai" | "job" | "data" | "database" | "auth";
  documentationUrl?: string;
  provider: string;
}

export const SECRET_REGISTRY: SecretConfig[] = [
  // AI Providers
  {
    key: "GEMINI_API_KEY",
    name: "Google Gemini API Key",
    description: "API key for Google Gemini AI models",
    required: false,
    category: "ai",
    provider: "gemini",
    documentationUrl: "https://ai.google.dev/docs",
  },
  {
    key: "OPENAI_API_KEY",
    name: "OpenAI API Key",
    description: "API key for OpenAI GPT models",
    required: false,
    category: "ai",
    provider: "openai",
    documentationUrl: "https://platform.openai.com/docs",
  },
  {
    key: "ANTHROPIC_API_KEY",
    name: "Anthropic API Key",
    description: "API key for Anthropic Claude models",
    required: false,
    category: "ai",
    provider: "anthropic",
    documentationUrl: "https://docs.anthropic.com",
  },

  // Job Providers
  {
    key: "ADZUNA_APP_ID",
    name: "Adzuna App ID",
    description: "Application ID for Adzuna job search API",
    required: false,
    category: "job",
    provider: "adzuna",
    documentationUrl: "https://developer.adzuna.com",
  },
  {
    key: "ADZUNA_APP_KEY",
    name: "Adzuna App Key",
    description: "Application key for Adzuna job search API",
    required: false,
    category: "job",
    provider: "adzuna",
    documentationUrl: "https://developer.adzuna.com",
  },
  {
    key: "JOOBLE_API_KEY",
    name: "Jooble API Key",
    description: "API key for Jooble job search API",
    required: false,
    category: "job",
    provider: "jooble",
    documentationUrl: "https://jooble.org/api",
  },

  // Data Providers
  {
    key: "YOUTUBE_API_KEY",
    name: "YouTube Data API Key",
    description: "API key for YouTube Data API",
    required: false,
    category: "data",
    provider: "youtube",
    documentationUrl: "https://developers.google.com/youtube/v3",
  },

  // Database
  {
    key: "DATABASE_URL",
    name: "Database URL",
    description: "Connection string for the database",
    required: true,
    category: "database",
    provider: "database",
  },

  // Authentication
  {
    key: "JWT_SECRET",
    name: "JWT Secret",
    description: "Secret key for JWT token signing",
    required: true,
    category: "auth",
    provider: "auth",
  },
  {
    key: "SESSION_SECRET",
    name: "Session Secret",
    description: "Secret key for session encryption",
    required: true,
    category: "auth",
    provider: "auth",
  },
];

// ============================================
// Secrets Access (Server-Side Only)
// ============================================

/**
 * Get a secret value from environment variables
 * This function should ONLY be called from server-side code
 */
export function getSecret(key: string): string | undefined {
  if (typeof process === "undefined" || typeof process.env === "undefined") {
    throw new Error("getSecret can only be called from server-side code");
  }

  return process.env[key];
}

/**
 * Get a required secret or throw an error
 */
export function getRequiredSecret(key: string): string {
  const value = getSecret(key);
  if (!value) {
    throw new Error(`Required secret ${key} is not set in environment variables`);
  }
  return value;
}

/**
 * Check if a secret is configured
 */
export function hasSecret(key: string): boolean {
  return !!getSecret(key);
}

/**
 * Get all configured secrets by category
 */
export function getSecretsByCategory(category: SecretConfig["category"]): Record<string, string> {
  const secrets: Record<string, string> = {};
  
  SECRET_REGISTRY
    .filter((config) => config.category === category && hasSecret(config.key))
    .forEach((config) => {
      secrets[config.key] = getSecret(config.key) || "";
    });

  return secrets;
}

/**
 * Get all configured secrets by provider
 */
export function getSecretsByProvider(provider: string): Record<string, string> {
  const secrets: Record<string, string> = {};
  
  SECRET_REGISTRY
    .filter((config) => config.provider === provider && hasSecret(config.key))
    .forEach((config) => {
      secrets[config.key] = getSecret(config.key) || "";
    });

  return secrets;
}

// ============================================
// Secret Validation
// ============================================

export interface SecretValidationResult {
  key: string;
  name: string;
  configured: boolean;
  required: boolean;
  category: string;
  provider: string;
  error: string | null;
}

export function validateSecrets(): SecretValidationResult[] {
  return SECRET_REGISTRY.map((config) => {
    const configured = hasSecret(config.key);
    const error = config.required && !configured 
      ? "Required secret is not configured" 
      : null;

    return {
      key: config.key,
      name: config.name,
      configured,
      required: config.required,
      category: config.category,
      provider: config.provider,
      error,
    };
  });
}

export function getMissingRequiredSecrets(): SecretConfig[] {
  return SECRET_REGISTRY.filter(
    (config) => config.required && !hasSecret(config.key)
  );
}

export function getOptionalSecretsStatus(): Array<{ config: SecretConfig; configured: boolean }> {
  return SECRET_REGISTRY
    .filter((config) => !config.required)
    .map((config) => ({
      config,
      configured: hasSecret(config.key),
    }));
}

// ============================================
// Security Scanner
// ============================================

export interface SecurityScanResult {
  passed: boolean;
  issues: SecurityIssue[];
}

export interface SecurityIssue {
  severity: "critical" | "high" | "medium" | "low";
  message: string;
  location?: string;
  recommendation?: string;
}

/**
 * Scan for potential security issues with secrets
 * This should be run during build time or startup
 */
export function scanSecretsSecurity(): SecurityScanResult {
  const issues: SecurityIssue[] = [];

  // Check if running in server environment
  if (typeof process !== "undefined" && process.env) {
    // Check for secrets in client-accessible environment variables
    const clientEnvPrefixes = ["NEXT_PUBLIC_", "VITE_", "PUBLIC_"];
    
    SECRET_REGISTRY.forEach((config) => {
      clientEnvPrefixes.forEach((prefix) => {
        const clientKey = `${prefix}${config.key}`;
        if (process.env[clientKey]) {
          issues.push({
            severity: "critical",
            message: `Secret ${config.key} is exposed via ${clientKey} environment variable`,
            location: `Environment variable: ${clientKey}`,
            recommendation: `Remove ${clientKey} and use server-side only environment variable ${config.key}`,
          });
        }
      });
    });

    // Check for hardcoded secrets in environment values
    SECRET_REGISTRY.forEach((config) => {
      const value = process.env[config.key];
      if (value) {
        // Check for suspicious patterns
        if (value.includes("sk-") && config.key.includes("API_KEY")) {
          issues.push({
            severity: "high",
            message: `Potential API key pattern detected in ${config.key}`,
            location: `Environment variable: ${config.key}`,
            recommendation: "Ensure this is a valid API key and not a placeholder",
          });
        }
      }
    });
  }

  return {
    passed: issues.filter((i) => i.severity === "critical" || i.severity === "high").length === 0,
    issues,
  };
}

// ============================================
// Integration Setup Guide
// ============================================

export function generateIntegrationSetupGuide(): string {
  const guide = [
    "# EduAI Integration Setup Guide",
    "",
    "This guide lists all required and optional API keys and secrets needed to run EduAI.",
    "",
    "## Required Secrets",
    "",
    ...SECRET_REGISTRY
      .filter((config) => config.required)
      .map((config) => [
        `### ${config.name}`,
        "",
        `- **Environment Variable:** \`${config.key}\``,
        `- **Category:** ${config.category}`,
        `- **Description:** ${config.description}`,
        config.documentationUrl ? `- **Documentation:** ${config.documentationUrl}` : "",
        "",
      ].join("\n")),
    "",
    "## Optional Secrets",
    "",
    ...SECRET_REGISTRY
      .filter((config) => !config.required)
      .map((config) => [
        `### ${config.name}`,
        "",
        `- **Environment Variable:** \`${config.key}\``,
        `- **Category:** ${config.category}`,
        `- **Provider:** ${config.provider}`,
        `- **Description:** ${config.description}`,
        config.documentationUrl ? `- **Documentation:** ${config.documentationUrl}` : "",
        "",
      ].join("\n")),
    "",
    "## Setup Instructions",
    "",
    "1. Create a `.env` file in the project root",
    "2. Add the required secrets from the list above",
    "3. Add any optional secrets you want to use",
    "4. Restart the development server",
    "",
    "## Security Notes",
    "",
    "- **NEVER** commit `.env` files to version control",
    "- **NEVER** expose secrets via client-side environment variables (NEXT_PUBLIC_*)",
    "- Use different API keys for development and production",
    "- Rotate API keys regularly",
    "- Monitor API usage for unusual activity",
    "",
  ].join("\n");

  return guide;
}

// ============================================
// Provider Availability Check
// ============================================

export interface ProviderAvailability {
  provider: string;
  available: boolean;
  missingSecrets: string[];
}

export function checkProviderAvailability(provider: string): ProviderAvailability {
  const providerSecrets = SECRET_REGISTRY.filter((config) => config.provider === provider);
  const missingSecrets = providerSecrets
    .filter((config) => config.required && !hasSecret(config.key))
    .map((config) => config.key);

  return {
    provider,
    available: missingSecrets.length === 0,
    missingSecrets,
  };
}

export function getAllProvidersAvailability(): ProviderAvailability[] {
  const providers = Array.from(new Set(SECRET_REGISTRY.map((config) => config.provider)));
  return providers.map((provider) => checkProviderAvailability(provider));
}
