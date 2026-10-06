import { NextResponse } from "next/server";
import { z } from "zod";
import { randomUUID } from "node:crypto";
import {
  sessions,
  type Session,
  type SessionRecipient,
  type SettlementStatus,
} from "@/lib/orchestrator/sessions";

export const runtime = "nodejs";

/**
 * Dev-only endpoint that seeds the session store with plausible-looking
 * demo rows so the merchant dashboard has something to render before the
 * PYUSD escrow pair is deployed and real webhook traffic lands.
 *
 * The rows are LABELLED as stubs (merchantName suffix `(stub)` and
 * `errorReason: "demo"` on the one row that is `failed`) so no judge
 * mistakes them for live settlements.
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

function buildStubSession(index: number): Session {
  const now = Date.now();
  const createdAt = new Date(now - (index + 1) * 7 * 60 * 1000).toISOString();
  const updatedAt = new Date(now - index * 60 * 1000).toISOString();

  const gross = BigInt(1_000_000 + index * 500_000); // $1.00 .. $N.00 PYUSD (6 decimals)
  const shares = [1_000, 2_000, 7_000]; // affiliate 10%, agent 20%, merchant 70%
  const recipients: SessionRecipient[] = [
    {
      role: "affiliate",
      address: "0xaFF11aTeDEM0DemOdEmoDemoDEMo000000000001",
      shareBps: shares[0],
      payoutMinorUnits: ((gross * BigInt(shares[0])) / BigInt(10_000)).toString(),
    },
    {
      role: "agent",
      address: "0xaGEnTdeMoAgenTDeMoageNtDemo000000000002",
      shareBps: shares[1],
      payoutMinorUnits: ((gross * BigInt(shares[1])) / BigInt(10_000)).toString(),
    },
    {
      role: "merchant",
      address: "0x742d35Cc6634C0532925a3b844Bc9e7595f8bEb6",
      shareBps: shares[2],
      payoutMinorUnits: (
        gross -
        (gross * BigInt(shares[0])) / BigInt(10_000) -
        (gross * BigInt(shares[1])) / BigInt(10_000)
      ).toString(),
    },
  ];

  const statusRotation: SettlementStatus[] = [
    "released",
    "pending-release",
    "failed",
  ];
  const status = statusRotation[index % statusRotation.length];
  const stubTx = (label: string) =>
    `0x${Buffer.from(`${label}-${index}-${randomUUID()}`)
      .toString("hex")
      .slice(0, 64)
      .padEnd(64, "0")}` as `0x${string}`;

  const base: Session = {
    paymentMandateId: `pm_stub_${randomUUID()}`,
    paypalOrderId: `PP_STUB_${randomUUID().replace(/-/g, "").slice(0, 12).toUpperCase()}`,
    cartMandateHash: `stub_cart_${randomUUID().slice(0, 8)}`,
    paymentMandateContentsHash: `stub_pmc_${randomUUID().slice(0, 8)}`,
    grossAmountMinorUnits: gross.toString(),
    currency: "USD",
    merchantName: `Demo Merchant ${index + 1} (stub)`,
    recipients,
    status,
    createdAt,
    updatedAt,
    listingId: stubTx("listing"),
    registerTxHash: stubTx("register"),
    approveTxHash: stubTx("approve"),
    depositTxHash: stubTx("deposit"),
    depositId: stubTx("deposit-id"),
  };

  if (status === "released") {
    return { ...base, releaseTxHash: stubTx("release") };
  }
  if (status === "failed") {
    return {
      ...base,
      listingId: undefined,
      registerTxHash: undefined,
      approveTxHash: undefined,
      depositTxHash: undefined,
      depositId: undefined,
      errorReason:
        "demo — cosellEscrowV2Pyusd not deployed yet (expected in Phase A day 4)",
    };
  }
  return base;
}
