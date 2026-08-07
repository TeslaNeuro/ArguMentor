"use client";

import { ClerkProvider } from "@clerk/nextjs";
import { useEffect } from "react";
import { initPostHog } from "@/lib/analytics";

const clerkEnabled = Boolean(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY);

export function AppProviders({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    initPostHog();
  }, []);

  if (!clerkEnabled) {
    return <>{children}</>;
  }

  return <ClerkProvider>{children}</ClerkProvider>;
}
