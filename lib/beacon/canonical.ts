import {
  encodeAbiParameters,
  getAddress,
  keccak256,
  stringToBytes,
  toHex,
  type Hex,
} from "viem";

import { canonicalJson } from "../ap2/hash";
import type { PaymentMandateContents } from "../ap2/types";

/**
 * Byte-identical port of `MandateAnchor.mandateCommitment()` from
 * `kajota-zama/contracts/beacon/MandateAnchor.sol`. The Solidity hash is:
 *
 *   keccak256(abi.encode(
 *     mandateId, bank, idempotencyKey, amount, postedAt, deadline,
 *     envelopeHash, sanctionsListVersion, occurrence
 *   ))
 *
 * This file reproduces that layout exactly so the TypeScript receipt a
 * regulator inspects (`/api/mandate/receipt/[id]`) matches the Solidity view
 * (`mandateCommitment(mandateId)`) when the Beacon address is deployed. The
 * same primitive therefore anchors the Nigerian rail (CBN CPR 2019 24-hour
 * window) and the US rail (Reg E 10-business-day provisional credit) without
 * duplicating the hashing contract across repos — a BLI judge replaying the
 * Payflow fixtures gets the same bytes a PayPal judge replays here.
 */

export const REG_E_PROVISIONAL_CREDIT_SECONDS = 10 * 24 * 60 * 60;
export const CBN_CPR_2019_SECONDS = 24 * 60 * 60;

/**
 * CRE 5-minute tick bucket. Chainlink CRE workflows normally batch at this
 * cadence; the bucket is the second input to the idempotency key so a
 * webhook retry inside the same bucket collides and routes to human
 * approval, while a legitimate re-authorisation in a later bucket does not.
 */
export const CRE_TICK_SECONDS = 5 * 60;

export function creTickBucket(
  timestampSeconds: number,
  bucket: number = CRE_TICK_SECONDS,
): number {
  return Math.floor(timestampSeconds / bucket);
}

export function minorUnitsFromDecimal(value: string, decimals: number): bigint {
  if (!/^\d+(\.\d+)?$/.test(value)) {
    throw new Error(`invalid decimal value: ${value}`);
  }
  const [intPart, fracPart = ""] = value.split(".");
  const padded = (fracPart + "0".repeat(decimals)).slice(0, decimals);
  const combined = (intPart + padded).replace(/^0+(?=\d)/, "") || "0";
  return BigInt(combined);
}

/**
 * The server-derived idempotency key. The caller cannot author it — see
 * MandateAnchor §9 of `project_bli_legal_tech_2`'s hard-parts table — so
 * a compromised agent cannot force a collision with a later honest post.
 */
export function idempotencyKeyFor(
  paymentContents: PaymentMandateContents,
  amountMinorUnits: bigint,
  postedAtSeconds: number,
): Hex {
  const bucket = creTickBucket(postedAtSeconds);
  const payload = `${canonicalJson(paymentContents)}|${amountMinorUnits.toString()}|${bucket}`;
  return keccak256(stringToBytes(payload));
}

/**
 * The 32-byte mandate identifier used on-chain. We derive it deterministically
 * from the Payment Mandate id so a regulator reads the AP2 fingerprint
 * directly on Arbiscan without a side-channel.
 */
export function mandateIdFor(paymentMandateId: string): Hex {
  return keccak256(stringToBytes(paymentMandateId));
}

/**
 * The redacted envelope hash — `keccak256` of the AP2 base64url Cart Mandate
 * hash so the on-chain `bytes32` is well-sized. PII never leaves off-chain;
 * the envelope hash is what the chain sees of the customer order.
 */
export function envelopeHashFor(cartMandateHashBase64Url: string): Hex {
  return keccak256(stringToBytes(cartMandateHashBase64Url));
}

type CommitmentInput = {
  mandateId: Hex;
  merchantAddress: Hex;
  idempotencyKey: Hex;
  amountMinorUnits: bigint;
  postedAtSeconds: number;
  deadlineSeconds: number;
  envelopeHash: Hex;
  sanctionsListVersion: Hex;
  occurrence: number;
};

/**
 * The 9-field abi.encode layout from the Solidity. uint64 for the money/time
 * scalars matches the on-chain Mandate struct. getAddress() enforces
 * checksummed casing — a mandate committed to the lowercase hex would
 * verify to a different keccak than one committed to the EIP-55 form.
 */
export function mandateCommitment(input: CommitmentInput): Hex {
  const encoded = encodeAbiParameters(
    [
      { type: "bytes32" },
      { type: "address" },
      { type: "bytes32" },
      { type: "uint64" },
      { type: "uint64" },
      { type: "uint64" },
      { type: "bytes32" },
      { type: "bytes32" },
      { type: "uint8" },
    ],
    [
      input.mandateId,
      getAddress(input.merchantAddress),
      input.idempotencyKey,
      input.amountMinorUnits,
      BigInt(input.postedAtSeconds),
      BigInt(input.deadlineSeconds),
      input.envelopeHash,
      input.sanctionsListVersion,
      input.occurrence,
    ],
  );
  return keccak256(encoded);
}

export function toHex32FromBase64Url(base64url: string): Hex {
  const base64 = base64url.replace(/-/g, "+").replace(/_/g, "/");
  const padded = base64 + "=".repeat((4 - (base64.length % 4)) % 4);
  const buf = Buffer.from(padded, "base64");
  if (buf.length !== 32) {
    throw new Error(`expected 32-byte input, got ${buf.length} bytes`);
  }
  return toHex(buf);
}
