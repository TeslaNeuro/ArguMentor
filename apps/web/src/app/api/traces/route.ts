import { NextResponse } from "next/server";
import { getRecentLlmTraces } from "@/lib/llm-trace";

export async function GET() {
  if (process.env.NODE_ENV === "production" && process.env.ARGUMENTOR_DEV_AUTH !== "true") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  return NextResponse.json({ traces: getRecentLlmTraces() });
}
