import type { JudgeFeedback } from "@argumentor/debate-core";
import { debateRepo } from "./repo";

export async function persistEvaluationMemories(
  userId: string,
  sessionId: string,
  feedback: JudgeFeedback,
) {
  await debateRepo.addMemory({
    userId,
    kind: "evaluation_summary",
    content: feedback.summary,
    payload: { sessionId, scores: feedback.scores },
  });
  for (const mistake of feedback.keyMistakes.slice(0, 2)) {
    await debateRepo.addMemory({
      userId,
      kind: "weakness",
      content: mistake.mistake,
      payload: mistake,
    });
  }
}
