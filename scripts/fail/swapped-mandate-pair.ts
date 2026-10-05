#!/usr/bin/env tsx
/**
 * Failure mode #4 — Cart Mandate for order A is submitted with the Payment
 * Mandate for order B.
 *
 * `verifyPaymentMandate` cross-refs `payment_mandate_contents.payment_details_id`
 * against `cart.contents.payment_request.details.id`. If they differ, the
 * verifier refuses — a submission cannot borrow another order's authorisation.
 */

import { randomUUID } from "node:crypto";
import { generateKeyPair, SignJWT } from "jose";
import { cartMandateHash } from "../../lib/ap2/hash";
import { verifyPaymentMandate } from "../../lib/ap2/verify";
import type { CartMandate, PaymentMandate } from "../../lib/ap2/types";

async function main() {
const { privateKey } = await generateKeyPair("ES256");

function makeCart(id: string, paymentDetailsId: string) {
  return {
    id,
    user_cart_confirmation_required: false,
    payment_request: {
      methodData: [{ supportedMethods: "https://paypal.com/pay" }],
      details: {
        id: paymentDetailsId,
        total: { label: "Total", amount: { currency: "USD", value: "19.99" } },
      },
    },
    cart_expiry: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
    merchant_name: "Demo",
  };
}

const cartAContents = makeCart(`cart_${randomUUID()}`, `req_A_${randomUUID()}`);
const cartBContents = makeCart(`cart_${randomUUID()}`, `req_B_${randomUUID()}`);

const sign = (contents: ReturnType<typeof makeCart>) =>
  new SignJWT({ cart_hash: cartMandateHash(contents), jti: `jti_${randomUUID()}` })
    .setProtectedHeader({ alg: "ES256", typ: "JWT" })
    .setIssuer("did:web:demo-merchant.example")
    .setIssuedAt()
    .setExpirationTime("10m")
    .sign(privateKey);

const cartA: CartMandate = {
  contents: cartAContents,
  merchant_authorization: await sign(cartAContents),
};

const paymentMandateForB: PaymentMandate = {
  payment_mandate_contents: {
    payment_mandate_id: `pm_${randomUUID()}`,
    payment_details_id: cartBContents.payment_request.details.id,
    payment_details_total: cartBContents.payment_request.details.total,
    payment_response: {
      requestId: cartBContents.payment_request.details.id,
      methodName: "https://paypal.com/pay",
      details: { paypal_order_id: `PP_${randomUUID()}` },
    },
    merchant_agent: "did:web:demo-merchant.example",
    timestamp: new Date().toISOString(),
  },
  user_authorization: "<stub>",
};

const result = await verifyPaymentMandate(paymentMandateForB, cartA);
if (result.ok) {
  console.error("✗ verifier accepted a swapped Cart/Payment pair");
  process.exit(1);
}
console.log(
  `✓ fail-swapped-mandate-pair — gate fired at ${result.stage}: ${result.reason}`,
);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
