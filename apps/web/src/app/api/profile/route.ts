import { NextResponse } from "next/server";
import { requireAppUser } from "@/lib/auth";
import { debateRepo } from "@/lib/repo";

export async function GET() {
  const user = await requireAppUser();
  const skill = await debateRepo.getSkillProfile(user.id);
  const sessions = await debateRepo.listSessions(user.id);
  const memories = await debateRepo.listMemories(user.id, 12);
  const plan = await debateRepo.latestTrainingPlan(user.id);
  return NextResponse.json({
    user: {
      id: user.id,
      email: user.email,
      displayName: user.displayName,
    },
    skill,
    sessions: sessions.slice(0, 20),
    memories,
    plan,
  });
}
