import { SignUp } from "@clerk/nextjs";

export default function SignUpPage() {
  if (!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY) {
    return (
      <section className="section">
        <h2>Sign up</h2>
        <p className="support">
          Clerk is not configured. Dev auth is active — you can use the app without signing up.
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
