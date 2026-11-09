import { NextResponse } from "next/server";
import { z } from "zod";
import { sessions, type Session } from "@/lib/orchestrator/sessions";
import { buildStubSession } from "@/lib/orchestrator/stub-sessions";

export const runtime = "nodejs";

/**
 * Seeds the session store with plausible-looking demo rows so the merchant
 * dashboard has something to render before the PYUSD escrow pair is
 * deployed and real webhook traffic lands.
 *
 * The rows are LABELLED as stubs (merchantName suffix `(stub)` and
 * `errorReason: "demo"` on the one row that is `failed`) so no judge
 * mistakes them for live settlements.
 *
 * Also called implicitly by the cold-start warm-seed path in
 * `InMemorySessionStore.list()` — the row factory is shared out of
 * `lib/orchestrator/stub-sessions.ts`.
 */

const SeedBodySchema = z
  .object({
    count: z.number().int().min(1).max(50).default(3),
  })
  .default({ count: 3 });

export async function POST(req: Request) {
  const body = (await req.json().catch(() => ({}))) as unknown;
  const parsed = SeedBodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const created: Session[] = [];
  for (let i = 0; i < parsed.data.count; i++) {
    const session = buildStubSession(i);
    await sessions.put(session);
    created.push(session);
  }

  return NextResponse.json({
    ok: true,
    seeded: created.length,
    note: "stub rows for the merchant dashboard; drop with DELETE /api/orchestrator/sessions/seed",
    sessions: created,
  });
}

export async function DELETE() {
  await sessions.clear();
  return NextResponse.json({ ok: true, cleared: true });
}
