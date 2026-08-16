import { debateRepository } from "@argumentor/db";
import type { CreateDebateConfig, DebatePhase, JudgeFeedback, TurnAnalysis } from "@argumentor/debate-core";

export const debateRepo = debateRepository;

export type { CreateDebateConfig, DebatePhase, JudgeFeedback, TurnAnalysis };
