import {
  canRequestOpponentTurn,
  createInitialState,
  reduceDebateState,
  type CreateDebateConfig,
} from "@argumentor/debate-core";
import { hasLlmCredentials, streamOpponentTurn } from "@argumentor/agents";
import { NextResponse } from "next/server";
import { requireAppUser } from "@/lib/auth";
import { debateRepo } from "@/lib/repo";
import { traceLlmCall } from "@/lib/llm-trace";

export async function POST(
  _req: Request,
  context: { params: Promise<{ id: string }> },
) {
  const user = await requireAppUser();
  const { id } = await context.params;
  const session = await debateRepo.getSession(id);
  if (!session || session.userId !== user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
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

  if (session.status === "pending") {
    state = reduceDebateState(state, { type: "START" });
  }

  if (!canRequestOpponentTurn(state) && session.status !== "pending") {
    return NextResponse.json(
      { error: "Not awaiting opponent turn", state },
      { status: 409 },
    );
  }

  const turns = await debateRepo.listTurns(id);
  const skill = await debateRepo.getSkillProfile(user.id);

  if (!hasLlmCredentials()) {
    const content = demoOpponentTurn(session.topic, session.userSide, state.round);
    await debateRepo.addTurn({
      sessionId: id,
      speaker: "opponent",
      content,
      round: state.round,
      phase: state.phase,
    });
    const next = reduceDebateState(
      { ...state, status: "active" },
      { type: "OPPONENT_TURN_COMPLETED" },
    );
    await debateRepo.updateSession(id, {
      status: next.status,
      phase: next.phase,
      round: next.round,
      awaitingSpeaker: next.awaitingSpeaker,
    });
    return NextResponse.json({ content, demo: true, session: next });
  }

  const result = await traceLlmCall(
    "opponent_stream",
    { sessionId: id, round: state.round },
    async () =>
      streamOpponentTurn({
        config: session.config as CreateDebateConfig,
        phase: state.phase,
        round: state.round,
        transcript: turns.map((t) => ({ speaker: t.speaker, content: t.content })),
        skillSnapshot: skill.dimensions,
      }),
  );

  const encoder = new TextEncoder();
  let full = "";

  const stream = new ReadableStream({
    async start(controller) {
      try {
        for await (const chunk of result.textStream) {
          full += chunk;
          controller.enqueue(encoder.encode(chunk));
        }
        await debateRepo.addTurn({
          sessionId: id,
          speaker: "opponent",
          content: full,
          round: state.round,
          phase: state.phase,
        });
        const next = reduceDebateState(
          { ...state, status: "active" },
          { type: "OPPONENT_TURN_COMPLETED" },
        );
        await debateRepo.updateSession(id, {
          status: next.status,
          phase: next.phase,
          round: next.round,
          awaitingSpeaker: next.awaitingSpeaker,
        });
        controller.close();
      } catch (error) {
        controller.error(error);
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "X-Argumentor-Round": String(state.round),
      "X-Argumentor-Phase": state.phase,
    },
  });
}

function demoOpponentTurn(topic: string, userSide: string, round: number) {
  return `Round ${round} — opposing ${userSide} on “${topic}”.

Your opening claim rests on an unexamined assumption: that the status quo’s costs are decisive without a clear baseline. Define the metric of success you are optimizing for, then show why your mechanism outperforms the strongest alternative—not a strawman.

If your case depends on a single causal chain, pressure-test the weakest link. I will concede nothing you have not earned with evidence or entailment.

(Demo mode: add ANTHROPIC_API_KEY or OPENAI_API_KEY for a live opponent.)`;
}
