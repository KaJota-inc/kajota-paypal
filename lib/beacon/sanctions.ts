import { keccak256, stringToBytes, type Hex } from "viem";
import type { SanctionsListSnapshot } from "./types";

/**
 * Pinned sanctions-list snapshots. The Beacon's load-bearing invariant: a
 * mandate's audit replay must verify against the list version in force at
 * ingest, never "current". OFAC's SDN list drops weekly; a mandate verified
 * three weeks later against the current list is a different question.
 *
 * The real list is a few megabytes of entities; we store a deterministic
 * `digest` here as the proof-of-pinning. The digest is `keccak256(utf8(
 * `${list}:${publishedAt}`))` for the demo pin — swap to a real SDN pull
 * before production (`https://ofac.treasury.gov/consolidated/consolidated.json`).
 */

const DEFAULT_LIST = "ofac-sdn" as const;
const DEFAULT_PUBLISHED_AT = "2026-10-02" as const;

export function sanctionsDigest(list: string, publishedAt: string): Hex {
  return keccak256(stringToBytes(`${list}:${publishedAt}`));
}

export function pinSanctionsSnapshot(
  list: string = DEFAULT_LIST,
  publishedAt: string = DEFAULT_PUBLISHED_AT,
): SanctionsListSnapshot {
  return {
    list,
    publishedAt,
    digest: sanctionsDigest(list, publishedAt),
  };
}

/**
 * Compare two snapshots for drift. Used by the replay reproducer to prove a
 * mandate re-verified against a drifted snapshot is rejected rather than
 * silently "upgraded".
 */
export function snapshotsDiffer(
  a: SanctionsListSnapshot,
  b: SanctionsListSnapshot,
): boolean {
  return a.digest !== b.digest;
}

export const DEFAULT_SANCTIONS_SNAPSHOT = pinSanctionsSnapshot();
