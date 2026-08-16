import { SignUp } from "@clerk/nextjs";

export default function SignUpPage() {
  if (!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY) {
    return (
      <section className="section">
        <h2>Sign up</h2>
        <p className="support">
          An account is optional here. Add an API key in Settings and start a debate.
        </p>
      </section>
    );
  }

  return (
    <section className="section" style={{ display: "grid", placeItems: "center" }}>
      <SignUp />
    </section>
  );
}
