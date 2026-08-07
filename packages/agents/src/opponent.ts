import {
  buildOpponentSystemPrompt,
  oppositeSide,
  type CreateDebateConfig,
  type DebatePhase,
  type SkillDimensions,
} from "@argumentor/debate-core";
import { streamText } from "ai";
import { getModel } from "./model";

export interface OpponentTurnInput {
  config: CreateDebateConfig;
  phase: DebatePhase;
  round: number;
  transcript: Array<{ speaker: string; content: string }>;
  skillSnapshot?: SkillDimensions | null;
}

export function streamOpponentTurn(input: OpponentTurnInput) {
  const opponentSide = oppositeSide(input.config.userSide);
  const system = buildOpponentSystemPrompt({
    topic: input.config.topic,
    opponentSide,
    userSide: input.config.userSide,
    personality: input.config.personality,
    difficulty: input.config.difficulty,
    phase: input.phase,
    round: input.round,
    maxRounds: input.config.maxRounds,
    skillSnapshot: input.skillSnapshot,
  });

  const history = input.transcript
    .map((t) => `${t.speaker.toUpperCase()}: ${t.content}`)
    .join("\n\n");

  return streamText({
    model: getModel("opponent"),
    system,
    prompt: history
      ? `Debate transcript so far:\n\n${history}\n\nDeliver your next turn as the opponent.`
      : `Open the debate. Make the first constructive case for the ${opponentSide} side.`,
    temperature: input.config.difficulty === "elite" ? 0.7 : 0.85,
  });
}
