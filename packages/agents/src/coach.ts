import { buildCoachSystemPrompt, type JudgeFeedback, type SkillDimensions } from "@argumentor/debate-core";
import { z } from "zod";
import { getModel } from "./model";
import { hasLlmCredentials, type LlmCredentials } from "./credentials";
import { generateStructured } from "./structured";

export const CoachPlanSchema = z.object({
  narrative: z.string(),
  focusAreas: z.array(z.string()).min(1).max(5),
  drills: z.array(
    z.object({
      title: z.string(),
      description: z.string(),
      durationMinutes: z.number().int().min(5).max(60),
    }),
  ),
});
export type CoachPlan = z.infer<typeof CoachPlanSchema>;

export async function runCoachAgent(input: {
  evaluation: JudgeFeedback;
  skillProfile: SkillDimensions;
  credentials?: LlmCredentials | null;
}): Promise<CoachPlan> {
  const fallback = (): CoachPlan => ({
    narrative:
      "You're building a dependable baseline. Next sessions should pressure-test evidence quality and definitional clarity.",
    focusAreas: ["Evidence specificity", "Premise definition", "Rebuttal structure"],
    drills: [
      {
        title: "Claim–warrant–impact",
        description: "Rewrite your last opening using CWI structure for every contention.",
        durationMinutes: 15,
      },
      {
        title: "Steelman reverse",
        description: "Write the strongest opposing case for 10 minutes, then refute it.",
        durationMinutes: 20,
      },
      {
        title: "Fallacy hunt",
        description: "Label fallacies in a recorded debate transcript (yours or public).",
        durationMinutes: 15,
      },
    ],
  });

  if (!hasLlmCredentials(input.credentials)) {
    return fallback();
  }

  return generateStructured({
    model: getModel("coach", input.credentials),
    schema: CoachPlanSchema,
    system: buildCoachSystemPrompt(),
    prompt: JSON.stringify({
      evaluation: input.evaluation,
      skillProfile: input.skillProfile,
    }),
    temperature: 0.5,
    fallback,
  });
}
