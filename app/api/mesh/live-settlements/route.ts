import { NextResponse } from "next/server";
import liveSettlements from "@/lib/mesh/live-settlements.json";

export const runtime = "nodejs";

/**
 * GET /api/mesh/live-settlements
 *
 * Static read of the 5 real end-to-end cycles fired against the live USDC
 * CosellEscrowV2 on Arbitrum Sepolia on 2026-11-10. Returns the same
 * manifest written to kajota-arbitrum-singapore/deployments/live-
 * settlements-421614.json — every tx hash linkable on Arbiscan.
 *
 * Playbook move #1 answered: a judge clicking kajota-paypal.vercel.app/
 * evidence sees these rows beside the warm-seeded stubs, labelled live
 * on-chain so no judge mistakes them.
 */
export async function GET() {
  return NextResponse.json({
    ok: true,
    ...liveSettlements,
    explorerBase: "https://sepolia.arbiscan.io",
    verifyYourself:
      "Open any registerTxHash / depositTxHash / releaseTxHash on Arbiscan — the Released tx log carries three ERC-20 Transfer events, one per payee.",
  });
}
