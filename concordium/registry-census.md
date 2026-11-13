# Concordium Agent Registry — census snapshot

Mirrors the Fizzl13/x402-doctor PR #508 census line so a judge scoring
integration depth can compare state-for-state.

**Snapshot:** 2026-11-13 (hour 6 of Kajota's Concordium build, Nov 13).
**Source:** read via `verifyConcordium` against `CONCORDIUM_REGISTRY_MCP`
(default: `https://testnet-agent-registry.concordium.com/mcp`).

> _Note: the live census against the Concordium testnet registry MCP is
> fired by `node concordium/demo.mjs`. Rows below are placeholders kept in
> the repo until the testnet wallet is funded and the Kajota Agent Card is
> pinned; `concordium/ccdscan-links.md` carries the live tx hashes once the
> four pinning transactions (register / card-pin / Base-bind / Arb-bind)
> have been fired._

## Testnet census

| Field | Value | Notes |
|---|---|---|
| Agents observed | TBD | Total `agent_by_token_address` responses across sample range |
| Distinct owner accounts | TBD | Unique `owner_account` values |
| Agent-wallet-set ratio | TBD | Share of agents with a non-null `agent_wallet` |
| Card-hash match ratio | TBD | Share where `sha256(agent-card.json) == metadata_hash_hex` |
| `x402Support` extension declared | TBD | Fizzl13 2 Nov 2026: *"none of the agents declares x402Support"* |
| CIS-8 external-key bindings | TBD | Share with at least one `external_reference.key` |

## Interpretation

If `x402Support` remains at zero, Kajota is the first agent registry entry
to declare a working x402 facilitator path with Concordium sponsored
fees. That is the "credible path to production" dimension flagged in
`SCOUT_MEMO.md` section 3.

## Path to production

- The Mandate Beacon (shipped on Arb-Sepolia + Base Sepolia) consumes the
  `concordium_verdict` field returned from `/api/mandate/receipt/:id` and
  annotates the receipt without blocking.
- The `/chat` buyer agent gates on `verdict(reasons)`. A `caution`
  terminates the pipeline before PayPal checkout fires, so a mismatched
  or revoked badge never reaches settlement.
- A merchant with no Agent Card is unchanged — the preflight returns
  `agent: null, results: []` and the pipeline continues.
