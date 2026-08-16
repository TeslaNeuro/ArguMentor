import {
  buildJudgeSystemPrompt,
  JudgeFeedbackSchema,
  oppositeSide,
  type CreateDebateConfig,
  type JudgeFeedback,
} from "@argumentor/debate-core";
import { getModel } from "./model";
import { hasLlmCredentials, type LlmCredentials } from "./credentials";
import { generateStructured } from "./structured";

const JUDGE_EXAMPLE = `{
  "scores": {
    "clarity": 3.0,
    "evidence": 2.5,
    "logic": 3.0,
    "persuasiveness": 2.8,
    "responsiveness": 3.0,
    "fallacyAvoidance": 3.2,
    "overall": 2.9
  },
  "summary": "One-paragraph overall assessment of the user's debate performance.",
  "strengths": ["Strength one", "Strength two"],
  "improvements": ["Improvement one", "Improvement two"],
  "keyMistakes": [
    {
      "mistake": "Short label for the mistake",
      "whyItMatters": "Why this hurts the case",
      "howToFix": "Concrete fix the user can practice"
    }
  ],
  "verdict": "draw"
}`;

export async function runJudgeAgent(input: {
  config: CreateDebateConfig;
  transcript: Array<{ speaker: string; content: string }>;
  credentials?: LlmCredentials | null;
}): Promise<JudgeFeedback> {
  if (!hasLlmCredentials(input.credentials)) {
    return mockJudgeFeedback(input.config.topic);
  }

  const opponentSide = oppositeSide(input.config.userSide);
  const transcript = input.transcript
    .map((t) => `${t.speaker.toUpperCase()}: ${t.content}`)
    .join("\n\n");

  return generateStructured({
    model: getModel("judge", input.credentials),
    schema: JudgeFeedbackSchema,
    system: buildJudgeSystemPrompt({
      topic: input.config.topic,
      userSide: input.config.userSide,
      opponentSide,
    }),
    prompt: `Full debate transcript:\n\n${transcript}\n\nProduce the evaluation now.`,
    temperature: 0.3,
    exampleJson: JUDGE_EXAMPLE,
    normalize: coerceJudgePayload,
    fallback: () => mockJudgeFeedback(input.config.topic),
  });
}

/** Accept common free-model shapes and map them into JudgeFeedback. */
export function coerceJudgePayload(value: unknown): unknown {
  if (!value || typeof value !== "object") return value;
  const raw = value as Record<string, unknown>;

  if (raw.scores && typeof raw.scores === "object") {
    return {
      ...raw,
      verdict: normalizeVerdict(raw.verdict),
      strengths: asStringArray(raw.strengths),
      improvements: asStringArray(raw.improvements),
      keyMistakes: asKeyMistakes(raw.keyMistakes),
      summary:
        typeof raw.summary === "string"
          ? raw.summary
          : summarizeFromFeedback(raw),
    };
  }

  // Flat score fields + feedback map (what openrouter/free often returns)
  const scoreKeys = [
    "clarity",
    "evidence",
    "logic",
    "persuasiveness",
    "responsiveness",
    "fallacyAvoidance",
    "overall",
  ] as const;

  const hasFlatScores = scoreKeys.some((k) => typeof raw[k] === "number");
  if (!hasFlatScores) return value;

  const scores: Record<string, number> = {};
  for (const key of scoreKeys) {
    const n = Number(raw[key]);
    scores[key] = Number.isFinite(n) ? clampScore(n) : 2.5;
  }

  const feedback =
    raw.feedback && typeof raw.feedback === "object"
      ? (raw.feedback as Record<string, unknown>)
      : {};

  const improvements = Object.entries(feedback)
    .filter(([, v]) => typeof v === "string" && v.trim())
    .map(([k, v]) => `${k}: ${String(v).trim()}`);

  const keyMistakes = improvements.slice(0, 3).map((text) => {
    const [head, ...rest] = text.split(":");
    return {
      mistake: (head || "Argument gap").trim(),
      whyItMatters: rest.join(":").trim() || text,
      howToFix: "Rewrite with a clear claim, warrant, and concrete evidence.",
    };
  });

  return {
    scores,
    summary:
      typeof raw.summary === "string"
        ? raw.summary
        : improvements[0] || "Judge produced dimension notes without a formal summary.",
    strengths: asStringArray(raw.strengths).length
      ? asStringArray(raw.strengths)
      : ["Showed up and stated a position"],
    improvements: improvements.length
      ? improvements.map((line) => line.slice(0, 220))
      : asStringArray(raw.improvements),
    keyMistakes: keyMistakes.length
      ? keyMistakes
      : [
          {
            mistake: "Incomplete case structure",
            whyItMatters: "Judges need claim, evidence, and reasoning.",
            howToFix: "Use claim → evidence → impact on every contention.",
          },
        ],
    verdict: normalizeVerdict(raw.verdict),
  };
}

function clampScore(n: number) {
  return Math.max(0, Math.min(5, n));
}

function normalizeVerdict(value: unknown): JudgeFeedback["verdict"] {
  if (value === "user_wins" || value === "opponent_wins" || value === "draw") {
    return value;
  }
  if (typeof value === "string") {
    const v = value.toLowerCase();
    if (v.includes("user") || v.includes("proposition") || v.includes("affirm")) {
      return "user_wins";
    }
    if (v.includes("opponent") || v.includes("neg") || v.includes("opp")) {
      return "opponent_wins";
    }
  }
  return "draw";
}

function asStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === "string");
}

function asKeyMistakes(value: unknown) {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => {
      if (!item || typeof item !== "object") return null;
      const row = item as Record<string, unknown>;
      if (
        typeof row.mistake === "string" &&
        typeof row.whyItMatters === "string" &&
        typeof row.howToFix === "string"
      ) {
        return {
          mistake: row.mistake,
          whyItMatters: row.whyItMatters,
          howToFix: row.howToFix,
        };
      }
      return null;
    })
    .filter(Boolean);
}

function summarizeFromFeedback(raw: Record<string, unknown>): string {
  if (typeof raw.summary === "string") return raw.summary;
  const feedback = raw.feedback;
  if (feedback && typeof feedback === "object") {
    const first = Object.values(feedback as Record<string, unknown>).find(
      (v) => typeof v === "string",
    );
    if (typeof first === "string") return first.slice(0, 400);
  }
  return "Evaluation completed.";
}

function mockJudgeFeedback(topic: string): JudgeFeedback {
  return {
    scores: {
      clarity: 3.2,
      evidence: 2.8,
      logic: 3.0,
      persuasiveness: 3.1,
      responsiveness: 3.0,
      fallacyAvoidance: 2.9,
      overall: 3.0,
    },
    summary: `Evaluated debate on "${topic}". Structured judge output was unavailable from the model; scores are a conservative baseline.`,
    strengths: [
      "Maintained a coherent position",
      "Engaged the opponent's framing",
    ],
    improvements: [
      "Cite more concrete evidence",
      "Define key terms earlier",
      "Address the strongest opposing steelman",
    ],
    keyMistakes: [
      {
        mistake: "Limited evidence specificity",
        whyItMatters: "Vague claims are easy to dismiss under cross-examination.",
        howToFix: "Prepare 2–3 concrete examples or data points before opening.",
      },
    ],
    verdict: "draw",
  };
}
