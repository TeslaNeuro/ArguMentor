import { NextResponse } from "next/server";
import { requireAppUser } from "@/lib/auth";
import { debateRepo } from "@/lib/repo";

export async function GET() {
  try {
    const user = await requireAppUser();
    let skill = await debateRepo.getSkillProfile(user.id);
    if (skill.evaluationsApplied === 0) {
      const sessions = await debateRepo.listSessions(user.id);
      for (const session of [...sessions].reverse()) {
        const evaluation = await debateRepo.getEvaluation(session.id);
        if (evaluation?.scores) {
          skill = await debateRepo.applyEvaluationToSkill(user.id, evaluation.scores);
        }
      }
    }
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
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load profile";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
