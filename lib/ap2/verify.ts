import { jwtVerify } from "jose";
import {
  CartMandateSchema,
  CartMandateJwtPayloadSchema,
  PaymentMandateSchema,
  type CartMandate,
  type PaymentMandate,
} from "./types";
import { cartMandateHash } from "./hash";

export type VerificationResult<T> =
  | { ok: true; value: T }
  | {
      ok: false;
      reason: string;
      stage: "schema" | "signature" | "hash" | "mandate-cross-ref" | "expiry";
    };

/**
 * Verify an AP2 Cart Mandate.
 *
 * (1) parse against the Pydantic-equivalent zod schema,
 * (2) `jose.jwtVerify` the merchant_authorization JWT against the merchant's
 *     public key,
 * (3) assert the JWT payload's `cart_hash` claim matches our canonical hash
 *     of `contents`.
 *
 * The caller supplies the merchant's verifier key; resolving it from a
 * merchant DID or x5c chain is Phase B.
 */
export async function verifyCartMandate(
  mandate: unknown,
  merchantPublicKey: CryptoKey | Uint8Array,
): Promise<VerificationResult<CartMandate>> {
  const parsed = CartMandateSchema.safeParse(mandate);
  if (!parsed.success) {
    return { ok: false, reason: parsed.error.message, stage: "schema" };
  }
  const cart = parsed.data;

  if (!cart.merchant_authorization) {
    return {
      ok: false,
      reason: "merchant_authorization missing — unsigned Cart Mandate cannot verify",
      stage: "signature",
    };
  }

  let payload: unknown;
  try {
    const verified = await jwtVerify(cart.merchant_authorization, merchantPublicKey);
    payload = verified.payload;
  } catch (err) {
    return {
      ok: false,
      reason: `JWT signature verification failed: ${(err as Error).message}`,
      stage: "signature",
    };
  }

  const parsedPayload = CartMandateJwtPayloadSchema.safeParse(payload);
  if (!parsedPayload.success) {
    return { ok: false, reason: parsedPayload.error.message, stage: "schema" };
  }

  const expectedHash = cartMandateHash(cart.contents);
  if (parsedPayload.data.cart_hash !== expectedHash) {
    return {
      ok: false,
      reason: `cart_hash mismatch: payload=${parsedPayload.data.cart_hash}, canonical=${expectedHash}`,
      stage: "hash",
    };
  }

  // The JWT envelope has its own iat/exp — enforced by jwtVerify above —
  // but AP2 CartContents carries a separate `cart_expiry` for the cart
  // itself. A valid-JWT / expired-cart pairing is a real attack surface.
  const cartExpiry = Date.parse(cart.contents.cart_expiry);
  if (Number.isNaN(cartExpiry)) {
    return {
      ok: false,
      reason: "cart_expiry is not a valid ISO 8601 timestamp",
      stage: "schema",
    };
  }
  if (cartExpiry < Date.now()) {
    return {
      ok: false,
      reason: `cart_expiry ${cart.contents.cart_expiry} is in the past`,
      stage: "expiry",
    };
  }

  return { ok: true, value: cart };
}

/**
 * Verify an AP2 Payment Mandate.
 *
 * The Payment Mandate's `user_authorization` is an SD-JWT-VC bound to the
 * canonical hashes of (CartMandate, PaymentMandateContents) via its
 * key-binding JWT's `transaction_data` array.
 *
 * **Phase A** implements structural verification only:
 *   (1) zod parse,
 *   (2) cross-reference the Cart Mandate's `payment_details.id` with the
 *       Payment Mandate's `payment_details_id` so a mandate pair cannot be
 *       swapped at submission time,
 *   (3) basic timestamp sanity.
 *
 * **Phase B** adds:
 *   - parse the SD-JWT-VC envelope via the `sd-jwt-vc` npm package,
 *   - verify the issuer-signed VC against the issuer DID's public key,
 *   - verify the key-binding JWT against the holder key named in `cnf.jwk`,
 *   - verify `transaction_data[0] === cartMandateHash(cartMandate.contents)`,
 *   - verify `transaction_data[1] === paymentMandateContentsHash(contents)`.
 */
export async function verifyPaymentMandate(
  mandate: unknown,
  associatedCart: unknown,
): Promise<VerificationResult<PaymentMandate>> {
  const parsed = PaymentMandateSchema.safeParse(mandate);
  if (!parsed.success) {
    return { ok: false, reason: parsed.error.message, stage: "schema" };
  }
  const payment = parsed.data;

  const parsedCart = CartMandateSchema.safeParse(associatedCart);
  if (!parsedCart.success) {
    return {
      ok: false,
      reason: `associated CartMandate did not parse: ${parsedCart.error.message}`,
      stage: "mandate-cross-ref",
    };
  }
  const cart = parsedCart.data;

  const cartPaymentDetailsId = cart.contents.payment_request.details.id;
  if (
    cartPaymentDetailsId !== undefined &&
    cartPaymentDetailsId !== payment.payment_mandate_contents.payment_details_id
  ) {
    return {
      ok: false,
      reason: `payment_details_id mismatch: cart=${cartPaymentDetailsId}, payment=${payment.payment_mandate_contents.payment_details_id}`,
      stage: "mandate-cross-ref",
    };
  }

  const timestamp = Date.parse(payment.payment_mandate_contents.timestamp);
  if (Number.isNaN(timestamp)) {
    return {
      ok: false,
      reason: "payment_mandate_contents.timestamp is not a valid ISO 8601 timestamp",
      stage: "schema",
    };
  }

  // Phase B: SD-JWT-VC signature + transaction_data hash cross-check.
  return { ok: true, value: payment };
}
