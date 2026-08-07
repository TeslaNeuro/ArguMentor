import { describe, expect, it } from "vitest";
import {
  canRequestOpponentTurn,
  canSubmitUserTurn,
  createInitialState,
  reduceDebateState,
} from "./orchestrator";

describe("debate orchestrator", () => {
  const config = {
    topic: "Should cities ban private cars downtown?",
    userSide: "proposition" as const,
    difficulty: "intermediate" as const,
    personality: "analytical" as const,
    format: "freeform" as const,
    timeLimitSeconds: 180,
    maxRounds: 2,
  };

  it("starts awaiting opponent", () => {
    let state = createInitialState(config);
    state = reduceDebateState(state, { type: "START" });
    expect(state.status).toBe("active");
    expect(canRequestOpponentTurn(state)).toBe(true);
    expect(canSubmitUserTurn(state)).toBe(false);
  });

  it("alternates turns and evaluates after max rounds", () => {
    let state = createInitialState(config);
    state = reduceDebateState(state, { type: "START" });
    state = reduceDebateState(state, { type: "OPPONENT_TURN_COMPLETED" });
    expect(canSubmitUserTurn(state)).toBe(true);
    state = reduceDebateState(state, { type: "USER_TURN_SUBMITTED" });
    expect(state.round).toBe(2);
    state = reduceDebateState(state, { type: "OPPONENT_TURN_COMPLETED" });
    state = reduceDebateState(state, { type: "USER_TURN_SUBMITTED" });
    expect(state.status).toBe("evaluating");
    state = reduceDebateState(state, { type: "EVALUATION_COMPLETED" });
    expect(state.status).toBe("completed");
  });
});
