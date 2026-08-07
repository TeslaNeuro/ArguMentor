import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    ok: true,
    service: "argumentor-web",
    time: new Date().toISOString(),
    llmConfigured: Boolean(
      process.env.OPENROUTER_API_KEY ||
        process.env.ANTHROPIC_API_KEY ||
        process.env.OPENAI_API_KEY,
    ),
    databaseConfigured: Boolean(process.env.DATABASE_URL),
    clerkConfigured: Boolean(process.env.CLERK_SECRET_KEY),
  });
}
