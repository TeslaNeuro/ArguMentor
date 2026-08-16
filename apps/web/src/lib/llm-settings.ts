import {
  DEFAULT_MODELS,
  isLlmProvider,
  type LlmCredentials,
  type LlmProvider,
} from "@argumentor/agents/credentials";

export const LLM_SETTINGS_KEY = "argumentor.llm-settings";

export type StoredLlmSettings = {
  provider: LlmProvider;
  apiKey: string;
  primaryModel: string;
  analysisModel: string;
};

export function defaultLlmSettings(provider: LlmProvider = "openrouter"): StoredLlmSettings {
  const models = DEFAULT_MODELS[provider];
  return {
    provider,
    apiKey: "",
    primaryModel: models.primary,
    analysisModel: models.analysis,
  };
}

export function loadLlmSettings(): StoredLlmSettings {
  const fallback = defaultLlmSettings();
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(LLM_SETTINGS_KEY);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw) as Partial<StoredLlmSettings>;
    const provider = isLlmProvider(parsed.provider) ? parsed.provider : "openrouter";
    const models = DEFAULT_MODELS[provider];
    return {
      provider,
      apiKey: typeof parsed.apiKey === "string" ? parsed.apiKey : "",
      primaryModel:
        typeof parsed.primaryModel === "string" && parsed.primaryModel.trim()
          ? parsed.primaryModel
          : models.primary,
      analysisModel:
        typeof parsed.analysisModel === "string" && parsed.analysisModel.trim()
          ? parsed.analysisModel
          : models.analysis,
    };
  } catch {
    return fallback;
  }
}

export function saveLlmSettings(settings: StoredLlmSettings) {
  window.localStorage.setItem(LLM_SETTINGS_KEY, JSON.stringify(settings));
}

export function clearLlmSettings() {
  window.localStorage.removeItem(LLM_SETTINGS_KEY);
}

export function hasStoredLlmKey(): boolean {
  return Boolean(loadLlmSettings().apiKey.trim());
}

export function storedCredentials(): LlmCredentials | null {
  const settings = loadLlmSettings();
  const apiKey = settings.apiKey.trim();
  if (!apiKey) return null;
  return {
    provider: settings.provider,
    apiKey,
    primaryModel: settings.primaryModel,
    analysisModel: settings.analysisModel,
  };
}
