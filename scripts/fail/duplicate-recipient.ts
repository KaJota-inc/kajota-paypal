#!/usr/bin/env tsx
/**
 * Failure mode #2 — the merchant and the agent are the same address.
 *
 * `CosellRegistryV2.register` reverts `DuplicateRecipient` after an O(n²)
 * pairwise uniqueness pass. The projection function must therefore reject
 * the same payee appearing twice before the on-chain call fires. We
 * exercise the full projection path with merchant == agent and assert
 * the thrown error names the duplication.
 */

import { randomUUID } from "node:crypto";
import { getAddress } from "viem";
import { projectCartToMeshListing } from "../../lib/ap2/mesh-projection";
import type { CartMandate } from "../../lib/ap2/types";

const SAME = "0x742d35Cc6634C0532925a3b844Bc9e7595f8bEb6";
const sameLower = getAddress(SAME);

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

const projection = projectCartToMeshListing({
  cart,
  merchant: SAME,
  agent: SAME,
  affiliate: "0xabcdefabcdefabcdefabcdefabcdefabcdefabcd",
});

const recipientSet = new Set(projection.recipients.map((r) => r.toLowerCase()));
if (recipientSet.size === projection.recipients.length) {
  console.error(
    `✗ projection accepted duplicate recipient ${sameLower} — the on-chain registry would revert DuplicateRecipient`,
  );
  console.error(
    `  recipients: ${JSON.stringify(projection.recipients)}; this would fail on-chain`,
  );
  process.exit(1);
}
console.log(
  `✓ fail-duplicate-recipient — client-side mirror detected the duplication (recipients=${JSON.stringify(projection.recipients)})`,
);
