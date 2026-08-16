import { describe, expect, it } from "vitest";
import { MISSING_LLM_KEY_MESSAGE } from "@argumentor/agents/credentials";
import { credentialsFromRequest, isLlmCredentials } from "./llm-request";

function requestWith(headers: Record<string, string>) {
  return new Request("http://localhost/api/research", { headers });
}

describe("credentialsFromRequest", () => {
  it("reads BYOK headers", () => {
    const credentials = credentialsFromRequest(
      requestWith({
        "x-argumentor-provider": "openai",
        "x-argumentor-api-key": "sk-test",
        "x-argumentor-model": "gpt-4o",
        "x-argumentor-analysis-model": "gpt-4o-mini",
      }),
    );
    expect(credentials).toEqual({
      provider: "openai",
      apiKey: "sk-test",
      primaryModel: "gpt-4o",
      analysisModel: "gpt-4o-mini",
    });
    expect(isLlmCredentials(credentials!)).toBe(true);
  });

  it("returns null without a key", () => {
    expect(credentialsFromRequest(requestWith({}))).toBeNull();
    expect(MISSING_LLM_KEY_MESSAGE).toMatch(/Settings/);
  });
});
