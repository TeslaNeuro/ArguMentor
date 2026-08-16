import { beforeEach, describe, expect, it } from "vitest";
import { memoryDb } from "./memory-store";

describe("memoryDb", () => {
  beforeEach(() => {
    const g = globalThis as { __argumentorStore?: unknown };
    g.__argumentorStore = undefined;
  });

  it("writes evaluation-style memories and lists newest first", async () => {
    const user = await memoryDb.upsertUser({
      clerkId: "test_user",
      email: "test@example.com",
      displayName: "Tester",
    });
    await memoryDb.addMemory({
      userId: user.id,
      kind: "evaluation_summary",
      content: "First summary",
    });
    await memoryDb.addMemory({
      userId: user.id,
      kind: "weakness",
      content: "Vague evidence",
    });
    const memories = await memoryDb.listMemories(user.id, 12);
    expect(memories[0]?.kind).toBe("weakness");
    expect(memories[1]?.kind).toBe("evaluation_summary");
  });

  it("sets the skill profile from the first judged debate instead of blending with the default", async () => {
    const user = await memoryDb.upsertUser({
      clerkId: "first_eval",
      email: "first@example.com",
    });
    const skill = await memoryDb.applyEvaluationToSkill(user.id, {
      clarity: 4.2,
      evidence: 3.8,
      logic: 4.0,
      persuasiveness: 3.5,
      responsiveness: 3.9,
      fallacyAvoidance: 4.1,
    });
    expect(skill.evaluationsApplied).toBe(1);
    expect(skill.dimensions.clarity).toBe(4.2);
    expect(skill.overall).toBeGreaterThan(3.5);
  });
});
