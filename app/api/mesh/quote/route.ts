import { NextResponse } from "next/server";
import { z } from "zod";
import { keccak256, toHex } from "viem";

export const runtime = "nodejs";

/**
 * POST /api/mesh/quote
 *
 * Deterministic quote endpoint for the N-party fan-out primitive. Called
 * by `paypal/agent-toolkit#126` DRAFT (`request_mesh_fanout_quote` tool)
 * and by any agent wiring Mesh into their PayPal pipeline.
 *
 * Non-mutating, idempotent, no chain write. Given a Payment Mandate id,
 * a cart total, and an N-recipient attribution policy, returns:
 *
 *   per_recipient_payout      - deterministic bigint-safe strings
 *   listing_id_preimage       - what the on-chain registry will hash
 *   estimated_chain_tx_count  - always 4 (register + approve + deposit + release)
 *   settlement_token_options  - tokens the orchestrator has deployed
 *
 * The schema matches the DRAFT PR's `requestMeshFanoutQuoteParameters`
 * byte-for-byte. Cross-field invariants (sum to 10 000 bps, distinct
 * addresses) are enforced here rather than in the schema so the `.safeParse`
 * returns a clean 400 with a readable error.
 */

const BPS_DENOMINATOR = 10_000;

const QuoteSchema = z.object({
  payment_mandate_id: z.string().min(1),
  cart_total_minor_units: z.string().regex(/^[0-9]+$/),
  currency: z.string().length(3),
  recipients: z
    .array(
      z.object({
        role: z.enum(["merchant", "agent", "affiliate", "platform", "referrer"]),
        address: z.string().regex(/^0x[0-9a-fA-F]{40}$/),
        share_bps: z.number().int().min(1).max(BPS_DENOMINATOR - 1),
      }),
    )
    .min(2)
    .max(16),
  settlement_token: z.enum(["pyusd", "usdc", "usdg"]).default("pyusd"),
  chain_id: z.number().int().default(421614),
  mesh_endpoint_url: z.string().url().optional(),
});

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const parsed = QuoteSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: parsed.error.flatten() },
      { status: 400 },
    );
  }
  const p = parsed.data;

  // Cross-field invariants
  const totalBps = p.recipients.reduce((acc, r) => acc + r.share_bps, 0);
  if (totalBps !== BPS_DENOMINATOR) {
    return NextResponse.json(
      {
        ok: false,
        error: `recipients.share_bps must sum to ${BPS_DENOMINATOR}; got ${totalBps}`,
      },
      { status: 400 },
    );
  }
  const seen = new Set<string>();
  for (const r of p.recipients) {
    const k = r.address.toLowerCase();
    if (seen.has(k)) {
      return NextResponse.json(
        { ok: false, error: `recipients.address values must be distinct (saw ${k} twice)` },
        { status: 400 },
      );
    }
    seen.add(k);
  }

  // Deterministic per-recipient payout (zero-dust rounding on the
  // merchant residual, mirrors the on-chain computeSplit exactly).
  const gross = BigInt(p.cart_total_minor_units);
  let running = BigInt(0);
  const per_recipient_payout = p.recipients.map((r, i) => {
    const isLast = i === p.recipients.length - 1;
    const payout = isLast
      ? gross - running
      : (gross * BigInt(r.share_bps)) / BigInt(BPS_DENOMINATOR);
    running += payout;
    return {
      role: r.role,
      address: r.address,
      share_bps: r.share_bps,
      payout_minor_units: payout.toString(),
    };
  });

  // Deterministic listing_id_preimage — same hash recipe the
  // orchestrator would feed on-chain, so a client can pre-render links.
  const preimage = JSON.stringify({
    payment_mandate_id: p.payment_mandate_id,
    cart_total_minor_units: p.cart_total_minor_units,
    currency: p.currency,
    recipients: p.recipients.map((r) => ({
      address: r.address.toLowerCase(),
      share_bps: r.share_bps,
    })),
    settlement_token: p.settlement_token,
    chain_id: p.chain_id,
  });
  const listing_id_preimage = keccak256(toHex(preimage));

  return NextResponse.json({
    ok: true,
    payment_mandate_id: p.payment_mandate_id,
    listing_id_preimage,
    per_recipient_payout,
    estimated_chain_tx_count: 4,
    settlement_token_options: ["pyusd", "usdc", "usdg"],
    chain_id: p.chain_id,
    note: "Quote only — no chain write. Use `fanout_release` (not yet in this PR) to settle.",
  });
}

export async function GET() {
  return NextResponse.json({
    endpoint: "/api/mesh/quote",
    accepts: "POST application/json; see paypal/agent-toolkit#126 for the schema",
    non_mutating: true,
    chain_write: false,
    primitive: "Kajota Mesh N-party atomic fan-out",
    draft_pr: "https://github.com/paypal/agent-toolkit/pull/126",
    live_settlements_index: "/api/mesh/live-settlements",
  });
}
