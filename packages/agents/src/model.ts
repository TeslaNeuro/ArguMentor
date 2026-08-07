import { createAnthropic } from "@ai-sdk/anthropic";
import { createOpenAI } from "@ai-sdk/openai";
import type { LanguageModelV1 } from "ai";

export type ModelRole = "opponent" | "judge" | "analysis" | "coach" | "research";

/**
 * Provider priority:
 * 1. OPENROUTER_API_KEY → OpenRouter (OpenAI-compatible)
 * 2. ANTHROPIC_API_KEY → Anthropic direct
 * 3. OPENAI_API_KEY → OpenAI direct
 *
 * Optional model overrides (OpenRouter IDs look like "anthropic/claude-sonnet-4"):
 * - OPENROUTER_MODEL / OPENROUTER_ANALYSIS_MODEL
 * - or OPENAI_MODEL / OPENAI_ANALYSIS_MODEL when using OpenAI direct
 */
export function getModel(role: ModelRole = "opponent"): LanguageModelV1 {
  const openrouterKey = process.env.OPENROUTER_API_KEY;
  if (openrouterKey) {
    const openrouter = createOpenAI({
      apiKey: openrouterKey,
      baseURL: "https://openrouter.ai/api/v1",
      headers: {
        "HTTP-Referer": process.env.OPENROUTER_HTTP_REFERER || "http://localhost:3000",
        "X-Title": process.env.OPENROUTER_APP_TITLE || "ArguMentor",
      },
    });
    const analysisModel =
      process.env.OPENROUTER_ANALYSIS_MODEL || "anthropic/claude-3.5-haiku";
    const primaryModel =
      process.env.OPENROUTER_MODEL || "anthropic/claude-sonnet-4";
    return openrouter(role === "analysis" ? analysisModel : primaryModel);
  }

  const anthropicKey = process.env.ANTHROPIC_API_KEY;
  if (anthropicKey) {
    const anthropic = createAnthropic({ apiKey: anthropicKey });
    if (role === "analysis") {
      return anthropic("claude-3-5-haiku-latest");
    }
    return anthropic("claude-sonnet-4-20250514");
  }

  const openaiKey = process.env.OPENAI_API_KEY;
  if (openaiKey) {
    const openai = createOpenAI({ apiKey: openaiKey });
    if (role === "analysis") {
      return openai(process.env.OPENAI_ANALYSIS_MODEL || "gpt-4o-mini");
    }
    return openai(process.env.OPENAI_MODEL || "gpt-4o");
  }

  throw new Error(
    "No LLM API key configured. Set OPENROUTER_API_KEY, ANTHROPIC_API_KEY, or OPENAI_API_KEY.",
  );
}

export function hasLlmCredentials(): boolean {
  return Boolean(
    process.env.OPENROUTER_API_KEY ||
      process.env.ANTHROPIC_API_KEY ||
      process.env.OPENAI_API_KEY,
  );
}
