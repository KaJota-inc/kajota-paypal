#!/usr/bin/env tsx
/**
 * Fail reproducer — the Beacon's replay-safety invariant.
 *
 * Posts the same AP2 Mandate pair twice inside one CRE 5-minute tick. The
 * second attempt must NOT auto-settle; the Beacon routes it to
 * `duplicate-routed` and bumps the occurrence counter.
 *
 * Named host-protocol defect: `project_bli_legal_tech_2.md` §2 (NIP mandate
 * replay inside the SLA window). The AP2 adaptation inherits the same
 * shape — PayPal's webhook retries up to 25 times across 72 hours, and a
 * naive `payment_mandate_id`-keyed dedupe does nothing when the retry
 * carries a freshly-minted mandate id against the same cart.
 */

import { buildBeaconReceipt } from "../../lib/beacon";
import type { CartMandate, PaymentMandate } from "../../lib/ap2/types";
import { fixture } from "./_beacon-fixture";

const { cart, payment, merchant } = fixture();
const seen = new Map<`0x${string}`, number>();

const first = buildBeaconReceipt(
  { cartMandate: cart, paymentMandate: payment, merchantAddress: merchant },
  { seenIdempotencyKeys: seen },
);
const second = buildBeaconReceipt(
  { cartMandate: cart, paymentMandate: payment, merchantAddress: merchant },
  { seenIdempotencyKeys: seen },
);

if (first.status !== "posted") {
  console.error(`✗ first post should be status=posted; got ${first.status}`);
  process.exit(1);
}
if (second.status !== "duplicate-routed") {
  console.error(
    `✗ second post should be status=duplicate-routed; got ${second.status}`,
  );
  process.exit(1);
}
if (second.occurrence !== 2) {
  console.error(`✗ second occurrence should be 2; got ${second.occurrence}`);
  process.exit(1);
}
if (first.idempotencyKey !== second.idempotencyKey) {
  console.error(
    `✗ idempotency key must match across replays (same canonical mandate + bucket)`,
  );
  process.exit(1);
}
if (first.commitment === second.commitment) {
  console.error(
    `✗ commitments must differ (occurrence bump flips the final abi.encode field)`,
  );
  process.exit(1);
}

console.log(
  `✓ beacon-replay-within-ttl — gate fired at beacon: second attempt routed to duplicate-routed (occurrence ${second.occurrence})`,
);
console.log(`  reason: ${second.statusReason}`);

// Silence the unused-type lint under strict mode.
export type _Compile = CartMandate & PaymentMandate;
