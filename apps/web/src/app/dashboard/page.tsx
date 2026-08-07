"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type ProfileResponse = {
  user: { displayName: string | null; email: string };
  skill: { dimensions: Record<string, number>; overall: number };
  sessions: Array<{ id: string; topic: string; status: string; createdAt: string }>;
  memories: Array<{ id: string; kind: string; content: string }>;
  plan: {
    narrative: string;
    focusAreas: string[];
    drills: Array<{ title: string; description: string; durationMinutes: number }>;
  } | null;
};

export default function DashboardPage() {
  const [data, setData] = useState<ProfileResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/profile")
      .then(async (res) => {
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || "Failed to load profile");
        setData(json);
      })
      .catch((e) => setError(e.message));
  }, []);

  if (error) {
    return (
      <section className="section">
        <p className="error">{error}</p>
      </section>
    );
  }

  if (!data) {
    return (
      <section className="section">
        <p className="muted">Loading your training profile…</p>
      </section>
    );
  }

  return (
    <section className="section stack">
      <div>
        <h2>Dashboard</h2>
        <p className="support">
          {data.user.displayName || data.user.email} — long-term skill memory and debate history.
        </p>
      </div>

      <div className="panel stack">
        <h3 style={{ fontFamily: "var(--am-font-display)", margin: 0 }}>
          Skill profile · {data.skill.overall.toFixed(2)} overall
        </h3>
        <div className="score-grid">
          {Object.entries(data.skill.dimensions).map(([key, value]) => (
            <div className="score" key={key}>
              <strong>{Number(value).toFixed(1)}</strong>
              <span>{key}</span>
              <div className="meter">
                <i style={{ width: `${(Number(value) / 5) * 100}%` }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid-2">
        <div className="panel stack">
          <h3 style={{ fontFamily: "var(--am-font-display)", margin: 0 }}>Recent debates</h3>
          {data.sessions.length === 0 ? (
            <p className="muted">
              No debates yet. <Link href="/debate/new">Start one</Link>.
            </p>
          ) : (
            data.sessions.map((s) => (
              <Link key={s.id} href={`/debate/${s.id}`} className="turn" style={{ borderBottom: "1px solid var(--am-line)" }}>
                <div className="meta">{s.status}</div>
                <div className="body" style={{ fontSize: "1rem" }}>
                  {s.topic}
                </div>
              </Link>
            ))
          )}
        </div>

        <div className="panel stack">
          <h3 style={{ fontFamily: "var(--am-font-display)", margin: 0 }}>Memory</h3>
          {data.memories.length === 0 ? (
            <p className="muted">Complete a judged debate to build memory.</p>
          ) : (
            data.memories.map((m) => (
              <div key={m.id}>
                <div className="meta" style={{ textTransform: "uppercase", fontSize: "0.75rem", color: "var(--am-muted)" }}>
                  {m.kind}
                </div>
                <p style={{ margin: "0.25rem 0 0.75rem", fontFamily: "var(--am-font-body)" }}>
                  {m.content}
                </p>
              </div>
            ))
          )}
        </div>
      </div>

      {data.plan ? (
        <div className="panel stack">
          <h3 style={{ fontFamily: "var(--am-font-display)", margin: 0 }}>Latest coach plan</h3>
          <p style={{ fontFamily: "var(--am-font-body)", lineHeight: 1.55 }}>{data.plan.narrative}</p>
          <ul className="list-plain">
            {data.plan.focusAreas.map((f) => (
              <li key={f}>{f}</li>
            ))}
          </ul>
        </div>
      ) : null}
    </section>
  );
}
