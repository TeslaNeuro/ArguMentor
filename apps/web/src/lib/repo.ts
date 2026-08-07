import { memoryDb } from "@argumentor/db";
import type { CreateDebateConfig, DebatePhase, JudgeFeedback, TurnAnalysis } from "@argumentor/debate-core";

/**
 * Data access facade. Today: in-memory (and Prisma-ready schema).
 * When DATABASE_URL is configured in production, swap implementations
 * without changing route handlers.
 */
export const debateRepo = {
  upsertUser: memoryDb.upsertUser,
  getUserByClerkId: memoryDb.getUserByClerkId,
  createSession: memoryDb.createSession,
  getSession: memoryDb.getSession,
  listSessions: memoryDb.listSessions,
  updateSession: memoryDb.updateSession,
  addTurn: memoryDb.addTurn,
  listTurns: memoryDb.listTurns,
  updateTurnAnalysis: memoryDb.updateTurnAnalysis,
  saveEvaluation: memoryDb.saveEvaluation,
  getEvaluation: memoryDb.getEvaluation,
  getSkillProfile: memoryDb.getSkillProfile,
  applyEvaluationToSkill: memoryDb.applyEvaluationToSkill,
  addMemory: memoryDb.addMemory,
  listMemories: memoryDb.listMemories,
  saveTrainingPlan: memoryDb.saveTrainingPlan,
  latestTrainingPlan: memoryDb.latestTrainingPlan,
};

export type { CreateDebateConfig, DebatePhase, JudgeFeedback, TurnAnalysis };
