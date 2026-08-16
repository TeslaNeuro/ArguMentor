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
  const meta = event.meta ? redactMeta(event.meta) : undefined;
  const safe = { ...event, meta };
  recent.unshift(safe);
  if (recent.length > 100) recent.pop();
  if (process.env.NODE_ENV === "development") {
    console.info(`[llm-trace] ${safe.name} ${safe.durationMs}ms`, safe.meta ?? {});
  }
}

const SENSITIVE_KEY = /key|token|secret|authorization|password/i;

function redactMeta(meta: Record<string, unknown>): Record<string, unknown> {
  const next: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(meta)) {
    if (SENSITIVE_KEY.test(key)) {
      next[key] = "[redacted]";
    } else if (typeof value === "string" && /sk-[a-zA-Z0-9_-]{8,}/.test(value)) {
      next[key] = "[redacted]";
    } else {
      next[key] = value;
    }
  }
  return next;
}

export function getRecentLlmTraces() {
  return [...recent];
}
