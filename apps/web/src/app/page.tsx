import Link from "next/link";

export default function HomePage() {
  return (
    <section className="hero">
      <p className="muted" style={{ letterSpacing: "0.12em", textTransform: "uppercase", fontSize: "0.75rem" }}>
        Personal debate training
      </p>
      <h1>ArguMentor</h1>
      <p className="lede">
        Train against an elite debate mind. Pressure-test your reasoning, get judged with
        rigor, and build lasting argument skill—not chat fluff.
      </p>
      <div className="cta-row">
        <Link className="btn" href="/debate/new">
          Start a debate
        </Link>
        <Link className="btn ghost" href="/research">
          Research assistant
        </Link>
        <Link className="btn ghost" href="/settings">
          Add API key
        </Link>
      </div>
    </section>
  );
}
