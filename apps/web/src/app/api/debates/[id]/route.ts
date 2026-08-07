import { NextResponse } from "next/server";
import { requireAppUser } from "@/lib/auth";
import { debateRepo } from "@/lib/repo";

export async function GET(
  _req: Request,
  context: { params: Promise<{ id: string }> },
) {
  const user = await requireAppUser();
  const { id } = await context.params;
  const session = await debateRepo.getSession(id);
  if (!session || session.userId !== user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  const turns = await debateRepo.listTurns(id);
  const evaluation = await debateRepo.getEvaluation(id);
  const skill = await debateRepo.getSkillProfile(user.id);
  const plan = await debateRepo.latestTrainingPlan(user.id);
  return NextResponse.json({ session, turns, evaluation, skill, plan });
}
