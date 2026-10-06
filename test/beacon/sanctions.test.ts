import { describe, it } from "node:test";
import assert from "node:assert/strict";

import {
  DEFAULT_SANCTIONS_SNAPSHOT,
  pinSanctionsSnapshot,
  sanctionsDigest,
  snapshotsDiffer,
} from "../../lib/beacon/sanctions";

describe("sanctionsDigest", () => {
  it("is deterministic", () => {
    assert.equal(
      sanctionsDigest("ofac-sdn", "2026-10-02"),
      sanctionsDigest("ofac-sdn", "2026-10-02"),
    );
  });

  it("differs across list labels", () => {
    assert.notEqual(
      sanctionsDigest("ofac-sdn", "2026-10-02"),
      sanctionsDigest("un-1267", "2026-10-02"),
    );
  });

  it("differs across published dates — the pinning point of the whole module", () => {
    assert.notEqual(
      sanctionsDigest("ofac-sdn", "2026-10-02"),
      sanctionsDigest("ofac-sdn", "2026-10-09"),
    );
  });
});

describe("pinSanctionsSnapshot", () => {
  it("defaults produce the DEFAULT_SANCTIONS_SNAPSHOT shape", () => {
    const snap = pinSanctionsSnapshot();
    assert.equal(snap.list, DEFAULT_SANCTIONS_SNAPSHOT.list);
    assert.equal(snap.publishedAt, DEFAULT_SANCTIONS_SNAPSHOT.publishedAt);
    assert.equal(snap.digest, DEFAULT_SANCTIONS_SNAPSHOT.digest);
  });

  it("accepts explicit list + date", () => {
    const snap = pinSanctionsSnapshot("cbn-dnd", "2026-10-05");
    assert.equal(snap.list, "cbn-dnd");
    assert.equal(snap.publishedAt, "2026-10-05");
    assert.equal(snap.digest, sanctionsDigest("cbn-dnd", "2026-10-05"));
  });
});

describe("snapshotsDiffer", () => {
  it("returns false for byte-identical snapshots", () => {
    const a = pinSanctionsSnapshot("ofac-sdn", "2026-10-02");
    const b = pinSanctionsSnapshot("ofac-sdn", "2026-10-02");
    assert.equal(snapshotsDiffer(a, b), false);
  });

  it("returns true when the publishedAt moves", () => {
    const a = pinSanctionsSnapshot("ofac-sdn", "2026-10-02");
    const b = pinSanctionsSnapshot("ofac-sdn", "2026-10-09");
    assert.equal(snapshotsDiffer(a, b), true);
  });

  it("returns true when the list changes", () => {
    const a = pinSanctionsSnapshot("ofac-sdn", "2026-10-02");
    const b = pinSanctionsSnapshot("un-1267", "2026-10-02");
    assert.equal(snapshotsDiffer(a, b), true);
  });
});
