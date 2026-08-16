export * from "./client";
export * from "./memory-store";
export { prismaDb } from "./prisma-store";

import { isDatabaseConfigured } from "./client";
import { memoryDb, type DebateRepository } from "./memory-store";
import { prismaDb } from "./prisma-store";

export function createDebateRepository(): DebateRepository {
  return isDatabaseConfigured() ? prismaDb : memoryDb;
}

export const debateRepository: DebateRepository = createDebateRepository();
