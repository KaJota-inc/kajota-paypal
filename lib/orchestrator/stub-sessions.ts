import { createHash, randomUUID } from "crypto";
import type { Hex } from "viem";
import type { BeaconReceipt, BeaconStatus } from "@/lib/beacon/types";
import type { Session, SessionRecipient, SettlementStatus } from "./sessions";

/**
 * Build one demo Session row — same shape as a real orchestrator-written
 * session but with stub tx hashes and a `(stub)` merchant name.
 *
 * Used both by `POST /api/orchestrator/sessions/seed` and by the
 * cold-start warm-seed path in `InMemorySessionStore` so a freshly-booted
 * serverless instance has demo rows available to the first GET without
 * requiring an explicit seed click. The warm-seed respects an "already
 * drained" flag so a user who clicked Clear does not see the rows reappear
 * on reload within the same instance.
 */
export function buildStubSession(index: number): Session {
  const now = Date.now();
  const createdAt = new Date(now - (index + 1) * 7 * 60 * 1000).toISOString();
  const updatedAt = new Date(now - index * 60 * 1000).toISOString();
  const slot = (index + 1).toString().padStart(4, "0");

  const gross = BigInt(1_000_000 + index * 500_000); // $1.00 .. $N.00 PYUSD (6 decimals)
  const shares = [1_000, 2_000, 7_000]; // affiliate 10%, agent 20%, merchant 70%
  const recipients: SessionRecipient[] = [
    {
      role: "affiliate",
      address: `0xaFF11aTeDEM0DemOdEmoDemoDEMo00000000000${index + 1}`,
      shareBps: shares[0],
      payoutMinorUnits: (
        (gross * BigInt(shares[0])) /
        BigInt(10_000)
      ).toString(),
    },
    {
      role: "agent",
      address: `0xaGEnTdeMoAgenTDeMoageNtDemo00000000000${index + 1}`,
      shareBps: shares[1],
      payoutMinorUnits: (
        (gross * BigInt(shares[1])) /
        BigInt(10_000)
      ).toString(),
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
      .padEnd(64, "0")}` as Hex;

  const base: Session = {
    paymentMandateId: `pm_stub_${slot}`,
    paypalOrderId: `PP_STUB_${slot}${slot.repeat(2)}`,
    cartMandateHash: `stub_cart_${slot}`,
    paymentMandateContentsHash: `stub_pmc_${slot}`,
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

  const withReceipt: Session = {
    ...base,
    beaconReceipt: buildStubBeaconReceipt(base, status),
  };

  if (status === "released") {
    return { ...withReceipt, releaseTxHash: stubTx("release") };
  }
  if (status === "failed") {
    return {
      ...withReceipt,
      listingId: undefined,
      registerTxHash: undefined,
      approveTxHash: undefined,
      depositTxHash: undefined,
      depositId: undefined,
      errorReason:
        "demo — cosellEscrowV2Pyusd deployment pending a funded Arb Sepolia EOA + Paxos PYUSD faucet; happy-path reproducer at scripts/reproduce-paypal-mesh-flow.ts stops at this same step",
    };
  }
  return withReceipt;
}

/**
 * Compute a deterministic-shaped Beacon receipt for a stub session so the
 * `/mandate-inspector/[paymentMandateId]` surface renders a real-looking
 * compliance-receipt card without the full AP2 Mandate pair. Commitment
 * fields are sha-256 derivations of the stub session's own payment id —
 * reproducible, labelled, and never claimed to be on-chain (no
 * `anchorTxHash`).
 */
function buildStubBeaconReceipt(
  base: Session,
  status: SettlementStatus,
): BeaconReceipt {
  const hex32 = (tag: string): Hex =>
    `0x${createHash("sha256")
      .update(`${tag}:${base.paymentMandateId}`)
      .digest("hex")}` as Hex;

  const postedAtSeconds = Math.floor(
    Date.parse(base.createdAt) / 1000,
  );
  const slaWindowSeconds = 864_000; // Reg E 10 business days

  const beaconStatus: BeaconStatus =
    status === "released"
      ? "settled"
      : status === "failed"
        ? "sla-breached"
        : "posted";

  return {
    commitment: hex32("commitment"),
    paymentMandateContentsHash: base.paymentMandateContentsHash,
    cartMandateHashBase64Url: base.cartMandateHash,
    mandateId: hex32("mandate-id"),
    idempotencyKey: hex32("idempotency-key"),
    envelopeHash: hex32("envelope-hash"),
    merchantAddress:
      (base.recipients.find((r) => r.role === "merchant")?.address ??
        "0x742d35Cc6634C0532925a3b844Bc9e7595f8bEb6") as Hex,
    amountMinorUnits: base.grossAmountMinorUnits,
    currency: base.currency,
    postedAt: postedAtSeconds,
    deadline: postedAtSeconds + slaWindowSeconds,
    slaWindowSeconds,
    slaRegime: "reg-e-10bd",
    sanctionsSnapshot: {
      list: "ofac-sdn",
      publishedAt: "2026-11-01",
      digest: hex32("sanctions"),
    },
    occurrence: 1,
    status: beaconStatus,
    statusReason:
      status === "released"
        ? "Demo stub — settlement row seeded for the merchant dashboard."
        : status === "failed"
          ? "Demo stub — escrow not deployed; see errorReason on the session."
          : "Demo stub — in-flight toward a released state.",
    computedAt: new Date().toISOString(),
  };
}

/** Default stub-row count used both by the explicit seed route and warm-seed. */
export const DEFAULT_STUB_COUNT = 3;
