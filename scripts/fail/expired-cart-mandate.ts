#!/usr/bin/env tsx
/**
 * Failure mode #3 — the Cart Mandate's `cart_expiry` is in the past.
 *
 * The JWT inside `merchant_authorization` carries its own `exp` claim that
 * `jose.jwtVerify` enforces, but the AP2 CartContents `cart_expiry` field
 * is independent of the JWT envelope. A well-constructed attack would be
 * a Cart whose JWT is still valid but whose cart_expiry has lapsed. The
 * verifier catches it in a dedicated expiry pass.
 */

import { randomUUID } from "node:crypto";
import { generateKeyPair, SignJWT } from "jose";
import { cartMandateHash } from "../../lib/ap2/hash";
import { verifyCartMandate } from "../../lib/ap2/verify";
import type { CartMandate } from "../../lib/ap2/types";

async function main() {
const { privateKey, publicKey } = await generateKeyPair("ES256");

const cartContents = {
  id: `cart_${randomUUID()}`,
  user_cart_confirmation_required: false,
  payment_request: {
    methodData: [{ supportedMethods: "https://paypal.com/pay" }],
    details: {
      id: `req_${randomUUID()}`,
      total: { label: "Total", amount: { currency: "USD", value: "19.99" } },
    },
  },
  // 10 minutes in the past.
  cart_expiry: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
  merchant_name: "Demo",
};

const merchantAuthorization = await new SignJWT({
  cart_hash: cartMandateHash(cartContents),
  jti: `jti_${randomUUID()}`,
})
  .setProtectedHeader({ alg: "ES256", typ: "JWT" })
  .setIssuer("did:web:demo-merchant.example")
  .setSubject("did:web:demo-merchant.example")
  .setAudience("https://payment-processor.example")
  .setIssuedAt()
  // JWT envelope is still valid for an hour.
  .setExpirationTime("1h")
  .sign(privateKey);

const cart: CartMandate = {
  contents: cartContents,
  merchant_authorization: merchantAuthorization,
};

const result = await verifyCartMandate(cart, publicKey);
if (result.ok) {
  console.error("✗ verifier accepted a Cart Mandate past its cart_expiry");
  process.exit(1);
}
console.log(
  `✓ fail-expired-cart-mandate — gate fired at ${result.stage}: ${result.reason}`,
);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
