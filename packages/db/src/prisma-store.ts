import {
  averageSkill,
  DEFAULT_SKILL_PROFILE,
  mergeSkillProfile,
  skillDimensionsFromScores,
  type CreateDebateConfig,
  type DebatePhase,
  type JudgeFeedback,
  type SkillDimensions,
  type TurnAnalysis,
} from "@argumentor/debate-core";
import type { Prisma } from "@prisma/client";
import { getPrisma } from "./client";
import type {
  StoredEvaluation,
  StoredMemoryItem,
  StoredSession,
  StoredSkillProfile,
  StoredTrainingPlan,
  StoredTurn,
  StoredUser,
} from "./memory-store";

function asIso(value: Date) {
  return value.toISOString();
}

function asJson<T>(value: unknown, fallback: T): T {
  return (value ?? fallback) as T;
}

function mapUser(row: {
  id: string;
  clerkId: string;
  email: string;
  displayName: string | null;
  preferences: Prisma.JsonValue;
}): StoredUser {
  return {
    id: row.id,
    clerkId: row.clerkId,
    email: row.email,
    displayName: row.displayName,
    preferences: asJson(row.preferences, {}),
  };
}

function mapSession(row: {
  id: string;
  userId: string;
  topic: string;
  userSide: string;
  difficulty: string;
  personality: string;
  format: string;
  status: string;
  phase: string;
  round: number;
  maxRounds: number;
  timeLimitSeconds: number | null;
  awaitingSpeaker: string;
  config: Prisma.JsonValue;
  createdAt: Date;
  updatedAt: Date;
  completedAt: Date | null;
}): StoredSession {
  return {
    id: row.id,
    userId: row.userId,
    topic: row.topic,
    userSide: row.userSide,
    difficulty: row.difficulty,
    personality: row.personality,
    format: row.format,
    status: row.status,
    phase: row.phase,
    round: row.round,
    maxRounds: row.maxRounds,
    timeLimitSeconds: row.timeLimitSeconds,
    awaitingSpeaker: row.awaitingSpeaker,
    config: asJson<CreateDebateConfig>(row.config, {
      topic: row.topic,
      userSide: row.userSide as CreateDebateConfig["userSide"],
      difficulty: row.difficulty as CreateDebateConfig["difficulty"],
      personality: row.personality as CreateDebateConfig["personality"],
      format: row.format as CreateDebateConfig["format"],
      maxRounds: row.maxRounds,
      timeLimitSeconds: row.timeLimitSeconds,
    }),
    createdAt: asIso(row.createdAt),
    updatedAt: asIso(row.updatedAt),
    completedAt: row.completedAt ? asIso(row.completedAt) : null,
  };
}

function mapTurn(row: {
  id: string;
  sessionId: string;
  speaker: string;
  content: string;
  round: number;
  phase: string;
  analysis: Prisma.JsonValue | null;
  createdAt: Date;
}): StoredTurn {
  return {
    id: row.id,
    sessionId: row.sessionId,
    speaker: row.speaker,
    content: row.content,
    round: row.round,
    phase: row.phase,
    analysis: row.analysis ? asJson<TurnAnalysis>(row.analysis, null as unknown as TurnAnalysis) : null,
    createdAt: asIso(row.createdAt),
  };
}

function mapEvaluation(row: {
  id: string;
  sessionId: string;
  scores: Prisma.JsonValue;
  summary: string;
  feedback: Prisma.JsonValue;
  verdict: string;
  createdAt: Date;
}): StoredEvaluation {
  return {
    id: row.id,
    sessionId: row.sessionId,
    scores: asJson<JudgeFeedback["scores"]>(row.scores, {} as JudgeFeedback["scores"]),
    summary: row.summary,
    feedback: asJson<JudgeFeedback>(row.feedback, {} as JudgeFeedback),
    verdict: row.verdict,
    createdAt: asIso(row.createdAt),
  };
}

function mapSkill(row: {
  userId: string;
  dimensions: Prisma.JsonValue;
  overall: number;
  evaluationsApplied?: number;
}): StoredSkillProfile {
  return {
    userId: row.userId,
    dimensions: asJson<SkillDimensions>(row.dimensions, { ...DEFAULT_SKILL_PROFILE }),
    overall: row.overall,
    evaluationsApplied: row.evaluationsApplied ?? 0,
  };
}

function mapMemory(row: {
  id: string;
  userId: string;
  kind: string;
  content: string;
  payload: Prisma.JsonValue;
  createdAt: Date;
}): StoredMemoryItem {
  return {
    id: row.id,
    userId: row.userId,
    kind: row.kind,
    content: row.content,
    payload: asJson(row.payload, {}),
    createdAt: asIso(row.createdAt),
  };
}

function mapPlan(row: {
  id: string;
  userId: string;
  sessionId: string | null;
  narrative: string;
  focusAreas: Prisma.JsonValue;
  drills: Prisma.JsonValue;
  createdAt: Date;
}): StoredTrainingPlan {
  return {
    id: row.id,
    userId: row.userId,
    sessionId: row.sessionId,
    narrative: row.narrative,
    focusAreas: asJson<string[]>(row.focusAreas, []),
    drills: asJson(row.drills, []),
    createdAt: asIso(row.createdAt),
  };
}

export const prismaDb = {
  async upsertUser(input: {
    clerkId: string;
    email: string;
    displayName?: string | null;
  }): Promise<StoredUser> {
    const user = await getPrisma().user.upsert({
      where: { clerkId: input.clerkId },
      update: {
        email: input.email,
        displayName: input.displayName ?? undefined,
      },
      create: {
        clerkId: input.clerkId,
        email: input.email,
        displayName: input.displayName ?? null,
        skillProfile: {
          create: {
            dimensions: DEFAULT_SKILL_PROFILE as unknown as Prisma.InputJsonValue,
            overall: averageSkill(DEFAULT_SKILL_PROFILE),
            evaluationsApplied: 0,
          },
        },
      },
    });
    return mapUser(user);
  },

  async getUserByClerkId(clerkId: string) {
    const user = await getPrisma().user.findUnique({ where: { clerkId } });
    return user ? mapUser(user) : null;
  },

  async createSession(userId: string, config: CreateDebateConfig): Promise<StoredSession> {
    const session = await getPrisma().debateSession.create({
      data: {
        userId,
        topic: config.topic,
        userSide: config.userSide,
        difficulty: config.difficulty,
        personality: config.personality,
        format: config.format,
        status: "pending",
        phase: "opening",
        round: 1,
        maxRounds: config.maxRounds,
        timeLimitSeconds: config.timeLimitSeconds,
        awaitingSpeaker: "opponent",
        config: config as unknown as Prisma.InputJsonValue,
      },
    });
    return mapSession(session);
  },

  async getSession(sessionId: string) {
    const session = await getPrisma().debateSession.findUnique({ where: { id: sessionId } });
    return session ? mapSession(session) : null;
  },

  async listSessions(userId: string) {
    const sessions = await getPrisma().debateSession.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });
    return sessions.map(mapSession);
  },

  async updateSession(
    sessionId: string,
    patch: Partial<
      Pick<StoredSession, "status" | "phase" | "round" | "awaitingSpeaker" | "completedAt">
    >,
  ) {
    const session = await getPrisma().debateSession.update({
      where: { id: sessionId },
      data: {
        ...(patch.status !== undefined ? { status: patch.status } : {}),
        ...(patch.phase !== undefined ? { phase: patch.phase } : {}),
        ...(patch.round !== undefined ? { round: patch.round } : {}),
        ...(patch.awaitingSpeaker !== undefined ? { awaitingSpeaker: patch.awaitingSpeaker } : {}),
        ...(patch.completedAt !== undefined
          ? { completedAt: patch.completedAt ? new Date(patch.completedAt) : null }
          : {}),
      },
    });
    return mapSession(session);
  },

  async addTurn(input: {
    sessionId: string;
    speaker: string;
    content: string;
    round: number;
    phase: DebatePhase | string;
    analysis?: TurnAnalysis | null;
  }) {
    const turn = await getPrisma().debateTurn.create({
      data: {
        sessionId: input.sessionId,
        speaker: input.speaker,
        content: input.content,
        round: input.round,
        phase: String(input.phase),
        analysis: input.analysis
          ? (input.analysis as unknown as Prisma.InputJsonValue)
          : undefined,
      },
    });
    return mapTurn(turn);
  },

  async listTurns(sessionId: string) {
    const turns = await getPrisma().debateTurn.findMany({
      where: { sessionId },
      orderBy: { createdAt: "asc" },
    });
    return turns.map(mapTurn);
  },

  async updateTurnAnalysis(turnId: string, analysis: TurnAnalysis) {
    const turn = await getPrisma().debateTurn.update({
      where: { id: turnId },
      data: { analysis: analysis as unknown as Prisma.InputJsonValue },
    });
    return mapTurn(turn);
  },

  async saveEvaluation(sessionId: string, feedback: JudgeFeedback) {
    const evaluation = await getPrisma().evaluation.upsert({
      where: { sessionId },
      update: {
        scores: feedback.scores as unknown as Prisma.InputJsonValue,
        summary: feedback.summary,
        feedback: feedback as unknown as Prisma.InputJsonValue,
        verdict: feedback.verdict,
      },
      create: {
        sessionId,
        scores: feedback.scores as unknown as Prisma.InputJsonValue,
        summary: feedback.summary,
        feedback: feedback as unknown as Prisma.InputJsonValue,
        verdict: feedback.verdict,
      },
    });
    return mapEvaluation(evaluation);
  },

  async getEvaluation(sessionId: string) {
    const evaluation = await getPrisma().evaluation.findUnique({ where: { sessionId } });
    return evaluation ? mapEvaluation(evaluation) : null;
  },

  async getSkillProfile(userId: string) {
    const skill = await getPrisma().skillProfile.findUnique({ where: { userId } });
    if (skill) return mapSkill(skill);
    return {
      userId,
      dimensions: { ...DEFAULT_SKILL_PROFILE },
      overall: averageSkill(DEFAULT_SKILL_PROFILE),
      evaluationsApplied: 0,
    };
  },

  async applyEvaluationToSkill(userId: string, scores: SkillDimensions) {
    const current = await prismaDb.getSkillProfile(userId);
    const incoming = skillDimensionsFromScores(scores);
    const weight = current.evaluationsApplied === 0 ? 1 : 0.35;
    const dimensions = mergeSkillProfile(current.dimensions, incoming, weight);
    const overall = averageSkill(dimensions);
    const evaluationsApplied = current.evaluationsApplied + 1;
    const skill = await getPrisma().skillProfile.upsert({
      where: { userId },
      update: {
        dimensions: dimensions as unknown as Prisma.InputJsonValue,
        overall,
        evaluationsApplied,
      },
      create: {
        userId,
        dimensions: dimensions as unknown as Prisma.InputJsonValue,
        overall,
        evaluationsApplied,
      },
    });
    return mapSkill(skill);
  },

  async addMemory(input: {
    userId: string;
    kind: string;
    content: string;
    payload?: Record<string, unknown>;
  }) {
    const item = await getPrisma().memoryItem.create({
      data: {
        userId: input.userId,
        kind: input.kind,
        content: input.content,
        payload: (input.payload ?? {}) as Prisma.InputJsonValue,
      },
    });
    return mapMemory(item);
  },

  async listMemories(userId: string, limit = 10) {
    const items = await getPrisma().memoryItem.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: limit,
    });
    return items.map(mapMemory);
  },

  async saveTrainingPlan(input: {
    userId: string;
    sessionId: string | null;
    narrative: string;
    focusAreas: string[];
    drills: Array<{ title: string; description: string; durationMinutes: number }>;
  }) {
    const data = {
      userId: input.userId,
      sessionId: input.sessionId,
      narrative: input.narrative,
      focusAreas: input.focusAreas as unknown as Prisma.InputJsonValue,
      drills: input.drills as unknown as Prisma.InputJsonValue,
    };
    if (input.sessionId) {
      const plan = await getPrisma().trainingPlan.upsert({
        where: { sessionId: input.sessionId },
        update: data,
        create: data,
      });
      return mapPlan(plan);
    }
    const plan = await getPrisma().trainingPlan.create({ data });
    return mapPlan(plan);
  },

  async latestTrainingPlan(userId: string) {
    const plan = await getPrisma().trainingPlan.findFirst({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });
    return plan ? mapPlan(plan) : null;
  },
};
