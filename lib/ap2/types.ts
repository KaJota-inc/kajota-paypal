import { z } from "zod";

/**
 * AP2 (Agent Payments Protocol) v0.2 — the real schema.
 *
 * Source of truth: `code/sdk/python/ap2/models/mandate.py` in
 * github.com/google-agentic-commerce/AP2 (Apache 2.0, Pydantic). Mirrored to
 * zod below with field-for-field equivalence.
 *
 * The protocol defines three signed objects:
 *
 *   Intent Mandate   — the user authorises a shopping agent to transact
 *   Cart Mandate     — the merchant pins the cart contents (a W3C
 *                      PaymentRequest) and signs with a JWT whose payload
 *                      carries a `cart_hash` claim
 *   Payment Mandate  — the user authorises payment; signed as an SD-JWT-VC
 *                      whose key-binding JWT embeds a `transaction_data`
 *                      array of the hashes of [CartMandate,
 *                      PaymentMandateContents]
 *
 * Load-bearing observation for the Mesh integration: a Payment Mandate names
 * exactly one `merchant_agent` and carries a single `payment_details_total`.
 * AP2 does NOT express multi-payee fan-out natively — the agent and the
 * affiliate are never named as co-recipients of the payment. That is the gap
 * Mesh fills on the settlement side: see `lib/ap2/mesh-projection.ts` once
 * Phase B lands.
 */

// ──────────────────────────────────────────────────────────────────────────
// W3C PaymentRequest subset used by AP2
// ──────────────────────────────────────────────────────────────────────────

export const PaymentCurrencyAmountSchema = z.object({
  /** ISO 4217 three-letter code, e.g. `"USD"`. */
  currency: z.string().length(3),
  /** Decimal string in major currency units, e.g. `"19.99"`. */
  value: z.string(),
});

export const PaymentItemSchema = z.object({
  label: z.string(),
  amount: PaymentCurrencyAmountSchema,
  pending: z.boolean().optional(),
});

export const PaymentMethodDataSchema = z.object({
  /** Method identifier, e.g. `"basic-card"` or `"https://paypal.com/pay"`. */
  supportedMethods: z.string(),
  data: z.record(z.unknown()).optional(),
});

export const PaymentRequestSchema = z.object({
  methodData: z.array(PaymentMethodDataSchema).min(1),
  details: z.object({
    id: z.string().optional(),
    total: PaymentItemSchema,
    displayItems: z.array(PaymentItemSchema).optional(),
  }),
});

export const PaymentResponseSchema = z.object({
  requestId: z.string(),
  methodName: z.string(),
  details: z.record(z.unknown()),
  payerName: z.string().optional(),
  payerEmail: z.string().email().optional(),
  payerPhone: z.string().optional(),
  shippingAddress: z.record(z.unknown()).optional(),
  shippingOption: z.string().optional(),
});

// ──────────────────────────────────────────────────────────────────────────
// Intent Mandate
// ──────────────────────────────────────────────────────────────────────────

export const IntentMandateSchema = z.object({
  user_cart_confirmation_required: z.boolean(),
  natural_language_description: z.string(),
  merchants: z.array(z.string()).nullable().optional(),
  skus: z.array(z.string()).nullable().optional(),
  requires_refundability: z.boolean().nullable().optional(),
  /** ISO 8601 timestamp. */
  intent_expiry: z.string(),
});

// ──────────────────────────────────────────────────────────────────────────
// Cart Mandate
// ──────────────────────────────────────────────────────────────────────────

export const CartContentsSchema = z.object({
  id: z.string(),
  user_cart_confirmation_required: z.boolean(),
  payment_request: PaymentRequestSchema,
  /** ISO 8601 timestamp. */
  cart_expiry: z.string(),
  merchant_name: z.string(),
});

export const CartMandateSchema = z.object({
  contents: CartContentsSchema,
  /**
   * base64url-encoded JWT signed by the merchant. The JWT payload carries
   * iss / sub / aud / iat / exp / jti and a `cart_hash` claim that hashes the
   * canonical JSON of `contents`.
   *
   * Optional at Pydantic parse time but required at verification time.
   */
  merchant_authorization: z.string().optional(),
});

export const CartMandateJwtPayloadSchema = z.object({
  iss: z.string(),
  sub: z.string().optional(),
  aud: z.union([z.string(), z.array(z.string())]).optional(),
  iat: z.number().int(),
  exp: z.number().int(),
  jti: z.string(),
  cart_hash: z.string(),
});

// ──────────────────────────────────────────────────────────────────────────
// Payment Mandate
// ──────────────────────────────────────────────────────────────────────────

export const PaymentMandateContentsSchema = z.object({
  payment_mandate_id: z.string(),
  payment_details_id: z.string(),
  payment_details_total: PaymentItemSchema,
  payment_response: PaymentResponseSchema,
  /** Identifier for the merchant (the single AP2 payee). */
  merchant_agent: z.string(),
  /** ISO 8601 timestamp. */
  timestamp: z.string(),
});

export const PaymentMandateSchema = z.object({
  payment_mandate_contents: PaymentMandateContentsSchema,
  /**
   * base64url-encoded SD-JWT-VC. The issuer-signed VC authorises a `cnf`
   * claim naming the holder's public key; the attached key-binding JWT has:
   *
   *   aud:              credential-provider
   *   nonce:            random
   *   sd_hash:          hash of the issuer-signed VC
   *   transaction_data: [ sha256(canonical CartMandate),
   *                       sha256(canonical PaymentMandateContents) ]
   *
   * Optional at Pydantic parse time but required at verification time.
   */
  user_authorization: z.string().optional(),
});

/**
 * Shape of the `transaction_data` array embedded in the Payment Mandate's
 * key-binding JWT. Element 0 pins the Cart Mandate; element 1 pins the
 * PaymentMandateContents.
 */
export const TransactionDataSchema = z.tuple([
  z.string(), // base64url(sha256(canonical JSON of CartMandate))
  z.string(), // base64url(sha256(canonical JSON of PaymentMandateContents))
]);

// ──────────────────────────────────────────────────────────────────────────
// Type exports
// ──────────────────────────────────────────────────────────────────────────

export type PaymentCurrencyAmount = z.infer<typeof PaymentCurrencyAmountSchema>;
export type PaymentItem = z.infer<typeof PaymentItemSchema>;
export type PaymentMethodData = z.infer<typeof PaymentMethodDataSchema>;
export type PaymentRequest = z.infer<typeof PaymentRequestSchema>;
export type PaymentResponse = z.infer<typeof PaymentResponseSchema>;
export type IntentMandate = z.infer<typeof IntentMandateSchema>;
export type CartContents = z.infer<typeof CartContentsSchema>;
export type CartMandate = z.infer<typeof CartMandateSchema>;
export type CartMandateJwtPayload = z.infer<typeof CartMandateJwtPayloadSchema>;
export type PaymentMandateContents = z.infer<typeof PaymentMandateContentsSchema>;
export type PaymentMandate = z.infer<typeof PaymentMandateSchema>;
export type TransactionData = z.infer<typeof TransactionDataSchema>;
