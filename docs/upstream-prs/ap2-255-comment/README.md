# Upstream comment draft — `google-agentic-commerce/AP2` #255

**Issue:** [google-agentic-commerce/AP2#255](https://github.com/google-agentic-commerce/AP2/issues/255) — hilarl, "[Proposal] On-chain settlement-side mandate binding for AP2."

**Status:** comment drafted, not yet posted. Posting is a user-approved step.

**Why this issue:**

- It's our thesis in Google's own repo. hilarl names the exact gap Mesh fills, with a reference implementation (RIVR stablecoin, 113 forge tests). The 8-reply thread is populated by production AP2 practitioners — chopmob-cloud (AlgoVoi, cross-chain settlement attestations), evidai (LemonCake x402 gateway), AmitabhainArunachala (live `/mandate/verify` endpoint), Ectsang (filed PR #252 on the same cross-rail cap problem).
- The playbook explicitly says *"the one place to test whether the framing lands before it is frozen into a submission"* is the ecosystem conversation around the thesis. This is that place.
- A substantive technical comment with a Mesh pointer lands credibility under `google-agentic-commerce` — the organisation whose protocol our Rule-0 pitch names.

## Shape of the comment

We're a **distinct corner** of the on-chain settlement space the thread is mapping:

- hilarl / RIVR → stablecoin that enforces the Mandate at `transferWithMandate` entry
- chopmob-cloud / AlgoVoi → cross-rail gateway with session-scoped cumulative caps + hash-chained settlement attestations
- evidai / LemonCake → x402 gateway with Buyer-Key pre-authorisation
- Mesh → atomic N-party fan-out on top of ANY ERC-20, bound to the Payment Mandate at deposit time by `payment_mandate_id` + `payment_details_id` cross-ref

We're not a competing stablecoin. We're the composable primitive that sits downstream of hilarl's `MandateEnvelope` and chopmob-cloud's `settled_payment_ref`: once the Mandate authorises a transfer, Mesh distributes the proceeds across 2–16 payees in one atomic release.

## Alignment points to raise

1. **Hash canonicalisation.** The thread converges on `SHA-256(JCS(...))` lowercase hex (hilarl's `MandateEnvelope` typehash, chopmob-cloud's `#253` PR, the `x402-foundation/x402#2322` lineage). Our Phase A hash is recursive-key-sort — byte-equivalent for the integer / decimal-string shape AP2 uses but not a full RFC 8785 implementation. We should align on the full JCS before Phase B.
2. **Cumulative-cap source of truth.** Not a Mesh concern directly — the N-party split happens at `release()`, after the Mandate has already authorised the amount — but the question of whether listing deactivation is an on-chain or off-chain decision maps onto chopmob-cloud's "cap location" dichotomy.
3. **FIDO venue mapping.** chopmob-cloud's July 12 note on splitting the submission between the Payments Technical Working Group (settlement) and Agentic Authentication Technical Working Group (attestation) is the exact pattern Mesh would need: our `AgentIdentityBinding` is attestation-adjacent, our `CosellEscrowV2` is settlement.

## How to post the comment

The comment body is in [`COMMENT.md`](COMMENT.md), aimed at ~2 000 characters (per playbook move #5). Post it with:

```bash
gh issue comment 255 \
  --repo google-agentic-commerce/AP2 \
  --body-file ~/Documents/kajota-paypal/docs/upstream-prs/ap2-255-comment/COMMENT.md
```

## Files in this directory

- `README.md` — this file
- `COMMENT.md` — the GitHub comment body
