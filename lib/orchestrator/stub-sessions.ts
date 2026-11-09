import { randomUUID } from "crypto";
import type { Hex } from "viem";
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
        "demo — cosellEscrowV2Pyusd deployment pending a funded Arb Sepolia EOA + Paxos PYUSD faucet; happy-path reproducer at scripts/reproduce-paypal-mesh-flow.ts stops at this same step",
    };
  }
  return base;
}

/** Default stub-row count used both by the explicit seed route and warm-seed. */
export const DEFAULT_STUB_COUNT = 3;
