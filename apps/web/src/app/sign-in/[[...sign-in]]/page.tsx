import { SignIn } from "@clerk/nextjs";

export default function SignInPage() {
  if (!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY) {
    return (
      <section className="section">
        <h2>Sign in</h2>
        <p className="support">
          Sign-in is optional here. Add an API key in Settings and start a debate.
        </p>
      </section>
    );
  }

  return (
    <section className="section" style={{ display: "grid", placeItems: "center" }}>
      <SignIn />
    </section>
  );
}
