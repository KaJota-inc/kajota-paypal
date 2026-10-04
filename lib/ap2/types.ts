import { z } from "zod";

/**
 * Minimum viable AP2 Payment Mandate schema (v0.2.0).
 *
 * Source: https://ap2-protocol.org/ap2/payment_mandate/
 *
 * The authoritative schema is a W3C Verifiable Credential; the subset below
 * is what Mesh needs at deposit time: the mandate type, the transaction id
 * (used as the idempotency key), the cart composition that feeds recipients
 * and shares into CosellRegistryV2.register(), and the issuer/holder DIDs
 * that bind the mandate to an identity.
 *
 * The full VC payload passes through unchanged in `raw` so a judge inspecting
 * the Mandate Inspector modal sees the complete signed JSON.
 */

export const CartItemSchema = z.object({
  productId: z.string(),
  title: z.string(),
  quantity: z.number().int().positive(),
  priceCents: z.number().int().nonnegative(),
  merchantDomain: z.string(),
});

export const PayeeSchema = z.object({
  role: z.enum(["merchant", "agent", "affiliate", "platform", "referrer"]),
  address: z.string().regex(/^0x[a-fA-F0-9]{40}$/),
  shareBps: z.number().int().min(0).max(10_000),
  displayName: z.string().optional(),
});

export const PaymentMandateSchema = z.object({
  vct: z.literal("mandate.payment"),
  transaction_id: z.string().min(1),
  issuer_did: z.string(),
  holder_did: z.string(),
  issued_at: z.string().datetime(),
  expires_at: z.string().datetime(),

  cart: z.object({
    items: z.array(CartItemSchema).min(1),
    currency: z.string(),
    totalCents: z.number().int().positive(),
    payees: z.array(PayeeSchema).min(2).max(16),
  }),

  payment_request: z.object({
    method: z.enum(["paypal_order", "paypal_balance", "pyusd", "card"]),
    paypal_order_id: z.string().optional(),
    amount_cents: z.number().int().positive(),
    currency: z.string(),
  }),

  signature: z.object({
    algorithm: z.string(),
    value: z.string(),
  }),

  raw: z.record(z.unknown()).optional(),
});

export type CartItem = z.infer<typeof CartItemSchema>;
export type Payee = z.infer<typeof PayeeSchema>;
export type PaymentMandate = z.infer<typeof PaymentMandateSchema>;

/**
 * Validate that the payees' basis-point shares sum to exactly ten thousand,
 * mirroring CosellRegistryV2's on-chain invariant.
 */
export function assertSharesSumToDenominator(payees: Payee[]): void {
  const total = payees.reduce((acc, p) => acc + p.shareBps, 0);
  if (total !== 10_000) {
    throw new Error(
      `payee shares must sum to 10000 bps, got ${total} across ${payees.length} payees`
    );
  }
}
