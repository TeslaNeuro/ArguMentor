import {
  canRequestOpponentTurn,
  createInitialState,
  reduceDebateState,
  type CreateDebateConfig,
} from "@argumentor/debate-core";
import { streamOpponentTurn } from "@argumentor/agents";
import { NextResponse } from "next/server";
import { requireAppUser } from "@/lib/auth";
import { debateRepo } from "@/lib/repo";
import { traceLlmCall } from "@/lib/llm-trace";
import { isLlmCredentials, requireLlmCredentials } from "@/lib/llm-request";
import { enforceRateLimit } from "@/lib/rate-limit";

export async function POST(
  req: Request,
  context: { params: Promise<{ id: string }> },
) {
  const user = await requireAppUser();
  const limited = await enforceRateLimit(`opponent:${user.id}`, 20);
  if (limited) return limited;

  const credentials = requireLlmCredentials(req);
  if (!isLlmCredentials(credentials)) return credentials;

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
        credentials,
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
