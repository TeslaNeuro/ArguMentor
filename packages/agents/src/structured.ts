import { generateObject, generateText } from "ai";
import type { LanguageModelV1 } from "ai";
import type { z } from "zod";

/**
 * Many OpenRouter free models ignore tool/JSON mode, truncate braces,
 * or return an alternate shape. Try generateObject, salvage its text,
 * then plain-text JSON, then caller fallback.
 */
export async function generateStructured<T>(input: {
  model: LanguageModelV1;
  schema: z.ZodType<T>;
  system: string;
  prompt: string;
  temperature?: number;
  fallback: () => T;
  /** Map alternate model shapes into the target schema before Zod parse. */
  normalize?: (value: unknown) => unknown;
  /** Concrete JSON example embedded in prompts for weak models. */
  exampleJson?: string;
}): Promise<T> {
  const exampleBlock = input.exampleJson
    ? `\nExact JSON shape example:\n${input.exampleJson}\n`
    : "";

  const system = `${input.system}

CRITICAL OUTPUT RULES:
- Respond with a single complete JSON object only.
- No markdown, no tables, no prose, no code fences.
- Close every brace. Match the example shape exactly.
${exampleBlock}`;

  const parseCandidate = (raw: unknown): T | null => {
    try {
      const value =
        typeof raw === "string" ? extractJson(raw) : (raw as unknown);
      const normalized = input.normalize ? input.normalize(value) : value;
      return input.schema.parse(normalized);
    } catch {
      return null;
    }
  };

  try {
    const { object } = await generateObject({
      model: input.model,
      schema: input.schema,
      system,
      prompt: input.prompt,
      temperature: input.temperature ?? 0.2,
      mode: "json",
    });
    const normalized = input.normalize ? input.normalize(object) : object;
    return input.schema.parse(normalized);
  } catch (primaryError) {
    console.warn("[generateStructured] generateObject failed, salvaging", primaryError);
    const salvaged = parseCandidate(getErrorText(primaryError));
    if (salvaged) return salvaged;
  }

  try {
    const { text } = await generateText({
      model: input.model,
      system,
      prompt: `${input.prompt}

Return ONLY a raw JSON object matching the example. Do not wrap in markdown.`,
      temperature: input.temperature ?? 0.2,
    });
    const parsed = parseCandidate(text);
    if (parsed) return parsed;
    throw new Error("Parsed JSON did not match schema");
  } catch (secondaryError) {
    console.warn("[generateStructured] text JSON failed, using fallback", secondaryError);
    return input.fallback();
  }
}

function getErrorText(error: unknown): string | null {
  if (!error || typeof error !== "object") return null;
  const record = error as Record<string, unknown>;
  if (typeof record.text === "string") return record.text;
  const cause = record.cause;
  if (cause && typeof cause === "object" && "text" in cause) {
    const text = (cause as { text?: unknown }).text;
    if (typeof text === "string") return text;
  }
  return null;
}

export function extractJson(text: string): unknown {
  const cleaned = text
    .trim()
    .replace(/^\uFEFF/, "")
    .replace(/[“”]/g, '"')
    .replace(/[‘’]/g, "'");

  const candidates = [cleaned];

  const fenced = cleaned.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fenced?.[1]) candidates.push(fenced[1].trim());

  const start = cleaned.indexOf("{");
  if (start >= 0) {
    candidates.push(repairBraces(cleaned.slice(start)));
  }

  for (const candidate of candidates) {
    try {
      return JSON.parse(candidate);
    } catch {
      try {
        return JSON.parse(repairBraces(candidate));
      } catch {
        // continue
      }
    }
  }

  throw new Error("No JSON object found in model response");
}

/** Close truncated objects/arrays so near-valid model JSON can still parse. */
function repairBraces(text: string): string {
  let inString = false;
  let escape = false;
  const stack: string[] = [];

  for (const ch of text) {
    if (inString) {
      if (escape) {
        escape = false;
      } else if (ch === "\\") {
        escape = true;
      } else if (ch === '"') {
        inString = false;
      }
      continue;
    }

    if (ch === '"') {
      inString = true;
    } else if (ch === "{" || ch === "[") {
      stack.push(ch === "{" ? "}" : "]");
    } else if (ch === "}" || ch === "]") {
      if (stack.length && stack[stack.length - 1] === ch) stack.pop();
    }
  }

  let repaired = text.trimEnd();
  // If we ended mid-string, close it.
  if (inString) repaired += '"';
  // Drop a trailing comma before we close.
  repaired = repaired.replace(/,\s*$/, "");
  while (stack.length) repaired += stack.pop();
  return repaired;
}
