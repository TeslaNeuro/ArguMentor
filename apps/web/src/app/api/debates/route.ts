import { CreateDebateConfigSchema } from "@argumentor/debate-core";
import { NextResponse } from "next/server";
import { requireAppUser } from "@/lib/auth";
import { debateRepo } from "@/lib/repo";
import { enforceRateLimit } from "@/lib/rate-limit";
import { trackServer } from "@/lib/server-analytics";

export async function GET() {
  const user = await requireAppUser();
  const sessions = await debateRepo.listSessions(user.id);
  return NextResponse.json({ sessions });
}

export async function POST(req: Request) {
  const user = await requireAppUser();
  const limited = await enforceRateLimit(`debate-create:${user.id}`, 10);
  if (limited) return limited;
  const body = await req.json();
  const parsed = CreateDebateConfigSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid debate configuration", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const session = await debateRepo.createSession(user.id, parsed.data);
  await debateRepo.updateSession(session.id, { status: "active" });
  trackServer("debate_created", {
    difficulty: parsed.data.difficulty,
    format: parsed.data.format,
    personality: parsed.data.personality,
  });

  return NextResponse.json({ session: { ...session, status: "active" } });
}
