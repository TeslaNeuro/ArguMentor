import { generateText } from "ai";
import { getModel } from "./model";
import {
  hasLlmCredentials,
  MISSING_LLM_KEY_MESSAGE,
  type LlmCredentials,
} from "./credentials";

export async function runResearchAgent(input: {
  topic: string;
  side: "proposition" | "opposition";
  credentials?: LlmCredentials | null;
}): Promise<{ brief: string; viewpoints: string[] }> {
  if (!hasLlmCredentials(input.credentials)) {
    throw new Error(MISSING_LLM_KEY_MESSAGE);
  }

  const { text } = await generateText({
    model: getModel("research", input.credentials),
    system: `You are ArguMentor's Research Agent. Summarize major viewpoints and prepare evidence themes for a debate. Mark uncertainty. Do not invent precise statistics or fake citations.

Write pure Markdown only — never HTML tags (no <br>, <p>, <div>, etc.). Prefer headings and bullet lists. If you use a table, keep each cell to a single line; put separate points in separate rows or as a list under a heading instead of stacking lines inside a cell.`,
    prompt: `Topic: ${input.topic}\nPrepare a brief for the ${input.side} side. Include 3 viewpoint lenses.`,
    temperature: 0.4,
  });

  return {
    brief: text,
    viewpoints: ["Economic", "Ethical", "Empirical"],
  };
}
