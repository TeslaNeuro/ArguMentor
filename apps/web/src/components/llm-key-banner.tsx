"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { hasStoredLlmKey } from "@/lib/llm-settings";

export function LlmKeyBanner() {
  const [ready, setReady] = useState(false);
  const [hasKey, setHasKey] = useState(true);

  useEffect(() => {
    setHasKey(hasStoredLlmKey());
    setReady(true);
  }, []);

  if (!ready || hasKey) return null;

  return (
    <p className="banner">
      Add your own API key in <Link href="/settings">Settings</Link> to run a live opponent,
      judge, and research brief.
    </p>
  );
}
