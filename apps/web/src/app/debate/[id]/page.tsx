"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Scorecard } from "@/components/scorecard";
import { Markdown } from "@/components/markdown";
import { LlmKeyBanner } from "@/components/llm-key-banner";
import { apiFetch } from "@/lib/api";
import { speakText, usePushToTalk, useTtsPreference } from "@/lib/voice";
import { track } from "@/lib/analytics";

type Turn = {
  id: string;
  speaker: string;
  content: string;
  round: number;
  phase: string;
  analysis?: {
    clarity: number;
    weaknesses: Array<{ type: string; explanation: string; teachingNote: string }>;
  } | null;
};

type Session = {
  id: string;
  topic: string;
  status: string;
  phase: string;
  round: number;
  maxRounds: number;
  awaitingSpeaker: string;
  userSide: string;
  difficulty: string;
  personality: string;
};

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

export default function DebateRoomPage() {
  const params = useParams<{ id: string }>();
  const [session, setSession] = useState<Session | null>(null);
  const [turns, setTurns] = useState<Turn[]>([]);
  const [evaluation, setEvaluation] = useState<Evaluation | null>(null);
  const [plan, setPlan] = useState<{
    narrative: string;
    focusAreas: string[];
    drills: Array<{ title: string; description: string; durationMinutes: number }>;
  } | null>(null);
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [streaming, setStreaming] = useState("");
  const { enabled: ttsEnabled, setEnabled: setTtsEnabled } = useTtsPreference();

  const onVoice = useCallback((text: string) => {
    setDraft((prev) => (prev ? `${prev} ${text}` : text));
  }, []);
  const voice = usePushToTalk(onVoice);

  function maybeSpeak(text: string) {
    if (ttsEnabled) speakText(text);
  }

  async function refresh() {
    const res = await fetch(`/api/debates/${params.id}`);
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Failed to load");
    setSession(data.session);
    setTurns(data.turns);
    setEvaluation(data.evaluation);
    setPlan(data.plan);
  }

  useEffect(() => {
    refresh().catch((e) => setError(e.message));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.id]);

  async function requestOpponent() {
    if (!session || busy) return;
    setBusy(true);
    setError(null);
    setStreaming("");
    try {
      const res = await apiFetch(`/api/debates/${session.id}/opponent`, { method: "POST" });
      const contentType = res.headers.get("content-type") || "";
      if (contentType.includes("application/json")) {
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Opponent failed");
        await refresh();
        maybeSpeak(data.content);
      } else {
        if (!res.ok || !res.body) throw new Error("Opponent stream failed");
        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let full = "";
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const chunk = decoder.decode(value);
          full += chunk;
          setStreaming(full);
        }
        maybeSpeak(full);
        await refresh();
        setStreaming("");
      }
      track("opponent_turn");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Opponent error");
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => {
    if (session?.awaitingSpeaker === "opponent" && session.status === "active" && !busy) {
      void requestOpponent();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.awaitingSpeaker, session?.status]);

  async function submitTurn() {
    if (!session || !draft.trim()) return;
    setBusy(true);
    setError(null);
    try {
      const res = await apiFetch(`/api/debates/${session.id}/turn`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: draft.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Turn failed");
      setDraft("");
      if (data.evaluation) {
        setEvaluation(data.evaluation);
        setPlan(data.plan);
      }
      await refresh();
      track("user_turn");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Turn error");
    } finally {
      setBusy(false);
    }
  }

  async function endDebate() {
    if (!session) return;
    setBusy(true);
    try {
      const res = await apiFetch(`/api/debates/${session.id}/end`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "End failed");
      setEvaluation(data.evaluation);
      setPlan(data.plan);
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "End error");
    } finally {
      setBusy(false);
    }
  }

  if (!session) {
    return (
      <section className="section">
        <p className="muted">{error || "Loading debate…"}</p>
      </section>
    );
  }

  const completed = session.status === "completed" || Boolean(evaluation);

  return (
    <section className="section stack">
      <LlmKeyBanner />
      <div>
        <p className="muted" style={{ textTransform: "uppercase", letterSpacing: "0.08em", fontSize: "0.75rem" }}>
          {session.phase} · round {session.round}/{session.maxRounds} · {session.difficulty} ·{" "}
          {session.personality.replace("_", " ")}
        </p>
        <h2 style={{ marginTop: "0.35rem" }}>{session.topic}</h2>
        <p className="support">You argue {session.userSide}. Opponent argues the other side.</p>
        <div className="row" style={{ marginTop: "0.75rem" }}>
          <button
            className={`btn ghost${ttsEnabled ? " tts-on" : ""}`}
            type="button"
            aria-pressed={ttsEnabled}
            onClick={() => setTtsEnabled(!ttsEnabled)}
          >
            {ttsEnabled ? "Voice on" : "Voice off"}
          </button>
        </div>
      </div>

      <div className="panel">
        {turns.map((turn) => (
          <article key={turn.id} className={`turn ${turn.speaker}`}>
            <div className="meta">
              {turn.speaker} · round {turn.round} · {turn.phase}
            </div>
            <div className="body">
              <Markdown content={turn.content} />
            </div>
            {turn.analysis?.weaknesses?.length ? (
              <div className="muted" style={{ fontSize: "0.9rem", marginTop: "0.4rem" }}>
                <Markdown
                  content={`**Analysis:** ${turn.analysis.weaknesses[0]?.teachingNote ?? ""}`}
                />
              </div>
            ) : null}
          </article>
        ))}
        {streaming ? (
          <article className="turn opponent">
            <div className="meta">opponent · streaming</div>
            <div className="body">
              <Markdown content={streaming} />
            </div>
          </article>
        ) : null}
      </div>

      {!completed ? (
        <div className="panel stack">
          <label className="field">
            Your turn
            <textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="Advance your case, rebut, and press their weakest warrant…"
              disabled={busy || session.awaitingSpeaker !== "user"}
            />
          </label>
          <div className="row">
            <button
              className="btn"
              type="button"
              onClick={submitTurn}
              disabled={busy || session.awaitingSpeaker !== "user" || draft.trim().length < 12}
            >
              Submit argument
            </button>
            {voice.supported ? (
              <button
                className="btn ghost"
                type="button"
                onMouseDown={voice.start}
                onMouseUp={voice.stop}
                onTouchStart={voice.start}
                onTouchEnd={voice.stop}
                disabled={busy || session.awaitingSpeaker !== "user"}
              >
                {voice.listening ? "Listening…" : "Hold to speak"}
              </button>
            ) : null}
            <button className="btn ghost" type="button" onClick={endDebate} disabled={busy}>
              End & judge
            </button>
          </div>
          {session.awaitingSpeaker === "opponent" ? (
            <p className="muted">Opponent is preparing a response…</p>
          ) : null}
        </div>
      ) : null}

      {error ? <p className="error">{error}</p> : null}

      {evaluation ? (
        <Scorecard evaluation={evaluation} plan={plan} />
      ) : null}

      <p className="muted">
        <Link href="/dashboard">Back to dashboard</Link>
      </p>
    </section>
  );
}
