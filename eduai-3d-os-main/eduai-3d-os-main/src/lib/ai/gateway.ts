/**
 * EduAI Multi-Provider AI Gateway
 * Supports Google Gemini, OpenAI, and Anthropic with task routing and fallback
 */

import { apiGateway, normalizeAIResponse } from "../api-gateway";
import { getSecret, hasSecret } from "../secrets";

// ============================================
// Types & Interfaces
// ============================================

export type AIProvider = "gemini" | "openai" | "anthropic";
export type AIModel = "gemini-pro" | "gemini-1.5-pro" | "gpt-4" | "gpt-3.5-turbo" | "claude-3-opus" | "claude-3-sonnet" | "claude-3-haiku";

export type AITask = "chat" | "extraction" | "structured" | "vision" | "document";

export interface AIRequest {
  task: AITask;
  prompt: string;
  systemPrompt?: string;
  model?: AIModel;
  temperature?: number;
  maxTokens?: number;
  provider?: AIProvider;
  fallbackProviders?: AIProvider[];
  stream?: boolean;
  jsonMode?: boolean;
}

export interface AIResponse {
  content: string;
  model: string;
  provider: AIProvider;
  tokens: {
    input: number;
    output: number;
    total: number;
  } | null;
  finishReason: string | null;
  cached: boolean;
  latency: number;
}

export interface TokenUsage {
  provider: AIProvider;
  model: string;
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  timestamp: Date;
}

// ============================================
// Provider Configuration
// ============================================

const PROVIDER_MODELS: Record<AIProvider, AIModel[]> = {
  gemini: ["gemini-pro", "gemini-1.5-pro"],
  openai: ["gpt-4", "gpt-3.5-turbo"],
  anthropic: ["claude-3-opus", "claude-3-sonnet", "claude-3-haiku"],
};

const PROVIDER_ENDPOINTS: Record<AIProvider, string> = {
  gemini: "https://generativelanguage.googleapis.com/v1beta/models",
  openai: "https://api.openai.com/v1/chat/completions",
  anthropic: "https://api.anthropic.com/v1/messages",
};

const API_KEYS: Record<AIProvider, string> = {
  gemini: "GEMINI_API_KEY",
  openai: "OPENAI_API_KEY",
  anthropic: "ANTHROPIC_API_KEY",
};

// ============================================
// Token Usage Tracking
// ============================================

class TokenTracker {
  private usage: TokenUsage[] = [];
  private dailyLimits: Record<AIProvider, number> = {
    gemini: 1500000,
    openai: 90000000,
    anthropic: 10000000,
  };

  recordUsage(usage: TokenUsage): void {
    this.usage.push(usage);
    this.pruneOldUsage();
  }

  private pruneOldUsage(): void {
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    this.usage = this.usage.filter((u) => u.timestamp > oneDayAgo);
  }

  getDailyUsage(provider: AIProvider): number {
    return this.usage
      .filter((u) => u.provider === provider)
      .reduce((sum, u) => sum + u.totalTokens, 0);
  }

  getRemainingQuota(provider: AIProvider): number {
    const used = this.getDailyUsage(provider);
    const limit = this.dailyLimits[provider];
    return Math.max(0, limit - used);
  }

  getUsageByProvider(): Record<AIProvider, number> {
    const result: Partial<Record<AIProvider, number>> = {};
    for (const provider of Object.keys(PROVIDER_MODELS) as AIProvider[]) {
      result[provider] = this.getDailyUsage(provider);
    }
    return result as Record<AIProvider, number>;
  }
}

export const tokenTracker = new TokenTracker();

// ============================================
// Provider-Specific Request Builders
// ============================================

function buildGeminiRequest(request: AIRequest, apiKey: string): RequestInit {
  const model = request.model || "gemini-pro";
  const endpoint = `${PROVIDER_ENDPOINTS.gemini}/${model}:generateContent?key=${apiKey}`;

  return {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      contents: [
        {
          parts: [
            {
              text: request.systemPrompt 
                ? `${request.systemPrompt}\n\n${request.prompt}`
                : request.prompt,
            },
          ],
        },
      ],
      generationConfig: {
        temperature: request.temperature || 0.7,
        maxOutputTokens: request.maxTokens || 2048,
      },
    }),
  };
}

function buildOpenAIRequest(request: AIRequest, apiKey: string): RequestInit {
  const model = request.model || "gpt-3.5-turbo";

  const messages: Array<{ role: string; content: string }> = [];
  if (request.systemPrompt) {
    messages.push({ role: "system", content: request.systemPrompt });
  }
  messages.push({ role: "user", content: request.prompt });

  return {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages,
      temperature: request.temperature || 0.7,
      max_tokens: request.maxTokens || 2048,
      stream: request.stream || false,
      response_format: request.jsonMode ? { type: "json_object" } : undefined,
    }),
  };
}

function buildAnthropicRequest(request: AIRequest, apiKey: string): RequestInit {
  const model = request.model || "claude-3-sonnet";

  return {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model,
      max_tokens: request.maxTokens || 2048,
      system: request.systemPrompt || undefined,
      messages: [
        {
          role: "user",
          content: request.prompt,
        },
      ],
      temperature: request.temperature || 0.7,
      stream: request.stream || false,
    }),
  };
}

// ============================================
// AI Gateway Main Class
// ============================================

export class AIGateway {
  /**
   * Execute an AI request with automatic provider selection and fallback
   */
  async execute(request: AIRequest): Promise<AIResponse> {
    const providers = this.selectProviders(request);
    let lastError: Error | null = null;

    for (const provider of providers) {
      if (!hasSecret(API_KEYS[provider])) {
        console.warn(`Provider ${provider} is not configured, skipping`);
        continue;
      }

      try {
        const response = await this.executeWithProvider(request, provider);
        
        // Track token usage
        if (response.tokens) {
          tokenTracker.recordUsage({
            provider,
            model: response.model,
            inputTokens: response.tokens.input,
            outputTokens: response.tokens.output,
            totalTokens: response.tokens.total,
            timestamp: new Date(),
          });
        }

        return response;
      } catch (error) {
        lastError = error as Error;
        console.error(`Provider ${provider} failed:`, error);
        continue;
      }
    }

    throw lastError || new Error("All AI providers failed or are not configured");
  }

  /**
   * Execute with a specific provider
   */
  private async executeWithProvider(request: AIRequest, provider: AIProvider): Promise<AIResponse> {
    const apiKey = getSecret(API_KEYS[provider]);
    if (!apiKey) {
      throw new Error(`API key for ${provider} is not configured`);
    }

    let fetchRequest: RequestInit;

    switch (provider) {
      case "gemini":
        fetchRequest = buildGeminiRequest(request, apiKey);
        break;
      case "openai":
        fetchRequest = buildOpenAIRequest(request, apiKey);
        break;
      case "anthropic":
        fetchRequest = buildAnthropicRequest(request, apiKey);
        break;
    }

    const endpoint = PROVIDER_ENDPOINTS[provider];
    const response = await fetch(endpoint, fetchRequest);

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Provider ${provider} returned ${response.status}: ${error}`);
    }

    const data = await response.json();
    const normalized = normalizeAIResponse(data, provider);

    return {
      content: normalized.content,
      model: normalized.model,
      provider,
      tokens: normalized.tokens,
      finishReason: normalized.finishReason,
      cached: false,
      latency: 0, // Will be set by API Gateway
    };
  }

  /**
   * Select providers based on request configuration and availability
   */
  private selectProviders(request: AIRequest): AIProvider[] {
    if (request.provider) {
      return [request.provider, ...(request.fallbackProviders || [])];
    }

    // Task-based provider selection
    switch (request.task) {
      case "vision":
      case "document":
        // Gemini and GPT-4 Vision are best for these tasks
        return ["gemini", "openai", "anthropic"];
      case "extraction":
      case "structured":
        // GPT-4 and Claude are best for structured output
        return ["openai", "anthropic", "gemini"];
      case "chat":
      default:
        // Default order based on cost and quality
        return ["gemini", "openai", "anthropic"];
    }
  }

  /**
   * Get available providers
   */
  getAvailableProviders(): AIProvider[] {
    return Object.keys(API_KEYS) as AIProvider[];
  }

  /**
   * Check if a provider is configured
   */
  isProviderConfigured(provider: AIProvider): boolean {
    return hasSecret(API_KEYS[provider]);
  }

  /**
   * Get models for a provider
   */
  getModels(provider: AIProvider): AIModel[] {
    return PROVIDER_MODELS[provider] || [];
  }

  /**
   * Get token usage statistics
   */
  getTokenUsage(): Record<AIProvider, number> {
    return tokenTracker.getUsageByProvider();
  }

  /**
   * Get remaining quota for a provider
   */
  getRemainingQuota(provider: AIProvider): number {
    return tokenTracker.getRemainingQuota(provider);
  }
}

// Singleton instance
export const aiGateway = new AIGateway();

// ============================================
// Convenience Functions
// ============================================

/**
 * Simple chat completion
 */
export async function chat(prompt: string, options?: Partial<AIRequest>): Promise<string> {
  const response = await aiGateway.execute({
    task: "chat",
    prompt,
    ...options,
  });
  return response.content;
}

/**
 * Structured data extraction
 */
export async function extractData(prompt: string, options?: Partial<AIRequest>): Promise<string> {
  const response = await aiGateway.execute({
    task: "extraction",
    prompt,
    jsonMode: true,
    ...options,
  });
  return response.content;
}

/**
 * Vision/document analysis
 */
export async function analyzeImage(prompt: string, imageUrl: string, options?: Partial<AIRequest>): Promise<string> {
  const response = await aiGateway.execute({
    task: "vision",
    prompt: `${prompt}\n\nImage: ${imageUrl}`,
    ...options,
  });
  return response.content;
}
