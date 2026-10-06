import { getAddress, type Hex } from "viem";

import { cartMandateHash, paymentMandateContentsHash } from "../ap2/hash";
import type {
  CartMandate,
  PaymentMandate,
} from "../ap2/types";
import {
  REG_E_PROVISIONAL_CREDIT_SECONDS,
  envelopeHashFor,
  idempotencyKeyFor,
  mandateCommitment,
  mandateIdFor,
  minorUnitsFromDecimal,
} from "./canonical";
import {
  DEFAULT_SANCTIONS_SNAPSHOT,
  snapshotsDiffer,
} from "./sanctions";
import type {
  BeaconReceipt,
  BeaconStatus,
  SanctionsListSnapshot,
} from "./types";

/**
 * Build a Beacon receipt from an AP2 Mandate pair. The receipt is the
 * compliance-replay artefact: a regulator who holds the two Mandates can
 * recompute every field without any shared state with the Beacon operator.
 *
 * The function does not touch the chain. Phase B's `anchor.ts` takes a
 * receipt and emits `postMandate` against the deployed `MandateAnchor`.
 */
export type BuildReceiptInput = {
  cartMandate: CartMandate;
  paymentMandate: PaymentMandate;
  merchantAddress: Hex;
  tokenDecimals?: number;
  slaWindowSeconds?: number;
  slaRegime?: string;
  sanctionsSnapshot?: SanctionsListSnapshot;
  /**
   * Overrides the Payment Mandate `timestamp` with an explicit wall-clock
   * reading. Set this in tests only — production always derives time from
   * the signed Mandate so the receipt is replayable.
   */
  nowOverrideSeconds?: number;
};

export type ReplayContext = {
  /** Mandates already observed by the Beacon, keyed on idempotencyKey. */
  seenIdempotencyKeys?: Map<Hex, number>;
  /** The sanctions snapshot the caller believes is current, for drift check. */
  verifierSnapshot?: SanctionsListSnapshot;
};

const DEFAULT_TOKEN_DECIMALS = 6;

export function buildBeaconReceipt(
  input: BuildReceiptInput,
  context: ReplayContext = {},
): BeaconReceipt {
  const tokenDecimals = input.tokenDecimals ?? DEFAULT_TOKEN_DECIMALS;
  const slaWindowSeconds =
    input.slaWindowSeconds ?? REG_E_PROVISIONAL_CREDIT_SECONDS;
  const slaRegime = input.slaRegime ?? "reg-e-10bd";
  const sanctionsSnapshot =
    input.sanctionsSnapshot ?? DEFAULT_SANCTIONS_SNAPSHOT;

  const paymentContents = input.paymentMandate.payment_mandate_contents;
  const total = paymentContents.payment_details_total.amount;
  const amountMinorUnits = minorUnitsFromDecimal(total.value, tokenDecimals);

  const paymentContentsHash = paymentMandateContentsHash(paymentContents);
  const cartHash = cartMandateHash(input.cartMandate.contents);

  const postedAtSeconds =
    input.nowOverrideSeconds ??
    Math.floor(Date.parse(paymentContents.timestamp) / 1000);
  const deadlineSeconds = postedAtSeconds + slaWindowSeconds;

  const idempotencyKey = idempotencyKeyFor(
    paymentContents,
    amountMinorUnits,
    postedAtSeconds,
  );
  const mandateId = mandateIdFor(paymentContents.payment_mandate_id);
  const envelopeHash = envelopeHashFor(cartHash);

  // Replay-safety: a duplicate inside the same CRE tick routes to review.
  // The Beacon operator never auto-settles the second attempt; see
  // §13 (replay-within-TTL) in HARD_PARTS.
  const seen = context.seenIdempotencyKeys ?? new Map<Hex, number>();
  const prior = seen.get(idempotencyKey) ?? 0;
  const occurrence = prior + 1;
  seen.set(idempotencyKey, occurrence);

  // Sanctions drift: the ingest snapshot is authoritative. A verifier
  // holding a drifted snapshot gets `sla-breached`-shaped rejection even
  // though the SLA window is open — the audit cannot be reproduced.
  const verifier = context.verifierSnapshot ?? sanctionsSnapshot;
  const drifted = snapshotsDiffer(sanctionsSnapshot, verifier);

  let status: BeaconStatus = "posted";
  let statusReason: string | undefined;
  if (drifted) {
    status = "duplicate-routed";
    statusReason =
      `sanctions-list-drift: ingest ${sanctionsSnapshot.list}@${sanctionsSnapshot.publishedAt}` +
      ` vs verifier ${verifier.list}@${verifier.publishedAt}`;
  } else if (occurrence > 1) {
    status = "duplicate-routed";
    statusReason = `replay-within-ttl: occurrence=${occurrence}`;
  }

  const commitment = mandateCommitment({
    mandateId,
    merchantAddress: getAddress(input.merchantAddress),
    idempotencyKey,
    amountMinorUnits,
    postedAtSeconds,
    deadlineSeconds,
    envelopeHash,
    sanctionsListVersion: sanctionsSnapshot.digest,
    occurrence,
  });

  return {
    commitment,
    paymentMandateContentsHash: paymentContentsHash,
    cartMandateHashBase64Url: cartHash,
    mandateId,
    idempotencyKey,
    envelopeHash,
    merchantAddress: getAddress(input.merchantAddress),
    amountMinorUnits: amountMinorUnits.toString(),
    currency: total.currency,
    postedAt: postedAtSeconds,
    deadline: deadlineSeconds,
    slaWindowSeconds,
    slaRegime,
    sanctionsSnapshot,
    occurrence,
    status,
    statusReason,
    computedAt: new Date().toISOString(),
  };
}
