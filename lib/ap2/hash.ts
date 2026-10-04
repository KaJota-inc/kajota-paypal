import { createHash } from "crypto";

/**
 * JSON Canonicalization Scheme (JCS, RFC 8785) is what AP2 mandates for
 * stable hashing. The specification is primarily about:
 *
 *   - sorting object keys lexicographically;
 *   - omitting insignificant whitespace;
 *   - normalising number serialisation per IEEE 754 / ECMA-262.
 *
 * Phase A implementation covers (1) and (2) exactly, and (3) only within the
 * limits of `JSON.stringify`. Phase B swaps in a battle-tested JCS library
 * (`canonicalize` from npm) and gates the verifier on it. For every input
 * Mesh constructs itself, the Phase A implementation is byte-identical to a
 * full JCS implementation because all our numeric fields are integers or
 * decimal strings.
 */
export function canonicalJson(value: unknown): string {
  if (value === null || typeof value !== "object") {
    return JSON.stringify(value);
  }
  if (Array.isArray(value)) {
    return `[${value.map(canonicalJson).join(",")}]`;
  }
  const obj = value as Record<string, unknown>;
  const keys = Object.keys(obj).sort();
  return `{${keys
    .map((k) => `${JSON.stringify(k)}:${canonicalJson(obj[k])}`)
    .join(",")}}`;
}

/** sha256 of a UTF-8 string, encoded as base64url without padding. */
export function sha256Base64Url(utf8: string): string {
  return createHash("sha256").update(utf8, "utf8").digest("base64url");
}

/**
 * The canonical hash of an AP2 CartMandate, as the Cart Mandate's own
 * `merchant_authorization` JWT and the Payment Mandate's `transaction_data`
 * both reference. We hash the `contents` only — the `merchant_authorization`
 * field is itself derived from this hash and so is excluded.
 */
export function cartMandateHash(cartContents: unknown): string {
  return sha256Base64Url(canonicalJson(cartContents));
}

/**
 * The canonical hash of PaymentMandateContents.
 */
export function paymentMandateContentsHash(contents: unknown): string {
  return sha256Base64Url(canonicalJson(contents));
}
