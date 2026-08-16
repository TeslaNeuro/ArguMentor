import {
  createInitialState,
  reduceDebateState,
  type CreateDebateConfig,
} from "@argumentor/debate-core";
import { runCoachAgent, runJudgeAgent } from "@argumentor/agents";
import { NextResponse } from "next/server";
import { requireAppUser } from "@/lib/auth";
import { persistEvaluationMemories } from "@/lib/evaluation-memories";
import { isLlmCredentials, requireLlmCredentials } from "@/lib/llm-request";
import { debateRepo } from "@/lib/repo";
import { enforceRateLimit } from "@/lib/rate-limit";
import { traceLlmCall } from "@/lib/llm-trace";

export async function POST(
  req: Request,
  context: { params: Promise<{ id: string }> },
) {
  const user = await requireAppUser();
  const limited = await enforceRateLimit(`end:${user.id}`, 20);
  if (limited) return limited;

  const credentials = requireLlmCredentials(req);
  if (!isLlmCredentials(credentials)) return credentials;

  const { id } = await context.params;
  const session = await debateRepo.getSession(id);
  if (!session || session.userId !== user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const existing = await debateRepo.getEvaluation(id);
  if (existing) {
    const skill = await debateRepo.getSkillProfile(user.id);
    const plan = await debateRepo.latestTrainingPlan(user.id);
    return NextResponse.json({ evaluation: existing, skill, plan });
  }

  let state = createInitialState(session.config as CreateDebateConfig);
  state = {
    ...state,
    status: session.status as typeof state.status,
    phase: session.phase as typeof state.phase,
    round: session.round,
    maxRounds: session.maxRounds,
    awaitingSpeaker: session.awaitingSpeaker as typeof state.awaitingSpeaker,
  };
  state = reduceDebateState({ ...state, status: "active" }, { type: "END_DEBATE" });

  const turns = await debateRepo.listTurns(id);
  if (turns.filter((t) => t.speaker === "user").length === 0) {
    return NextResponse.json(
      { error: "Submit at least one turn before ending" },
      { status: 400 },
    );
  }

  const feedback = await traceLlmCall("judge_end", { sessionId: id }, () =>
    runJudgeAgent({
      config: session.config as CreateDebateConfig,
      transcript: turns.map((t) => ({ speaker: t.speaker, content: t.content })),
      credentials,
    }),
  );

  const evaluation = await debateRepo.saveEvaluation(id, feedback);
  const skill = await debateRepo.applyEvaluationToSkill(user.id, feedback.scores);
  const plan = await runCoachAgent({
    evaluation: feedback,
    skillProfile: skill.dimensions,
    credentials,
  });
  await debateRepo.saveTrainingPlan({
    userId: user.id,
    sessionId: id,
    narrative: plan.narrative,
    focusAreas: plan.focusAreas,
    drills: plan.drills,
  });
  await persistEvaluationMemories(user.id, id, feedback);
  await debateRepo.updateSession(id, {
    status: "completed",
    phase: "completed",
    awaitingSpeaker: "none",
    completedAt: new Date().toISOString(),
  });

  return NextResponse.json({ evaluation, skill, plan });
}
