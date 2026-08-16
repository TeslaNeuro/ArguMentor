import {
  isLlmProvider,
  MISSING_LLM_KEY_MESSAGE,
  resolveLlmCredentials,
  type LlmCredentials,
} from "@argumentor/agents";
import { NextResponse } from "next/server";

export function credentialsFromRequest(req: Request): LlmCredentials | null {
  const apiKey = req.headers.get("x-argumentor-api-key");
  const providerHeader = req.headers.get("x-argumentor-provider");
  const provider = isLlmProvider(providerHeader) ? providerHeader : "openrouter";
  return resolveLlmCredentials({
    provider,
    apiKey: apiKey ?? "",
    primaryModel: req.headers.get("x-argumentor-model") ?? undefined,
    analysisModel: req.headers.get("x-argumentor-analysis-model") ?? undefined,
  });
}

export function missingLlmKeyResponse() {
  return NextResponse.json(
    { error: MISSING_LLM_KEY_MESSAGE, code: "missing_llm_key" },
    { status: 400 },
  );
}

export function requireLlmCredentials(req: Request): LlmCredentials | NextResponse {
  const credentials = credentialsFromRequest(req);
  if (!credentials) return missingLlmKeyResponse();
  return credentials;
}

export function isLlmCredentials(value: LlmCredentials | NextResponse): value is LlmCredentials {
  return !(value instanceof NextResponse);
}
