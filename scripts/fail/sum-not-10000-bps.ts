#!/usr/bin/env tsx
/**
 * Failure mode #1 — attribution policy whose shares do not sum to 10 000 bps.
 *
 * The on-chain `CosellRegistryV2.register` reverts `SharesDoNotSumToDenominator`
 * for any such input. `projectCartToMeshListing` mirrors the invariant
 * client-side so a bad policy fails before an on-chain round-trip.
 *
 * This script FORCES the failure (affiliate 1000 + agent 9500 = 10 500 bps
 * before merchant residual, which would leave the merchant with −500 bps —
 * caught by the merchant-residual > 0 check) and asserts the exception.
 */

import { randomUUID } from "node:crypto";
import { projectCartToMeshListing } from "../../lib/ap2/mesh-projection";
import type { CartMandate } from "../../lib/ap2/types";

const cart: CartMandate = {
  contents: {
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
  },
};

try {
  projectCartToMeshListing({
    cart,
    merchant: "0x742d35Cc6634C0532925a3b844Bc9e7595f8bEb6",
    agent: "0x1234567890abcdef1234567890abcdef12345678",
    affiliate: "0xabcdefabcdefabcdefabcdefabcdefabcdefabcd",
    policy: { affiliateBps: 1_000, agentBps: 9_500 },
  });
  console.error("✗ projection did not throw — the gate failed to fire");
  process.exit(1);
} catch (err) {
  const message = (err as Error).message;
  console.log(`✓ fail-sum-not-10000-bps — gate fired: ${message}`);
}
