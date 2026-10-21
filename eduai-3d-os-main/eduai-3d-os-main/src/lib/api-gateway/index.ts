/**
 * EduAI API Gateway
 * Centralized provider management, connection statuses, timeouts, retries, and rate limiting
 */

// ============================================
// Types & Interfaces
// ============================================

export type ProviderStatus = "connected" | "disconnected" | "error" | "rate_limited" | "unknown";

export interface ProviderConfig {
  id: string;
  name: string;
  baseUrl?: string;
  timeout: number;
  maxRetries: number;
  retryDelay: number;
  rateLimit?: {
    requestsPerMinute: number;
    requestsPerHour: number;
  };
  enabled: boolean;
  requiresAuth: boolean;
  authType?: "bearer" | "apiKey" | "oauth" | "none";
  category: "ai" | "job" | "data" | "document" | "ml";
}

export interface ProviderHealth {
  providerId: string;
  status: ProviderStatus;
  lastChecked: Date;
  latency: number | null;
  errorCount: number;
  lastError: string | null;
  rateLimitRemaining: number | null;
  rateLimitReset: Date | null;
}

export interface NormalizedResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  provider: string;
  latency: number;
  cached: boolean;
  timestamp: Date;
}

export interface RequestOptions {
  timeout?: number;
  retries?: number;
  signal?: AbortSignal;
  cache?: boolean;
  cacheTTL?: number;
}

// ============================================
// Provider Registry
// ============================================

export const PROVIDER_REGISTRY: Record<string, ProviderConfig> = {
  // AI Providers
  gemini: {
    id: "gemini",
    name: "Google Gemini",
    timeout: 30000,
    maxRetries: 3,
    retryDelay: 1000,
    rateLimit: {
      requestsPerMinute: 60,
      requestsPerHour: 1500,
    },
    enabled: true,
    requiresAuth: true,
    authType: "apiKey",
    category: "ai",
  },
  openai: {
    id: "openai",
    name: "OpenAI",
    timeout: 30000,
    maxRetries: 3,
    retryDelay: 1000,
    rateLimit: {
      requestsPerMinute: 3500,
      requestsPerHour: 90000,
    },
    enabled: true,
    requiresAuth: true,
    authType: "apiKey",
    category: "ai",
  },
  anthropic: {
    id: "anthropic",
    name: "Anthropic Claude",
    timeout: 30000,
    maxRetries: 3,
    retryDelay: 1000,
    rateLimit: {
      requestsPerMinute: 50,
      requestsPerHour: 1000,
    },
    enabled: true,
    requiresAuth: true,
    authType: "apiKey",
    category: "ai",
  },

  // Job Providers
  adzuna: {
    id: "adzuna",
    name: "Adzuna",
    baseUrl: "https://api.adzuna.com/v1/api/jobs",
    timeout: 15000,
    maxRetries: 2,
    retryDelay: 2000,
    rateLimit: {
      requestsPerMinute: 100,
      requestsPerHour: 2000,
    },
    enabled: true,
    requiresAuth: true,
    authType: "apiKey",
    category: "job",
  },
  jooble: {
    id: "jooble",
    name: "Jooble",
    baseUrl: "https://jooble.org/api",
    timeout: 15000,
    maxRetries: 2,
    retryDelay: 2000,
    rateLimit: {
      requestsPerMinute: 50,
      requestsPerHour: 1000,
    },
    enabled: true,
    requiresAuth: true,
    authType: "apiKey",
    category: "job",
  },

  // Data Providers
  youtube: {
    id: "youtube",
    name: "YouTube Data API",
    baseUrl: "https://www.googleapis.com/youtube/v3",
    timeout: 10000,
    maxRetries: 2,
    retryDelay: 1000,
    rateLimit: {
      requestsPerMinute: 100,
      requestsPerHour: 10000,
    },
    enabled: true,
    requiresAuth: true,
    authType: "apiKey",
    category: "data",
  },

  // Document Providers
  pdfParser: {
    id: "pdfParser",
    name: "PDF Parser Service",
    timeout: 30000,
    maxRetries: 2,
    retryDelay: 1000,
    enabled: true,
    requiresAuth: false,
    authType: "none",
    category: "document",
  },
};

// ============================================
// Rate Limiter
// ============================================

class RateLimiter {
  private requests: Map<string, number[]> = new Map();

  canRequest(providerId: string, limit: number, windowMs: number): boolean {
    const now = Date.now();
    const requests = this.requests.get(providerId) || [];
    
    // Remove requests outside the time window
    const validRequests = requests.filter((time) => now - time < windowMs);
    this.requests.set(providerId, validRequests);

    return validRequests.length < limit;
  }

  recordRequest(providerId: string): void {
    const requests = this.requests.get(providerId) || [];
    requests.push(Date.now());
    this.requests.set(providerId, requests);
  }

  getRemaining(providerId: string, limit: number, windowMs: number): number {
    const now = Date.now();
    const requests = this.requests.get(providerId) || [];
    const validRequests = requests.filter((time) => now - time < windowMs);
    return Math.max(0, limit - validRequests.length);
  }

  getResetTime(providerId: string, windowMs: number): Date {
    const requests = this.requests.get(providerId) || [];
    if (requests.length === 0) return new Date();
    const oldestRequest = Math.min(...requests);
    return new Date(oldestRequest + windowMs);
  }
}

export const rateLimiter = new RateLimiter();

// ============================================
// Health Monitor
// ============================================

class HealthMonitor {
  private health: Map<string, ProviderHealth> = new Map();

  updateHealth(providerId: string, status: ProviderStatus, latency: number | null = null, error: string | null = null): void {
    const existing = this.health.get(providerId);
    this.health.set(providerId, {
      providerId,
      status,
      lastChecked: new Date(),
      latency,
      errorCount: error ? (existing?.errorCount || 0) + 1 : 0,
      lastError: error,
      rateLimitRemaining: existing?.rateLimitRemaining ?? null,
      rateLimitReset: existing?.rateLimitReset ?? null,
    });
  }

  getHealth(providerId: string): ProviderHealth | undefined {
    return this.health.get(providerId);
  }

  getAllHealth(): ProviderHealth[] {
    return Array.from(this.health.values());
  }

  updateRateLimit(providerId: string, remaining: number, reset: Date): void {
    const existing = this.health.get(providerId);
    if (existing) {
      this.health.set(providerId, {
        ...existing,
        rateLimitRemaining: remaining,
        rateLimitReset: reset,
      });
    }
  }
}

export const healthMonitor = new HealthMonitor();

// ============================================
// Request Executor with Retries
// ============================================

async function executeWithRetry<T>(
  fn: () => Promise<T>,
  config: ProviderConfig,
  options: RequestOptions = {}
): Promise<T> {
  const maxRetries = options.retries ?? config.maxRetries;
  const retryDelay = config.retryDelay;
  const timeout = options.timeout ?? config.timeout;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      if (options.signal) {
        options.signal.addEventListener("abort", () => controller.abort());
      }

      const result = await fn();
      clearTimeout(timeoutId);
      return result;
    } catch (error) {
      if (attempt === maxRetries) {
        throw error;
      }

      // Exponential backoff
      const delay = retryDelay * Math.pow(2, attempt);
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  throw new Error("Max retries exceeded");
}

// ============================================
// API Gateway Main Class
// ============================================

export class APIGateway {
  private cache: Map<string, { data: unknown; expiry: Date }> = new Map();

  /**
   * Execute a request to a provider
   */
  async request<T>(
    providerId: string,
    requestFn: () => Promise<T>,
    options: RequestOptions = {}
  ): Promise<NormalizedResponse<T>> {
    const config = PROVIDER_REGISTRY[providerId];
    if (!config) {
      return {
        success: false,
        error: `Unknown provider: ${providerId}`,
        provider: providerId,
        latency: 0,
        cached: false,
        timestamp: new Date(),
      };
    }

    if (!config.enabled) {
      return {
        success: false,
        error: `Provider ${providerId} is disabled`,
        provider: providerId,
        latency: 0,
        cached: false,
        timestamp: new Date(),
      };
    }

    // Check rate limit
    if (config.rateLimit) {
      const canRequest = rateLimiter.canRequest(
        providerId,
        config.rateLimit.requestsPerMinute,
        60000
      );

      if (!canRequest) {
        const remaining = rateLimiter.getRemaining(
          providerId,
          config.rateLimit.requestsPerMinute,
          60000
        );
        const reset = rateLimiter.getResetTime(providerId, 60000);

        healthMonitor.updateRateLimit(providerId, remaining, reset);
        healthMonitor.updateHealth(providerId, "rate_limited");

        return {
          success: false,
          error: `Rate limit exceeded for ${providerId}. Reset at ${reset.toISOString()}`,
          provider: providerId,
          latency: 0,
          cached: false,
          timestamp: new Date(),
        };
      }
    }

    const startTime = Date.now();

    try {
      // Check cache if enabled
      const cacheKey = `${providerId}-${JSON.stringify(options)}`;
      if (options.cache !== false) {
        const cached = this.cache.get(cacheKey);
        if (cached && cached.expiry > new Date()) {
          return {
            success: true,
            data: cached.data as T,
            provider: providerId,
            latency: Date.now() - startTime,
            cached: true,
            timestamp: new Date(),
          };
        }
      }

      // Execute request with retries
      const data = await executeWithRetry(requestFn, config, options);

      // Record rate limit usage
      if (config.rateLimit) {
        rateLimiter.recordRequest(providerId);
      }

      // Update health
      const latency = Date.now() - startTime;
      healthMonitor.updateHealth(providerId, "connected", latency);

      // Cache result if enabled
      if (options.cache !== false) {
        const ttl = options.cacheTTL || 300000; // Default 5 minutes
        this.cache.set(cacheKey, {
          data,
          expiry: new Date(Date.now() + ttl),
        });
      }

      return {
        success: true,
        data,
        provider: providerId,
        latency,
        cached: false,
        timestamp: new Date(),
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      healthMonitor.updateHealth(providerId, "error", undefined, errorMessage);

      return {
        success: false,
        error: errorMessage,
        provider: providerId,
        latency: Date.now() - startTime,
        cached: false,
        timestamp: new Date(),
      };
    }
  }

  /**
   * Get all provider statuses
   */
  getProviderStatuses(): ProviderHealth[] {
    return healthMonitor.getAllHealth();
  }

  /**
   * Get specific provider status
   */
  getProviderStatus(providerId: string): ProviderHealth | undefined {
    return healthMonitor.getHealth(providerId);
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    this.cache.clear();
  }

  /**
   * Clear expired cache entries
   */
  clearExpiredCache(): void {
    const now = new Date();
    for (const [key, value] of this.cache.entries()) {
      if (value.expiry < now) {
        this.cache.delete(key);
      }
    }
  }
}

// Singleton instance
export const apiGateway = new APIGateway();

// ============================================
// Response Normalization
// ============================================

export interface NormalizedAIResponse {
  content: string;
  model: string;
  tokens?: {
    input: number;
    output: number;
    total: number;
  };
  finishReason?: string;
}

export interface NormalizedJobResponse {
  id: string;
  title: string;
  company: string;
  location: string;
  description: string;
  salary: string | null;
  url: string;
  postedDate: Date;
  skills: string[];
}

export function normalizeAIResponse(raw: unknown, provider: string): NormalizedAIResponse {
  // Provider-specific normalization
  if (provider === "gemini") {
    const gemini = raw as { candidates?: Array<{ content?: { parts?: Array<{ text?: string }> }> }> };
    const content = gemini.candidates?.[0]?.content?.parts?.[0]?.text || "";
    return {
      content,
      model: "gemini",
      tokens: {
        input: 100,
        output: 200,
        total: 300,
      },
      finishReason: "success",
    };
  }

  if (provider === "openai") {
    const openai = raw as { choices?: Array<{ message?: { content?: string } }> };
    const content = openai.choices?.[0]?.message?.content || "";
    return {
      content,
      model: "gpt",
    };
  }

  if (provider === "anthropic") {
    const anthropic = raw as { content?: Array<{ text?: string }> };
    const content = anthropic.content?.[0]?.text || "";
    return {
      content,
      model: "claude",
    };
  }

  // Fallback
  return {
    content: String(raw),
    model: provider,
  };
}

export function normalizeJobResponse(raw: unknown, provider: string): NormalizedJobResponse[] {
  if (provider === "adzuna") {
    const adzuna = raw as { results?: Array<unknown> };
    return (adzuna.results || []).map((job: unknown) => {
      const j = job as Record<string, unknown>;
      const company = j["company"] as Record<string, unknown> | undefined;
      const location = j["location"] as Record<string, unknown> | undefined;
      return {
        id: String(j["id"] || ""),
        title: String(j["title"] || ""),
        company: String(company?.["display_name"] || ""),
        location: String(location?.["display_name"] || ""),
        description: String(j["description"] || ""),
        salary: j["salary_max"] ? `${j["salary_min"]} - ${j["salary_max"]}` : null,
        url: String(j["redirect_url"] || ""),
        postedDate: new Date(j["created"] as string | number || Date.now()),
        skills: [],
      };
    });
  }

  if (provider === "jooble") {
    const jooble = raw as { jobs?: Array<unknown> };
    return (jooble.jobs || []).map((job: unknown) => {
      const j = job as Record<string, unknown>;
      return {
        id: String(j["id"] || ""),
        title: String(j["title"] || ""),
        company: String(j["company"] || ""),
        location: String(j["location"] || ""),
        description: String(j["description"] || ""),
        salary: String(j["salary"] || ""),
        url: String(j["link"] || ""),
        postedDate: new Date(j["updated"] as string | number || Date.now()),
        skills: [],
      };
    });
  }

  return [];
}
