import { NextResponse } from "next/server";
import { getRecentLlmTraces } from "@/lib/llm-trace";

export async function GET() {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json({ traces: getRecentLlmTraces() });
}
