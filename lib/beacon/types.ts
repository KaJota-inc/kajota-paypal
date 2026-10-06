/**
 * Mandate Beacon — compliance-receipt layer under every AP2 Payment Mandate.
 *
 * The Beacon is a port of `MandateAnchor.sol` from `kajota-zama` on
 * `hackathon/bli-mandate-beacon` (contract HEAD `83db96c`). That contract
 * built the receipt around a Nigerian primitive (CBN Consumer Protection
 * Regulation 2019 dispute SLA + the NIP replay-safety gap). The AP2 adaptation
 * swaps the regulatory anchor to **Regulation E** (12 CFR 1005.11) — ten
 * business days for provisional credit, sixty for the error-resolution window
 * — while keeping the same canonical commitment layout. The two chains carry
 * byte-identical commitments for a cross-rail audit.
 *
 * Receipts stay off-chain by default. When `MANDATE_BEACON_ADDRESS` is
 * configured the receipt's `commitment` is anchored on-chain (Phase B);
 * absent that, the receipt is a deterministic artefact a regulator can
 * recompute from the Mandate pair alone.
 */

import type { Hex } from "viem";

/** How a Beacon receipt was resolved against a replay-safety check. */
export type BeaconStatus =
  | "posted"
  | "duplicate-routed"
  | "settled"
  | "sla-breached";

export type SanctionsListSnapshot = {
  /**
   * Short identifier of the list — `"ofac-sdn"`, `"un-1267"`, `"cbn-dnd"`,
   * `"eu-fsf"`. The Beacon never follows "current"; a replay-pinned snapshot
   * is the only way an audit can be reproduced.
   */
  list: string;
  /** ISO 8601 publication date of the pinned snapshot. */
  publishedAt: string;
  /** Hex digest of the pinned snapshot (sha256 of the sorted entries). */
  digest: Hex;
};

export type BeaconReceipt = {
  /**
   * Byte-identical to the Solidity `mandateCommitment()` keccak over the
   * same 9-tuple: this is the audit lineage leaf a regulator can
   * cross-verify against the on-chain mandate without touching PII.
   */
  commitment: Hex;

  /** base64url(sha256(canonical PaymentMandateContents)) — AP2's own id. */
  paymentMandateContentsHash: string;
  /** base64url(sha256(canonical CartMandate)) — the redacted envelope. */
  cartMandateHashBase64Url: string;

  /** keccak256 of the 32-byte mandate identifier, prepared for the chain. */
  mandateId: Hex;
  /** keccak256(canonicalPaymentMandateContents ‖ amount ‖ creTickBucket). */
  idempotencyKey: Hex;
  /** `envelopeHash` fed into the commitment — keccak of the Cart Mandate. */
  envelopeHash: Hex;

  /** The merchant posting the mandate (AP2 analogue of the issuing bank). */
  merchantAddress: Hex;

  /** Payment Mandate total in minor units (string so BigInt round-trips). */
  amountMinorUnits: string;
  /** Three-letter ISO 4217 currency, copied from the Cart Mandate's total. */
  currency: string;

  /** Payment Mandate `timestamp` (seconds). */
  postedAt: number;
  /** `postedAt + slaWindowSeconds` — Reg E 10-business-day default. */
  deadline: number;
  /** Window in seconds — 864_000s for Reg E, 86_400s for CBN CPR 2019. */
  slaWindowSeconds: number;
  /** Human label for the SLA primitive — `"reg-e-10bd"` / `"cbn-cpr-24h"`. */
  slaRegime: string;

  /** Pinned sanctions-list snapshot ingested with this mandate. */
  sanctionsSnapshot: SanctionsListSnapshot;

  /** Server-assigned replay counter. 1 on first post, bumps on replay. */
  occurrence: number;

  /** Status after the Beacon's replay-safety and SLA checks. */
  status: BeaconStatus;
  /**
   * Reason string when `status !== "posted"` — surfaced in the inspector UI
   * and in the Discord/Slack regulator channel.
   */
  statusReason?: string;

  /** Phase B — Arbiscan tx hash of the on-chain anchor. */
  anchorTxHash?: Hex;
  /** Phase B — chain id of the anchor transaction. */
  anchorChainId?: number;

  /** ISO 8601 of when the receipt was computed. */
  computedAt: string;
};
