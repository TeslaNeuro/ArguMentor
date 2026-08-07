import { describe, expect, it } from "vitest";
import { coerceJudgePayload } from "./judge";
import { extractJson } from "./structured";
import { JudgeFeedbackSchema } from "@argumentor/debate-core";

describe("coerceJudgePayload", () => {
  it("maps flat free-model judge JSON into schema", () => {
    const raw = {
      clarity: 1,
      evidence: 0,
      logic: 0,
      persuasiveness: 0,
      responsiveness: 0,
      fallacyAvoidance: 5,
      overall: 1,
      feedback: {
        clarity: "Too brief.",
        evidence: "No data provided.",
      },
    };
    const coerced = coerceJudgePayload(raw);
    const parsed = JudgeFeedbackSchema.parse(coerced);
    expect(parsed.scores.clarity).toBe(1);
    expect(parsed.scores.overall).toBe(1);
    expect(parsed.improvements.length).toBeGreaterThan(0);
    expect(parsed.verdict).toBe("draw");
  });
});

describe("extractJson", () => {
  it("repairs truncated closing braces", () => {
    const truncated =
      '{"clarity":1,"feedback":{"clarity":"Too brief and informal."}';
    const parsed = extractJson(truncated) as { clarity: number; feedback: object };
    expect(parsed.clarity).toBe(1);
    expect(parsed.feedback).toEqual({ clarity: "Too brief and informal." });
  });
});
