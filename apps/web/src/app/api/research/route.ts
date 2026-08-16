import { runResearchAgent } from "@argumentor/agents";
import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAppUser } from "@/lib/auth";
import { debateRepo } from "@/lib/repo";
import { isLlmCredentials, requireLlmCredentials } from "@/lib/llm-request";
import { enforceRateLimit } from "@/lib/rate-limit";
import { traceLlmCall } from "@/lib/llm-trace";

const BodySchema = z.object({
  topic: z.string().min(8),
  side: z.enum(["proposition", "opposition"]),
});

export async function POST(req: Request) {
  const user = await requireAppUser();
  const limited = await enforceRateLimit(`research:${user.id}`, 20);
  if (limited) return limited;

  const credentials = requireLlmCredentials(req);
  if (!isLlmCredentials(credentials)) return credentials;

  const parsed = BodySchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const result = await traceLlmCall("research", { topic: parsed.data.topic }, () =>
    runResearchAgent({ ...parsed.data, credentials }),
  );

  await debateRepo.addMemory({
    userId: user.id,
    kind: "research_brief",
    content: result.brief.slice(0, 2000),
    payload: { side: parsed.data.side, topic: parsed.data.topic },
  });

  return NextResponse.json(result);
}
