#!/usr/bin/env tsx
/**
 * Fail reproducer — the Beacon's sanctions-list drift invariant.
 *
 * A mandate is ingested against OFAC SDN `2026-10-02`. A verifier later
 * tries to replay the same mandate against OFAC SDN `2026-10-23` — a
 * normal weekly rotation. The Beacon routes the drifted replay to
 * `duplicate-routed` rather than letting it quietly "upgrade" to the
 * current list — reproducibility of the original authorisation is the
 * audit-replay invariant.
 *
 * The regulatory anchor: 31 CFR §501 appendix A requires snapshot-based
 * screening evidence, not current-state verification.
 */

import { buildBeaconReceipt, pinSanctionsSnapshot } from "../../lib/beacon";
import { fixture } from "./_beacon-fixture";

const { cart, payment, merchant } = fixture();

const ingestSnapshot = pinSanctionsSnapshot("ofac-sdn", "2026-10-02");
const driftedSnapshot = pinSanctionsSnapshot("ofac-sdn", "2026-10-23");

const ingested = buildBeaconReceipt(
  {
    cartMandate: cart,
    paymentMandate: payment,
    merchantAddress: merchant,
    sanctionsSnapshot: ingestSnapshot,
  },
);

const replayedWithDrift = buildBeaconReceipt(
  {
    cartMandate: cart,
    paymentMandate: payment,
    merchantAddress: merchant,
    sanctionsSnapshot: ingestSnapshot,
  },
  { verifierSnapshot: driftedSnapshot },
);

if (ingested.status !== "posted") {
  console.error(
    `✗ ingest should be status=posted; got ${ingested.status}`,
  );
  process.exit(1);
}
if (replayedWithDrift.status !== "duplicate-routed") {
  console.error(
    `✗ drifted replay should be status=duplicate-routed; got ${replayedWithDrift.status}`,
  );
  process.exit(1);
}
if (!replayedWithDrift.statusReason?.includes("sanctions-list-drift")) {
  console.error(
    `✗ reason should name sanctions-list-drift; got "${replayedWithDrift.statusReason}"`,
  );
  process.exit(1);
}
if (ingested.sanctionsSnapshot.digest === driftedSnapshot.digest) {
  console.error(`✗ pinned digests must differ across publishedAt rotations`);
  process.exit(1);
}

console.log(
  `✓ beacon-sanctions-list-drift — gate fired at beacon: replay against drifted snapshot refused`,
);
console.log(
  `  ingest ${ingested.sanctionsSnapshot.list}@${ingested.sanctionsSnapshot.publishedAt} ` +
    `vs verifier ${driftedSnapshot.list}@${driftedSnapshot.publishedAt}`,
);
