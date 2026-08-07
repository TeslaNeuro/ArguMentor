import {
  averageSkill,
  DEFAULT_SKILL_PROFILE,
  mergeSkillProfile,
  type CreateDebateConfig,
  type DebatePhase,
  type JudgeFeedback,
  type SkillDimensions,
  type TurnAnalysis,
} from "@argumentor/debate-core";
import { randomUUID } from "node:crypto";

export interface StoredUser {
  id: string;
  clerkId: string;
  email: string;
  displayName: string | null;
  preferences: Record<string, unknown>;
}

export interface StoredSession {
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
  config: CreateDebateConfig;
  createdAt: string;
  updatedAt: string;
  completedAt: string | null;
}

export interface StoredTurn {
  id: string;
  sessionId: string;
  speaker: string;
  content: string;
  round: number;
  phase: string;
  analysis: TurnAnalysis | null;
  createdAt: string;
}

export interface StoredEvaluation {
  id: string;
  sessionId: string;
  scores: JudgeFeedback["scores"];
  summary: string;
  feedback: JudgeFeedback;
  verdict: string;
  createdAt: string;
}

export interface StoredSkillProfile {
  userId: string;
  dimensions: SkillDimensions;
  overall: number;
}

export interface StoredMemoryItem {
  id: string;
  userId: string;
  kind: string;
  content: string;
  payload: Record<string, unknown>;
  createdAt: string;
}

export interface StoredTrainingPlan {
  id: string;
  userId: string;
  sessionId: string | null;
  narrative: string;
  focusAreas: string[];
  drills: Array<{ title: string; description: string; durationMinutes: number }>;
  createdAt: string;
}

const g = globalThis as unknown as {
  __argumentorStore?: {
    users: Map<string, StoredUser>;
    usersByClerk: Map<string, string>;
    sessions: Map<string, StoredSession>;
    turns: Map<string, StoredTurn[]>;
    evaluations: Map<string, StoredEvaluation>;
    skills: Map<string, StoredSkillProfile>;
    memories: Map<string, StoredMemoryItem[]>;
    plans: Map<string, StoredTrainingPlan[]>;
  };
};

function store() {
  if (!g.__argumentorStore) {
    g.__argumentorStore = {
      users: new Map(),
      usersByClerk: new Map(),
      sessions: new Map(),
      turns: new Map(),
      evaluations: new Map(),
      skills: new Map(),
      memories: new Map(),
      plans: new Map(),
    };
  }
  return g.__argumentorStore;
}

export const memoryDb = {
  async upsertUser(input: {
    clerkId: string;
    email: string;
    displayName?: string | null;
  }): Promise<StoredUser> {
    const s = store();
    const existingId = s.usersByClerk.get(input.clerkId);
    if (existingId) {
      const existing = s.users.get(existingId)!;
      existing.email = input.email;
      existing.displayName = input.displayName ?? existing.displayName;
      return existing;
    }
    const user: StoredUser = {
      id: randomUUID(),
      clerkId: input.clerkId,
      email: input.email,
      displayName: input.displayName ?? null,
      preferences: {},
    };
    s.users.set(user.id, user);
    s.usersByClerk.set(user.clerkId, user.id);
    s.skills.set(user.id, {
      userId: user.id,
      dimensions: { ...DEFAULT_SKILL_PROFILE },
      overall: averageSkill(DEFAULT_SKILL_PROFILE),
    });
    return user;
  },

  async getUserByClerkId(clerkId: string) {
    const s = store();
    const id = s.usersByClerk.get(clerkId);
    return id ? s.users.get(id) ?? null : null;
  },

  async createSession(userId: string, config: CreateDebateConfig): Promise<StoredSession> {
    const now = new Date().toISOString();
    const session: StoredSession = {
      id: randomUUID(),
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
      config,
      createdAt: now,
      updatedAt: now,
      completedAt: null,
    };
    store().sessions.set(session.id, session);
    store().turns.set(session.id, []);
    return session;
  },

  async getSession(sessionId: string) {
    return store().sessions.get(sessionId) ?? null;
  },

  async listSessions(userId: string) {
    return [...store().sessions.values()]
      .filter((s) => s.userId === userId)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  },

  async updateSession(
    sessionId: string,
    patch: Partial<
      Pick<
        StoredSession,
        | "status"
        | "phase"
        | "round"
        | "awaitingSpeaker"
        | "completedAt"
      >
    >,
  ) {
    const session = store().sessions.get(sessionId);
    if (!session) return null;
    Object.assign(session, patch, { updatedAt: new Date().toISOString() });
    return session;
  },

  async addTurn(input: {
    sessionId: string;
    speaker: string;
    content: string;
    round: number;
    phase: DebatePhase | string;
    analysis?: TurnAnalysis | null;
  }) {
    const turn: StoredTurn = {
      id: randomUUID(),
      sessionId: input.sessionId,
      speaker: input.speaker,
      content: input.content,
      round: input.round,
      phase: input.phase,
      analysis: input.analysis ?? null,
      createdAt: new Date().toISOString(),
    };
    const list = store().turns.get(input.sessionId) ?? [];
    list.push(turn);
    store().turns.set(input.sessionId, list);
    return turn;
  },

  async listTurns(sessionId: string) {
    return store().turns.get(sessionId) ?? [];
  },

  async updateTurnAnalysis(turnId: string, analysis: TurnAnalysis) {
    for (const turns of store().turns.values()) {
      const turn = turns.find((t) => t.id === turnId);
      if (turn) {
        turn.analysis = analysis;
        return turn;
      }
    }
    return null;
  },

  async saveEvaluation(sessionId: string, feedback: JudgeFeedback) {
    const evaluation: StoredEvaluation = {
      id: randomUUID(),
      sessionId,
      scores: feedback.scores,
      summary: feedback.summary,
      feedback,
      verdict: feedback.verdict,
      createdAt: new Date().toISOString(),
    };
    store().evaluations.set(sessionId, evaluation);
    return evaluation;
  },

  async getEvaluation(sessionId: string) {
    return store().evaluations.get(sessionId) ?? null;
  },

  async getSkillProfile(userId: string) {
    return (
      store().skills.get(userId) ?? {
        userId,
        dimensions: { ...DEFAULT_SKILL_PROFILE },
        overall: averageSkill(DEFAULT_SKILL_PROFILE),
      }
    );
  },

  async applyEvaluationToSkill(userId: string, scores: SkillDimensions) {
    const current = await memoryDb.getSkillProfile(userId);
    const dimensions = mergeSkillProfile(current.dimensions, scores);
    const next = {
      userId,
      dimensions,
      overall: averageSkill(dimensions),
    };
    store().skills.set(userId, next);
    return next;
  },

  async addMemory(input: {
    userId: string;
    kind: string;
    content: string;
    payload?: Record<string, unknown>;
  }) {
    const item: StoredMemoryItem = {
      id: randomUUID(),
      userId: input.userId,
      kind: input.kind,
      content: input.content,
      payload: input.payload ?? {},
      createdAt: new Date().toISOString(),
    };
    const list = store().memories.get(input.userId) ?? [];
    list.unshift(item);
    store().memories.set(input.userId, list.slice(0, 100));
    return item;
  },

  async listMemories(userId: string, limit = 10) {
    return (store().memories.get(userId) ?? []).slice(0, limit);
  },

  async saveTrainingPlan(input: {
    userId: string;
    sessionId: string | null;
    narrative: string;
    focusAreas: string[];
    drills: Array<{ title: string; description: string; durationMinutes: number }>;
  }) {
    const plan: StoredTrainingPlan = {
      id: randomUUID(),
      ...input,
      createdAt: new Date().toISOString(),
    };
    const list = store().plans.get(input.userId) ?? [];
    list.unshift(plan);
    store().plans.set(input.userId, list);
    return plan;
  },

  async latestTrainingPlan(userId: string) {
    return (store().plans.get(userId) ?? [])[0] ?? null;
  },
};
