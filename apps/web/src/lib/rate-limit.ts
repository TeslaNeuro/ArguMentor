import { NextResponse } from "next/server";

/**
 * Placeholder rate limiter. Returns a 429 Response when Upstash is configured
 * and the caller exceeds the budget; otherwise allows the request.
 */
export async function enforceRateLimit(
  key: string,
  limit = 30,
): Promise<Response | null> {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;

  const windowKey = `rl:${key}:${Math.floor(Date.now() / 60_000)}`;
  const res = await fetch(`${url}/pipeline`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify([
      ["INCR", windowKey],
      ["EXPIRE", windowKey, 60],
    ]),
  });

  if (!res.ok) return null;
  const data = (await res.json()) as Array<{ result: number }>;
  const count = data[0]?.result ?? 0;
  if (count > limit) {
    return NextResponse.json(
      { error: "Rate limit exceeded. Try again shortly." },
      { status: 429 },
    );
  }
  return null;
}
