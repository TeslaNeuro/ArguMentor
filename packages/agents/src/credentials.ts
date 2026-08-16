export type ModelRole = "opponent" | "judge" | "analysis" | "coach" | "research";

export type LlmProvider = "openrouter" | "anthropic" | "openai";

export interface LlmCredentials {
  provider: LlmProvider;
  apiKey: string;
  primaryModel?: string;
  analysisModel?: string;
}

export const DEFAULT_MODELS: Record<
  LlmProvider,
  { primary: string; analysis: string }
> = {
  openrouter: {
    primary: "anthropic/claude-sonnet-4",
    analysis: "anthropic/claude-3.5-haiku",
  },
  anthropic: {
    primary: "claude-sonnet-4-20250514",
    analysis: "claude-3-5-haiku-latest",
  },
  openai: {
    primary: "gpt-4o",
    analysis: "gpt-4o-mini",
  },
};

export const MISSING_LLM_KEY_MESSAGE =
  "Add an API key in Settings before using AI features.";

export function isLlmProvider(value: string | null | undefined): value is LlmProvider {
  return value === "openrouter" || value === "anthropic" || value === "openai";
}

function serverEnvCredentials(): LlmCredentials | null {
  if (process.env.ARGUMENTOR_ALLOW_SERVER_LLM_KEY !== "true") {
    return null;
  }

  const openrouterKey = process.env.OPENROUTER_API_KEY;
  if (openrouterKey) {
    return {
      provider: "openrouter",
      apiKey: openrouterKey,
      primaryModel: process.env.OPENROUTER_MODEL,
      analysisModel: process.env.OPENROUTER_ANALYSIS_MODEL,
    };
  }

  const anthropicKey = process.env.ANTHROPIC_API_KEY;
  if (anthropicKey) {
    return {
      provider: "anthropic",
      apiKey: anthropicKey,
      primaryModel: process.env.ANTHROPIC_MODEL,
      analysisModel: process.env.ANTHROPIC_ANALYSIS_MODEL,
    };
  }

  const openaiKey = process.env.OPENAI_API_KEY;
  if (openaiKey) {
    return {
      provider: "openai",
      apiKey: openaiKey,
      primaryModel: process.env.OPENAI_MODEL,
      analysisModel: process.env.OPENAI_ANALYSIS_MODEL,
    };
  }

  return null;
}

export function resolveLlmCredentials(
  request?: LlmCredentials | null,
): LlmCredentials | null {
  const apiKey = request?.apiKey?.trim();
  if (apiKey) {
    const provider = isLlmProvider(request?.provider) ? request.provider : "openrouter";
    const primary = request?.primaryModel?.trim();
    const analysis = request?.analysisModel?.trim();
    return {
      provider,
      apiKey,
      ...(primary ? { primaryModel: primary } : {}),
      ...(analysis ? { analysisModel: analysis } : {}),
    };
  }
  return serverEnvCredentials();
}

export function hasLlmCredentials(request?: LlmCredentials | null): boolean {
  return Boolean(resolveLlmCredentials(request));
}
