#!/usr/bin/env tsx
/**
 * Phase A dry-run reproducer.
 *
 * Builds a stub AP2 Cart Mandate + Payment Mandate, verifies both through
 * `lib/ap2/verify`, projects the Cart into the exact tuple that
 * `CosellRegistryV2.register(productId, recipients, shares, currency)` will
 * accept, and prints the canonical hashes a chain write would consume.
 *
 * Does NOT hit the chain. Does NOT require any env vars. Does NOT require
 * `pnpm dev` to be running. Pure library-level reproducer that makes the
 * Phase A pipeline testable before any sandbox credential or on-chain
 * deploy has landed.
 *
 * Usage:
 *   pnpm reproduce
 *   # or: pnpm tsx scripts/reproduce-paypal-mesh-flow.ts
 */

import { randomUUID } from "node:crypto";
import { generateKeyPair, SignJWT } from "jose";

import { cartMandateHash, paymentMandateContentsHash } from "../lib/ap2/hash";
import { verifyCartMandate, verifyPaymentMandate } from "../lib/ap2/verify";
import {
  DEFAULT_ATTRIBUTION_POLICY,
  projectCartToMeshListing,
} from "../lib/ap2/mesh-projection";
import type { CartMandate, PaymentMandate } from "../lib/ap2/types";

// ───────────────────────────────────────────────────────────────────────────
// Config — intentionally hard-coded. The reproducer must be deterministic
// enough to answer "did the pipeline still parse correctly?" with no setup.
// ───────────────────────────────────────────────────────────────────────────

const MERCHANT_ADDRESS = "0x742d35Cc6634C0532925a3b844Bc9e7595f8bEb6" as const;
const AGENT_ADDRESS = "0x1234567890abcdef1234567890abcdef12345678" as const;
const AFFILIATE_ADDRESS = "0xabcdefabcdefabcdefabcdefabcdefabcdefabcd" as const;

const PRODUCT_TITLE = "Leather tote bag (demo)";
const PRODUCT_TOTAL_USD = "19.99";
const MERCHANT_NAME = "Demo Merchant";
const MERCHANT_DID = "did:web:demo-merchant.example";

// ───────────────────────────────────────────────────────────────────────────

async function main() {
  console.log("Kajota × PayPal — Phase A reproducer");
  console.log("─".repeat(72));

  const { privateKey, publicKey } = await generateKeyPair("ES256");
  console.log("● generated dev ES256 keypair (stands in for the merchant key)");

  const paymentDetailsId = `req_${randomUUID()}`;
  const paypalOrderId = `PP_${randomUUID().replace(/-/g, "").slice(0, 17).toUpperCase()}`;

  const cartContents = {
    id: `cart_${randomUUID()}`,
    user_cart_confirmation_required: false,
    payment_request: {
      methodData: [{ supportedMethods: "https://paypal.com/pay" }],
      details: {
        id: paymentDetailsId,
        total: {
          label: "Total",
          amount: { currency: "USD", value: PRODUCT_TOTAL_USD },
        },
        displayItems: [
          {
            label: PRODUCT_TITLE,
            amount: { currency: "USD", value: PRODUCT_TOTAL_USD },
          },
        ],
      },
    },
    cart_expiry: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
    merchant_name: MERCHANT_NAME,
  };

  const hashForJwt = cartMandateHash(cartContents);
  console.log(`● cart_hash: ${hashForJwt}`);

  const merchantAuthorization = await new SignJWT({
    cart_hash: hashForJwt,
    jti: `jti_${randomUUID()}`,
  })
    .setProtectedHeader({ alg: "ES256", typ: "JWT" })
    .setIssuer(MERCHANT_DID)
    .setSubject(MERCHANT_DID)
    .setAudience("https://payment-processor.example")
    .setIssuedAt()
    .setExpirationTime("10m")
    .sign(privateKey);

  const cartMandate: CartMandate = {
    contents: cartContents,
    merchant_authorization: merchantAuthorization,
  };
  console.log("● Cart Mandate built + merchant_authorization JWT signed");

  const paymentMandate: PaymentMandate = {
    payment_mandate_contents: {
      payment_mandate_id: `pm_${randomUUID()}`,
      payment_details_id: paymentDetailsId,
      payment_details_total: cartContents.payment_request.details.total,
      payment_response: {
        requestId: paymentDetailsId,
        methodName: "https://paypal.com/pay",
        details: { paypal_order_id: paypalOrderId },
      },
      merchant_agent: MERCHANT_DID,
      timestamp: new Date().toISOString(),
    },
    user_authorization: "<stub: SD-JWT-VC envelope deferred to Phase B>",
  };
  console.log("● Payment Mandate built (user_authorization stubbed for Phase A)");

  // ─────────────────────────────────────────────────────────────────────
  console.log("\n── 1. verifyCartMandate ────────────────────────────────────");
  const cartResult = await verifyCartMandate(cartMandate, publicKey);
  if (!cartResult.ok) {
    throw new Error(
      `cart verify failed at ${cartResult.stage}: ${cartResult.reason}`,
    );
  }
  console.log("✓ schema + jose.jwtVerify + cart_hash cross-check all pass");

  // ─────────────────────────────────────────────────────────────────────
  console.log("\n── 2. verifyPaymentMandate ────────────────────────────────");
  const paymentResult = await verifyPaymentMandate(paymentMandate, cartMandate);
  if (!paymentResult.ok) {
    throw new Error(
      `payment verify failed at ${paymentResult.stage}: ${paymentResult.reason}`,
    );
  }
  console.log("✓ schema + payment_details_id cross-ref + timestamp sanity pass");
  console.log("· SD-JWT-VC signature verification deferred to Phase B");

  // ─────────────────────────────────────────────────────────────────────
  console.log("\n── 3. projectCartToMeshListing ────────────────────────────");
  const projection = projectCartToMeshListing({
    cart: cartMandate,
    merchant: MERCHANT_ADDRESS,
    agent: AGENT_ADDRESS,
    affiliate: AFFILIATE_ADDRESS,
  });
  console.log(
    `✓ ${projection.recipients.length}-party listing projected (${
      projection.shares.join("/")
    } bps)`,
  );
  console.log(
    `  grossAmount = ${projection.grossAmount.toString()} ${projection.currency} minor units`,
  );
  console.log(
    "  policy      = default " +
      `(affiliate ${DEFAULT_ATTRIBUTION_POLICY.affiliateBps}bps, agent ${DEFAULT_ATTRIBUTION_POLICY.agentBps}bps, merchant residual)`,
  );
  logJson("MeshListingTuple", projection);

  // ─────────────────────────────────────────────────────────────────────
  console.log("\n── 4. transaction_data (SD-JWT-VC Phase B input) ──────────");
  const txData = [
    cartMandateHash(cartMandate.contents),
    paymentMandateContentsHash(paymentMandate.payment_mandate_contents),
  ] as const;
  console.log(`  cart_mandate_hash              = ${txData[0]}`);
  console.log(`  payment_mandate_contents_hash  = ${txData[1]}`);

  // ─────────────────────────────────────────────────────────────────────
  console.log("\n── 5. Phase A stop-point ──────────────────────────────────");
  console.log("The next step is on-chain:");
  console.log("  CosellRegistryV2.register(productId, recipients, shares, currency)");
  console.log("  → PYUSD.approve(escrow, grossAmount)");
  console.log("  → CosellEscrowV2(PYUSD).deposit(listingId, grossAmount)");
  console.log("");
  console.log("Gated on:");
  console.log("  • MESH_ORCHESTRATION_PRIVATE_KEY (funded Arb Sepolia EOA with PYUSD)");
  console.log("  • MESH_RELEASE_AUTH_PRIVATE_KEY  (release-auth EOA)");
  console.log("  • MESH_ARBITRUM_SEPOLIA.cosellEscrowV2Pyusd deployed against");
  console.log("    Paxos PYUSD at 0x637A1259C6afd7E3AdF63993cA7E58BB438aB1B1");
  console.log("");
  console.log("All library-level pieces work; the pipeline is soldered.");
}

function logJson(label: string, value: unknown) {
  console.log(`\n${label}:`);
  console.log(
    JSON.stringify(
      value,
      (_, v) => (typeof v === "bigint" ? v.toString() : v),
      2,
    ),
  );
}

main().catch((err) => {
  console.error("\n✗ reproducer failed:", err);
  process.exit(1);
});
