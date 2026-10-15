import { NextResponse } from "next/server";
import { sessions } from "@/lib/orchestrator/sessions";

export const runtime = "nodejs";

/**
 * Dev-only convenience: flip every non-released session to `released`. Lets
 * us demo the dashboard release-toast without wiring real chain writes
 * yet.
 */
export async function POST() {
  const all = await sessions.list();
  const promoted: string[] = [];
  for (const s of all) {
    if (s.status !== "released" && s.status !== "refunded") {
      await sessions.patch(s.paymentMandateId, {
        status: "released",
        releaseTxHash: ("0x" +
          "11".repeat(32)) as `0x${string}`,
      });
      promoted.push(s.paymentMandateId);
    }
  }
  return NextResponse.json({ ok: true, promoted });
}
