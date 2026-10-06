import type { Hex } from "viem";

/**
 * Process-local map of Beacon idempotency keys to the highest occurrence
 * observed, used by `buildBeaconReceipt`'s replay-safety check. Phase A
 * sits in-memory; Phase B promotes to Vercel KV so a webhook replay 72
 * hours later still fires `duplicate-routed` after a cold start.
 *
 * Deliberately a plain Map, not an interface — the shape is wire-level
 * identical to `Map<Hex, number>` and swapping to KV is a one-line change
 * at the call site (webhook route) rather than a leaky abstraction here.
 */
export const beaconReplayStore = new Map<Hex, number>();
