"use client";

import { useState } from "react";
import { Markdown } from "@/components/markdown";

export default function ResearchPage() {
  const [topic, setTopic] = useState(
    "Should social media platforms be treated as common carriers?",
  );
  const [side, setSide] = useState<"proposition" | "opposition">("proposition");
  const [result, setResult] = useState<{ brief: string; viewpoints: string[] } | null>(
    null,
  );
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function run() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/research", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic, side }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Research failed");
      setResult(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Research error");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="section stack">
      <div>
        <h2>Research assistant</h2>
        <p className="support">
          Prepare evidence themes and viewpoint lenses before you step onto the floor.
        </p>
      </div>
      <div className="panel stack">
        <label className="field">
          Topic
          <textarea value={topic} onChange={(e) => setTopic(e.target.value)} />
        </label>
        <label className="field">
          Side
          <select
            value={side}
            onChange={(e) => setSide(e.target.value as "proposition" | "opposition")}
          >
            <option value="proposition">Proposition</option>
            <option value="opposition">Opposition</option>
          </select>
        </label>
        <button className="btn" type="button" onClick={run} disabled={busy}>
          {busy ? "Researching…" : "Generate brief"}
        </button>
        {error ? <p className="error">{error}</p> : null}
      </div>
      {result ? (
        <div className="panel stack">
          <h3 style={{ fontFamily: "var(--am-font-display)", margin: 0 }}>Brief</h3>
          <Markdown content={result.brief} />
          {result.viewpoints.length > 0 ? (
            <div>
              <h3 style={{ fontFamily: "var(--am-font-display)", margin: "0 0 0.5rem" }}>
                Lenses
              </h3>
              <ul className="list-plain">
                {result.viewpoints.map((v) => (
                  <li key={v}>{v}</li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
