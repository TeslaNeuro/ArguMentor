"use client";

import { Markdown } from "@/components/markdown";

type Evaluation = {
  scores: Record<string, number>;
  summary: string;
  feedback: {
    strengths: string[];
    improvements: string[];
    keyMistakes: Array<{ mistake: string; whyItMatters: string; howToFix: string }>;
    verdict: string;
  };
  verdict: string;
};

type Plan = {
  narrative: string;
  focusAreas: string[];
  drills: Array<{ title: string; description: string; durationMinutes: number }>;
} | null;

export function Scorecard({
  evaluation,
  plan,
}: {
  evaluation: Evaluation;
  plan: Plan;
}) {
  const scores = evaluation.scores;
  const feedback = evaluation.feedback;

  return (
    <div className="stack">
      <div className="panel stack">
        <h2>Judge scorecard</h2>
        <p className="support" style={{ marginBottom: 0 }}>
          Verdict: <strong>{evaluation.verdict.replaceAll("_", " ")}</strong>
        </p>
        <Markdown content={evaluation.summary} />
        <div className="score-grid">
          {Object.entries(scores).map(([key, value]) => (
            <div className="score" key={key}>
              <strong>{Number(value).toFixed(1)}</strong>
              <span>{key}</span>
              <div className="meter">
                <i style={{ width: `${(Number(value) / 5) * 100}%` }} />
              </div>
            </div>
          ))}
        </div>
        <div className="grid-2">
          <div>
            <h3 style={{ fontFamily: "var(--am-font-display)" }}>Strengths</h3>
            <ul className="list-plain">
              {feedback.strengths.map((s) => (
                <li key={s}>
                  <Markdown inline content={s} />
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h3 style={{ fontFamily: "var(--am-font-display)" }}>Improvements</h3>
            <ul className="list-plain">
              {feedback.improvements.map((s) => (
                <li key={s}>
                  <Markdown inline content={s} />
                </li>
              ))}
            </ul>
          </div>
        </div>
        <div>
          <h3 style={{ fontFamily: "var(--am-font-display)" }}>Key mistakes</h3>
          <div className="stack">
            {feedback.keyMistakes.map((m) => (
              <div key={m.mistake} className="panel" style={{ background: "rgba(14,21,18,0.5)" }}>
                <Markdown content={`**${m.mistake}**`} />
                <Markdown content={m.whyItMatters} />
                <Markdown content={m.howToFix} />
              </div>
            ))}
          </div>
        </div>
      </div>

      {plan ? (
        <div className="panel stack">
          <h2>Coach plan</h2>
          <Markdown content={plan.narrative} />
          <div>
            <h3 style={{ fontFamily: "var(--am-font-display)" }}>Focus areas</h3>
            <ul className="list-plain">
            {plan.focusAreas.map((f) => (
              <li key={f}>
                <Markdown inline content={f} />
              </li>
            ))}
            </ul>
          </div>
          <div className="stack">
            {plan.drills.map((d) => (
              <div key={d.title}>
                <strong>
                  {d.title} · {d.durationMinutes}m
                </strong>
                <div className="muted" style={{ margin: "0.25rem 0 0" }}>
                  <Markdown content={d.description} />
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
