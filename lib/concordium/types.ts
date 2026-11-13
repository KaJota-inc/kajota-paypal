/**
 * Verified-by-Concordium preflight types.
 *
 * Shape mirrors Fizzl13/x402-doctor's four-state taxonomy so a judge can
 * score depth state-for-state (SCOUT_MEMO.md section 3). States are the
 * exhaustive outcome set for one payment option against the seller's
 * Concordium Agent Registry record. A `verified-*` outcome passes; the
 * `mismatch`, `endpoint-unlisted`, `revoked` and `card-mismatch` outcomes
 * refuse; the others are "not a pass, not a fail".
 */

/** The agent an Agent Card's badge points to, as the registry sees it. */
export type ConcordiumAgent = {
  /** CIS-2 token address (Base58Check) — the badge. */
  tokenAddress: string;
  /** Nullable: unknown for a foreign/unresolved badge. */
  tokenId: number | null;
  /** Concordium account of the identity-verified owner. */
  owner: string | null;
  /** Agent wallet (optional per CIS-8004). */
  agentWallet: string | null;
  /** `"Active" | "Revoked" | …` — registry status word. */
  status: string | null;
  /** The card URI the on-chain record pins. */
  agentUri: string | null;
  /** Which registry: `"mainnet"` or `"testnet"`. */
  network: "mainnet" | "testnet";
  /** CAIP-2 id of the network, e.g. `ccd:4221332d…`. */
  chain: string;
};

/** Outcomes per payment option. */
export type VerifyOutcome =
  | "verified-wallet"
  | "verified-external-key"
  | "owner-only"
  | "mismatch"
  | "not-bound"
  | "revoked"
  | "card-mismatch"
  | "endpoint-unlisted"
  | "no-agent-wallet"
  | "not-read";

export type VerifyResult = {
  /** The payment-option network (CAIP-2) this outcome is for. */
  network: string | null;
  /** The payment-option payTo string. */
  payTo: string | null;
  outcome: VerifyOutcome;
  reason?: string;
};

export type Verification = {
  /**
   * Present when the seller's agent card carries a parseable Concordium
   * badge extension. Null otherwise (the agent has no badge at all).
   */
  agent: ConcordiumAgent | { tokenAddress: string } | null;
  results: VerifyResult[];
};

/** Preflight reason level — info never refuses, caution refuses. */
export type ReasonLevel = "info" | "caution";

export type PreflightReason = {
  level: ReasonLevel;
  code: ReasonCode;
  message: string;
};

export type ReasonCode =
  | "concordium_verified"
  | "concordium_revoked"
  | "concordium_card_mismatch"
  | "concordium_endpoint_unlisted"
  | "concordium_payto_mismatch"
  | "concordium_payto_changed_bound"
  | "concordium_payto_changed";
