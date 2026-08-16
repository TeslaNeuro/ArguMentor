import { afterEach, describe, expect, it } from "vitest";
import {
  hasLlmCredentials,
  resolveLlmCredentials,
} from "./credentials";

const ORIGINAL_ENV = { ...process.env };

afterEach(() => {
  process.env = { ...ORIGINAL_ENV };
  delete process.env.ARGUMENTOR_ALLOW_SERVER_LLM_KEY;
  delete process.env.OPENROUTER_API_KEY;
  delete process.env.ANTHROPIC_API_KEY;
  delete process.env.OPENAI_API_KEY;
});

describe("resolveLlmCredentials", () => {
  it("uses request credentials and ignores server env by default", () => {
    process.env.OPENROUTER_API_KEY = "sk-env-should-not-win";
    const resolved = resolveLlmCredentials({
      provider: "openai",
      apiKey: " sk-user ",
      primaryModel: "gpt-4o",
    });
    expect(resolved).toEqual({
      provider: "openai",
      apiKey: "sk-user",
      primaryModel: "gpt-4o",
    });
  });

  it("returns null when no request key and server fallback is off", () => {
    process.env.OPENROUTER_API_KEY = "sk-env";
    expect(resolveLlmCredentials(null)).toBeNull();
    expect(hasLlmCredentials()).toBe(false);
  });

  it("uses server env only when explicitly allowed", () => {
    process.env.ARGUMENTOR_ALLOW_SERVER_LLM_KEY = "true";
    process.env.ANTHROPIC_API_KEY = "sk-ant";
    expect(resolveLlmCredentials()).toEqual({
      provider: "anthropic",
      apiKey: "sk-ant",
    });
  });

  it("prefers request key over allowed server env", () => {
    process.env.ARGUMENTOR_ALLOW_SERVER_LLM_KEY = "true";
    process.env.OPENROUTER_API_KEY = "sk-env";
    const resolved = resolveLlmCredentials({
      provider: "openrouter",
      apiKey: "sk-ui",
    });
    expect(resolved?.apiKey).toBe("sk-ui");
  });
});
