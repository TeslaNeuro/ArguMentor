"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { LlmKeyBanner } from "@/components/llm-key-banner";
import { track } from "@/lib/analytics";

export default function NewDebatePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    topic: "Governments should ban facial recognition in public spaces.",
    userSide: "proposition",
    difficulty: "intermediate",
    personality: "analytical",
    format: "freeform",
    maxRounds: 3,
    timeLimitSeconds: 180,
  });

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/debates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create debate");
      track("debate_created_client", { difficulty: form.difficulty });
      router.push(`/debate/${data.session.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setLoading(false);
    }
  }

  return (
    <section className="section">
      <h2>Configure your debate</h2>
      <p className="support">
        Choose the arena. ArguMentor will open as your opponent, adapt to your skill, and
        judge the round when it ends.
      </p>
      <LlmKeyBanner />
      <form className="panel stack" onSubmit={onSubmit}>
        <label className="field">
          Topic
          <textarea
            value={form.topic}
            onChange={(e) => setForm({ ...form, topic: e.target.value })}
            required
            minLength={8}
          />
        </label>
        <div className="grid-2">
          <label className="field">
            Your side
            <select
              value={form.userSide}
              onChange={(e) => setForm({ ...form, userSide: e.target.value })}
            >
              <option value="proposition">Proposition</option>
              <option value="opposition">Opposition</option>
            </select>
          </label>
          <label className="field">
            Difficulty
            <select
              value={form.difficulty}
              onChange={(e) => setForm({ ...form, difficulty: e.target.value })}
            >
              <option value="novice">Novice</option>
              <option value="intermediate">Intermediate</option>
              <option value="advanced">Advanced</option>
              <option value="elite">Elite</option>
            </select>
          </label>
          <label className="field">
            Opponent personality
            <select
              value={form.personality}
              onChange={(e) => setForm({ ...form, personality: e.target.value })}
            >
              <option value="analytical">Analytical</option>
              <option value="socratic">Socratic</option>
              <option value="aggressive">Aggressive</option>
              <option value="diplomatic">Diplomatic</option>
              <option value="devil_advocate">Devil&apos;s advocate</option>
            </select>
          </label>
          <label className="field">
            Format
            <select
              value={form.format}
              onChange={(e) => setForm({ ...form, format: e.target.value })}
            >
              <option value="freeform">Freeform</option>
              <option value="lincoln_douglas">Lincoln–Douglas</option>
              <option value="oxford">Oxford</option>
              <option value="british_parliamentary">British Parliamentary</option>
            </select>
          </label>
          <label className="field">
            Rounds
            <input
              type="number"
              min={1}
              max={12}
              value={form.maxRounds}
              onChange={(e) => setForm({ ...form, maxRounds: Number(e.target.value) })}
            />
          </label>
          <label className="field">
            Time limit (seconds / turn)
            <input
              type="number"
              min={30}
              max={600}
              value={form.timeLimitSeconds}
              onChange={(e) =>
                setForm({ ...form, timeLimitSeconds: Number(e.target.value) })
              }
            />
          </label>
        </div>
        {error ? <p className="error">{error}</p> : null}
        <div className="row">
          <button className="btn" type="submit" disabled={loading}>
            {loading ? "Opening floor…" : "Enter the floor"}
          </button>
        </div>
      </form>
    </section>
  );
}
