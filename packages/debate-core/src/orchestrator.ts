import type {
  CreateDebateConfig,
  DebatePhase,
  SessionStatus,
} from "./types";
import { phaseForRound } from "./types";

export type OrchestratorEvent =
  | { type: "START" }
  | { type: "USER_TURN_SUBMITTED" }
  | { type: "OPPONENT_TURN_COMPLETED" }
  | { type: "END_DEBATE" }
  | { type: "EVALUATION_COMPLETED" }
  | { type: "ABANDON" };

export interface DebateSessionState {
  status: SessionStatus;
  phase: DebatePhase;
  round: number;
  maxRounds: number;
  awaitingSpeaker: "user" | "opponent" | "none";
  format: CreateDebateConfig["format"];
  turnsCompleted: number;
}

export function createInitialState(config: CreateDebateConfig): DebateSessionState {
  return {
    status: "pending",
    phase: "opening",
    round: 1,
    maxRounds: config.maxRounds,
    awaitingSpeaker: "opponent",
    format: config.format,
    turnsCompleted: 0,
  };
}

export function reduceDebateState(
  state: DebateSessionState,
  event: OrchestratorEvent,
): DebateSessionState {
  switch (event.type) {
    case "START":
      if (state.status !== "pending") return state;
      return {
        ...state,
        status: "active",
        phase: phaseForRound(state.format, 1, state.maxRounds),
        awaitingSpeaker: "opponent",
      };

    case "OPPONENT_TURN_COMPLETED": {
      if (state.status !== "active") return state;
      const turnsCompleted = state.turnsCompleted + 1;
      return {
        ...state,
        turnsCompleted,
        awaitingSpeaker: "user",
      };
    }

    case "USER_TURN_SUBMITTED": {
      if (state.status !== "active") return state;
      const turnsCompleted = state.turnsCompleted + 1;
      const nextRound = state.round + 1;

      if (nextRound > state.maxRounds) {
        return {
          ...state,
          turnsCompleted,
          status: "evaluating",
          phase: "evaluation",
          awaitingSpeaker: "none",
        };
      }

      return {
        ...state,
        turnsCompleted,
        round: nextRound,
        phase: phaseForRound(state.format, nextRound, state.maxRounds),
        awaitingSpeaker: "opponent",
      };
    }

    case "END_DEBATE":
      if (state.status !== "active") return state;
      return {
        ...state,
        status: "evaluating",
        phase: "evaluation",
        awaitingSpeaker: "none",
      };

    case "EVALUATION_COMPLETED":
      if (state.status !== "evaluating") return state;
      return {
        ...state,
        status: "completed",
        phase: "completed",
        awaitingSpeaker: "none",
      };

    case "ABANDON":
      return {
        ...state,
        status: "abandoned",
        awaitingSpeaker: "none",
      };

    default:
      return state;
  }
}

export function canSubmitUserTurn(state: DebateSessionState): boolean {
  return state.status === "active" && state.awaitingSpeaker === "user";
}

export function canRequestOpponentTurn(state: DebateSessionState): boolean {
  return state.status === "active" && state.awaitingSpeaker === "opponent";
}
