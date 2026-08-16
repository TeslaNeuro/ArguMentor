import { storedCredentials } from "./llm-settings";

export function llmRequestHeaders(): Record<string, string> {
  const credentials = storedCredentials();
  if (!credentials) return {};
  return {
    "x-argumentor-provider": credentials.provider,
    "x-argumentor-api-key": credentials.apiKey,
    "x-argumentor-model": credentials.primaryModel ?? "",
    "x-argumentor-analysis-model": credentials.analysisModel ?? "",
  };
}

export function apiFetch(input: RequestInfo | URL, init?: RequestInit) {
  const headers = new Headers(init?.headers);
  for (const [key, value] of Object.entries(llmRequestHeaders())) {
    if (value) headers.set(key, value);
  }
  return fetch(input, { ...init, headers });
}
