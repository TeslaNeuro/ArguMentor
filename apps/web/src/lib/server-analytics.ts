export function trackServer(event: string, properties?: Record<string, unknown>) {
  if (process.env.NODE_ENV === "development") {
    console.info(`[analytics] ${event}`, properties ?? {});
  }
  // PostHog server-side can be wired with posthog-node when KEY is present.
}
