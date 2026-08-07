import { z } from "zod";

export const DebateDifficultySchema = z.enum([
  "novice",
  "intermediate",
  "advanced",
  "elite",
]);
export type DebateDifficulty = z.infer<typeof DebateDifficultySchema>;

export const OpponentPersonalitySchema = z.enum([
  "socratic",
  "aggressive",
  "diplomatic",
  "analytical",
  "devil_advocate",
]);
export type OpponentPersonality = z.infer<typeof OpponentPersonalitySchema>;

export const DebateFormatSchema = z.enum([
  "lincoln_douglas",
  "british_parliamentary",
  "oxford",
  "freeform",
]);
export type DebateFormat = z.infer<typeof DebateFormatSchema>;

export const DebateSideSchema = z.enum(["proposition", "opposition"]);
export type DebateSide = z.infer<typeof DebateSideSchema>;

export const DebatePhaseSchema = z.enum([
  "opening",
  "constructive",
  "rebuttal",
  "cross",
  "closing",
  "evaluation",
  "completed",
]);
export type DebatePhase = z.infer<typeof DebatePhaseSchema>;

export const SessionStatusSchema = z.enum([
  "pending",
  "active",
  "evaluating",
  "completed",
  "abandoned",
]);
export type SessionStatus = z.infer<typeof SessionStatusSchema>;

export const SpeakerSchema = z.enum(["user", "opponent", "system", "judge", "coach"]);
export type Speaker = z.infer<typeof SpeakerSchema>;

export const CreateDebateConfigSchema = z.object({
  topic: z.string().min(8).max(500),
  userSide: DebateSideSchema,
  difficulty: DebateDifficultySchema.default("intermediate"),
  personality: OpponentPersonalitySchema.default("analytical"),
  format: DebateFormatSchema.default("freeform"),
  timeLimitSeconds: z.number().int().min(30).max(600).nullable().default(180),
  maxRounds: z.number().int().min(1).max(12).default(4),
});
export type CreateDebateConfig = z.infer<typeof CreateDebateConfigSchema>;

export const SkillDimensionsSchema = z.object({
  clarity: z.number().min(0).max(5),
  evidence: z.number().min(0).max(5),
  logic: z.number().min(0).max(5),
  persuasiveness: z.number().min(0).max(5),
  responsiveness: z.number().min(0).max(5),
  fallacyAvoidance: z.number().min(0).max(5),
});
export type SkillDimensions = z.infer<typeof SkillDimensionsSchema>;

export const EvaluationScoresSchema = SkillDimensionsSchema.extend({
  overall: z.number().min(0).max(5),
});
export type EvaluationScores = z.infer<typeof EvaluationScoresSchema>;

export const TurnAnalysisSchema = z.object({
  claims: z.array(z.string()),
  evidence: z.array(z.string()),
  assumptions: z.array(z.string()),
  conclusion: z.string().nullable(),
  clarity: z.number().min(0).max(5),
  consistency: z.number().min(0).max(5),
  persuasiveness: z.number().min(0).max(5),
  weaknesses: z.array(
    z.object({
      type: z.string(),
      explanation: z.string(),
      teachingNote: z.string(),
    }),
  ),
});
export type TurnAnalysis = z.infer<typeof TurnAnalysisSchema>;

export const JudgeFeedbackSchema = z.object({
  scores: EvaluationScoresSchema,
  summary: z.string(),
  strengths: z.array(z.string()),
  improvements: z.array(z.string()),
  keyMistakes: z.array(
    z.object({
      mistake: z.string(),
      whyItMatters: z.string(),
      howToFix: z.string(),
    }),
  ),
  verdict: z.enum(["user_wins", "opponent_wins", "draw"]),
});
export type JudgeFeedback = z.infer<typeof JudgeFeedbackSchema>;

export const PHASE_ORDER: DebatePhase[] = [
  "opening",
  "constructive",
  "rebuttal",
  "cross",
  "closing",
  "evaluation",
  "completed",
];

/** Freeform maps rounds onto condensed phases for UX clarity. */
export function phaseForRound(
  format: DebateFormat,
  round: number,
  maxRounds: number,
): DebatePhase {
  if (format === "freeform") {
    if (round <= 1) return "opening";
    if (round >= maxRounds) return "closing";
    if (round === maxRounds - 1) return "rebuttal";
    return "constructive";
  }

  const idx = Math.min(round - 1, PHASE_ORDER.length - 3);
  return PHASE_ORDER[idx] ?? "constructive";
}

export function oppositeSide(side: DebateSide): DebateSide {
  return side === "proposition" ? "opposition" : "proposition";
}

export function averageSkill(dimensions: SkillDimensions): number {
  const values = Object.values(dimensions);
  return values.reduce((a, b) => a + b, 0) / values.length;
}

export function mergeSkillProfile(
  current: SkillDimensions,
  incoming: SkillDimensions,
  weight = 0.35,
): SkillDimensions {
  const blend = (a: number, b: number) =>
    Math.round((a * (1 - weight) + b * weight) * 100) / 100;
  return {
    clarity: blend(current.clarity, incoming.clarity),
    evidence: blend(current.evidence, incoming.evidence),
    logic: blend(current.logic, incoming.logic),
    persuasiveness: blend(current.persuasiveness, incoming.persuasiveness),
    responsiveness: blend(current.responsiveness, incoming.responsiveness),
    fallacyAvoidance: blend(current.fallacyAvoidance, incoming.fallacyAvoidance),
  };
}

export const DEFAULT_SKILL_PROFILE: SkillDimensions = {
  clarity: 2.5,
  evidence: 2.5,
  logic: 2.5,
  persuasiveness: 2.5,
  responsiveness: 2.5,
  fallacyAvoidance: 2.5,
};
