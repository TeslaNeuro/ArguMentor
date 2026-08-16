import { createAnthropic } from "@ai-sdk/anthropic";
import { createOpenAI } from "@ai-sdk/openai";
import type { LanguageModelV1 } from "ai";
import {
  DEFAULT_MODELS,
  MISSING_LLM_KEY_MESSAGE,
  resolveLlmCredentials,
  type LlmCredentials,
  type ModelRole,
} from "./credentials";

export type { ModelRole, LlmCredentials };

function modelId(role: ModelRole, credentials: LlmCredentials): string {
  const defaults = DEFAULT_MODELS[credentials.provider];
  if (role === "analysis") {
    return credentials.analysisModel || defaults.analysis;
  }
  return credentials.primaryModel || defaults.primary;
}

export function getModel(
  role: ModelRole = "opponent",
  credentials?: LlmCredentials | null,
): LanguageModelV1 {
  const resolved = resolveLlmCredentials(credentials);
  if (!resolved) {
    throw new Error(MISSING_LLM_KEY_MESSAGE);
  }

  const id = modelId(role, resolved);

  if (resolved.provider === "openrouter") {
    const openrouter = createOpenAI({
      apiKey: resolved.apiKey,
      baseURL: "https://openrouter.ai/api/v1",
      headers: {
        "HTTP-Referer": process.env.OPENROUTER_HTTP_REFERER || "http://localhost:3000",
        "X-Title": process.env.OPENROUTER_APP_TITLE || "ArguMentor",
      },
    });
    return openrouter(id);
  }

  if (resolved.provider === "anthropic") {
    const anthropic = createAnthropic({ apiKey: resolved.apiKey });
    return anthropic(id);
  }

  const openai = createOpenAI({ apiKey: resolved.apiKey });
  return openai(id);
}
