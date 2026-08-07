"use client";

import Link from "next/link";
import { SignedIn, SignedOut, SignInButton, UserButton } from "@clerk/nextjs";

const clerkEnabled = Boolean(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY);

export function SiteHeader() {
  return (
    <header className="site-header">
      <Link href="/" className="brand">
        ArguMentor
      </Link>
      <nav className="nav">
        <Link href="/dashboard">Dashboard</Link>
        <Link href="/debate/new">New debate</Link>
        <Link href="/research">Research</Link>
      </nav>
      <div className="auth-slot">
        {clerkEnabled ? (
          <>
            <SignedOut>
              <SignInButton mode="modal">
                <button type="button" className="btn ghost">
                  Sign in
                </button>
              </SignInButton>
            </SignedOut>
            <SignedIn>
              <UserButton afterSignOutUrl="/" />
            </SignedIn>
          </>
        ) : (
          <span className="dev-badge">Dev auth</span>
        )}
      </div>
    </header>
  );
}
