#!/usr/bin/env tsx
/**
 * Failure mode #5 — the Cart Mandate's `contents` are mutated after signing.
 *
 * The merchant_authorization JWT's `cart_hash` claim is bound to the
 * canonical hash of the original CartContents. `verifyCartMandate` computes
 * the hash of the submitted contents and refuses when it diverges from the
 * JWT payload. This exercises the branch where an attacker alters the
 * cart total but keeps a valid-looking JWT envelope.
 */

import { randomUUID } from "node:crypto";
import { generateKeyPair, SignJWT } from "jose";
import { cartMandateHash } from "../../lib/ap2/hash";
import { verifyCartMandate } from "../../lib/ap2/verify";
import type { CartMandate } from "../../lib/ap2/types";

async function main() {
const { privateKey, publicKey } = await generateKeyPair("ES256");

const originalContents = {
  id: `cart_${randomUUID()}`,
  user_cart_confirmation_required: false,
  payment_request: {
    methodData: [{ supportedMethods: "https://paypal.com/pay" }],
    details: {
      id: `req_${randomUUID()}`,
      total: { label: "Total", amount: { currency: "USD", value: "19.99" } },
    },
  },
  cart_expiry: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
  merchant_name: "Demo",
};

const originalHash = cartMandateHash(originalContents);

const merchantAuthorization = await new SignJWT({
  cart_hash: originalHash,
  jti: `jti_${randomUUID()}`,
})
  .setProtectedHeader({ alg: "ES256", typ: "JWT" })
  .setIssuer("did:web:demo-merchant.example")
  .setIssuedAt()
  .setExpirationTime("10m")
  .sign(privateKey);

// Tamper: knock the price down from $19.99 to $0.01 after signing.
const tamperedContents = {
  ...originalContents,
  payment_request: {
    ...originalContents.payment_request,
    details: {
      ...originalContents.payment_request.details,
      total: { label: "Total", amount: { currency: "USD", value: "0.01" } },
    },
  },
};
const tamperedHash = cartMandateHash(tamperedContents);

const tampered: CartMandate = {
  contents: tamperedContents,
  merchant_authorization: merchantAuthorization,
};

const result = await verifyCartMandate(tampered, publicKey);
if (result.ok) {
  console.error(
    `✗ verifier accepted tampered contents — original ${originalHash}, tampered ${tamperedHash}`,
  );
  process.exit(1);
}
console.log(
  `✓ fail-tampered-cart-contents — gate fired at ${result.stage}: ${result.reason}`,
);
console.log(`  original_hash = ${originalHash}`);
console.log(`  tampered_hash = ${tamperedHash}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
