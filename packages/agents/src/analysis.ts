import {
  buildAnalysisSystemPrompt,
  TurnAnalysisSchema,
  type TurnAnalysis,
} from "@argumentor/debate-core";
import { getModel } from "./model";
import { hasLlmCredentials, type LlmCredentials } from "./credentials";
import { generateStructured } from "./structured";

export async function runAnalysisAgent(
  turnText: string,
  credentials?: LlmCredentials | null,
): Promise<TurnAnalysis> {
  if (!hasLlmCredentials(credentials)) {
    return heuristicAnalysis(turnText);
  }

  return generateStructured({
    model: getModel("analysis", credentials),
    schema: TurnAnalysisSchema,
    system: buildAnalysisSystemPrompt(),
    prompt: `Analyze this user debate turn:\n\n${turnText}`,
    temperature: 0.2,
    fallback: () => heuristicAnalysis(turnText),
  });
}

function heuristicAnalysis(turnText: string): TurnAnalysis {
  const snippet = turnText.trim().slice(0, 160) || "No claim extracted";
  const hasEvidenceCue = /\b(because|since|according to|data|study|evidence|for example)\b/i.test(
    turnText,
  );
  return {
    claims: [snippet],
    evidence: hasEvidenceCue ? ["Evidence cue detected in wording"] : [],
    assumptions: ["Assumes shared definitions of key terms"],
    conclusion: null,
    clarity: turnText.length > 80 ? 3 : 2,
    consistency: 3,
    persuasiveness: hasEvidenceCue ? 3 : 2,
    weaknesses: [
      {
        type: hasEvidenceCue ? "vague_claim" : "weak_evidence",
        explanation: hasEvidenceCue
          ? "The turn could define terms more precisely."
          : "Evidence was thin or implicit.",
        teachingNote: hasEvidenceCue
          ? "Name the specific right, policy, or mechanism you mean."
          : "Pair each major claim with at least one concrete support.",
      },
    ],
  };
}
