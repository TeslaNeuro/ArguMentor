import posthog from "posthog-js";

let initialized = false;

export function initPostHog() {
  if (typeof window === "undefined") return;
  const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;
  if (!key || initialized) return;
  posthog.init(key, {
    api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST || "https://us.i.posthog.com",
    capture_pageview: true,
    persistence: "localStorage",
  });
  initialized = true;
}

export function track(event: string, properties?: Record<string, unknown>) {
  if (typeof window === "undefined") return;
  if (!process.env.NEXT_PUBLIC_POSTHOG_KEY) return;
  posthog.capture(event, properties);
}
