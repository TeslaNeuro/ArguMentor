import {
  canSubmitUserTurn,
  createInitialState,
  reduceDebateState,
  type CreateDebateConfig,
} from "@argumentor/debate-core";
import { runAnalysisAgent, runCoachAgent, runJudgeAgent } from "@argumentor/agents";
import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAppUser } from "@/lib/auth";
import { debateRepo } from "@/lib/repo";
import { traceLlmCall } from "@/lib/llm-trace";
import { trackServer } from "@/lib/server-analytics";

const BodySchema = z.object({
  content: z.string().min(12).max(8000),
});

export async function POST(
  req: Request,
  context: { params: Promise<{ id: string }> },
) {
  const user = await requireAppUser();
  const { id } = await context.params;
  const session = await debateRepo.getSession(id);
  if (!session || session.userId !== user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const parsed = BodySchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid turn" }, { status: 400 });
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

  if (!canSubmitUserTurn(state)) {
    return NextResponse.json({ error: "Not your turn", state }, { status: 409 });
  }

  const analysis = await traceLlmCall("turn_analysis", { sessionId: id }, () =>
    runAnalysisAgent(parsed.data.content),
  );

  const turn = await debateRepo.addTurn({
    sessionId: id,
    speaker: "user",
    content: parsed.data.content,
    round: state.round,
    phase: state.phase,
    analysis,
  });

  const next = reduceDebateState(state, { type: "USER_TURN_SUBMITTED" });
  await debateRepo.updateSession(id, {
    status: next.status,
    phase: next.phase,
    round: next.round,
    awaitingSpeaker: next.awaitingSpeaker,
  });

  let evaluation = null;
  let skill = await debateRepo.getSkillProfile(user.id);
  let plan = null;

  if (next.status === "evaluating") {
    const turns = await debateRepo.listTurns(id);
    const feedback = await traceLlmCall("judge", { sessionId: id }, () =>
      runJudgeAgent({
        config: session.config as CreateDebateConfig,
        transcript: turns.map((t) => ({ speaker: t.speaker, content: t.content })),
      }),
    );
    evaluation = await debateRepo.saveEvaluation(id, feedback);
    skill = await debateRepo.applyEvaluationToSkill(user.id, feedback.scores);
    plan = await runCoachAgent({
      evaluation: feedback,
      skillProfile: skill.dimensions,
    });
    await debateRepo.saveTrainingPlan({
      userId: user.id,
      sessionId: id,
      narrative: plan.narrative,
      focusAreas: plan.focusAreas,
      drills: plan.drills,
    });
    await debateRepo.addMemory({
      userId: user.id,
      kind: "evaluation_summary",
      content: feedback.summary,
      payload: { sessionId: id, scores: feedback.scores },
    });
    for (const mistake of feedback.keyMistakes.slice(0, 2)) {
      await debateRepo.addMemory({
        userId: user.id,
        kind: "weakness",
        content: mistake.mistake,
        payload: mistake,
      });
    }
    await debateRepo.updateSession(id, {
      status: "completed",
      phase: "completed",
      awaitingSpeaker: "none",
      completedAt: new Date().toISOString(),
    });
    trackServer("debate_completed", { verdict: feedback.verdict });
  }

  return NextResponse.json({
    turn,
    analysis,
    session: next.status === "evaluating" ? { ...next, status: "completed", phase: "completed" } : next,
    evaluation,
    skill,
    plan,
  });
}
