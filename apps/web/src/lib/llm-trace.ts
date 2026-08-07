type TraceEvent = {
  name: string;
  durationMs: number;
  meta?: Record<string, unknown>;
};

const recent: TraceEvent[] = [];

export function traceLlmCall<T>(
  name: string,
  meta: Record<string, unknown> | undefined,
  fn: () => Promise<T>,
): Promise<T> {
  const start = Date.now();
  return fn()
    .then((result) => {
      push({ name, durationMs: Date.now() - start, meta: { ...meta, ok: true } });
      return result;
    })
    .catch((error) => {
      push({
        name,
        durationMs: Date.now() - start,
        meta: { ...meta, ok: false, error: String(error) },
      });
      throw error;
    });
}

function push(event: TraceEvent) {
  recent.unshift(event);
  if (recent.length > 100) recent.pop();
  if (process.env.NODE_ENV === "development") {
    console.info(`[llm-trace] ${event.name} ${event.durationMs}ms`, event.meta ?? {});
  }
}

export function getRecentLlmTraces() {
  return [...recent];
}
