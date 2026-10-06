# Mandate Beacon — compliance-receipt layer under AP2

**Date:** 2026-10-06. **Status:** Phase A shipped on `feat/mandate-beacon-ap2-plug`.
**Substrate:** ported from `kajota-zama` branch `hackathon/bli-mandate-beacon` HEAD `83db96c` (BLI Legal Tech Hackathon 2 submission, deadline 2026-11-01).

## One-line pitch

> Every AP2 Payment Mandate becomes a cryptographically-signed compliance receipt — commitment hash byte-identical to the on-chain `MandateAnchor` leaf — so a regulator can replay the agent's purchase authority without touching customer PII.

Slot-fill against the Rule-0 template: `<Reg E 12 CFR 1005.11 provisional-credit SLA>` + `<Chainlink-CRE-anchored, PII-redacted, regulator-replayable AP2 Mandate receipt>`.

## Why the US rail is honest

The Beacon's primitive was built around a Nigerian anchor (CBN Consumer Protection Regulation 2019, 24-hour reversal SLA, NIP replay-safety gap). The US adaptation keeps the primitive and swaps the regulatory label:

| Field | Nigerian rail | US rail |
|---|---|---|
| SLA regime | `cbn-cpr-24h` | `reg-e-10bd` (default) |
| Window | 86 400 s (24 hr) | 864 000 s (10 business days) |
| Dispute clock | CBN × NCC 24-hour refund draft | Reg E 60-day error-resolution window |
| Sanctions list default | CBN DND / NFIU | OFAC SDN (31 CFR §501 app A) |
| Signing authority | Issuing bank | Merchant agent (AP2 §4 `merchant_agent`) |

The commitment hash layout is identical across both rails. A regulator holding both the AP2 Mandate pair and the on-chain mandate record gets the same `keccak256(...)` leaf — see `lib/beacon/canonical.ts:mandateCommitment` and `kajota-zama/contracts/beacon/MandateAnchor.sol:mandateCommitment`.

## What the plug added

- `lib/beacon/types.ts` — `BeaconReceipt`, `BeaconStatus`, `SanctionsListSnapshot`
- `lib/beacon/canonical.ts` — byte-identical port of `MandateAnchor.mandateCommitment()` (9-field `abi.encode` → `keccak256`), plus `idempotencyKeyFor`, `mandateIdFor`, `envelopeHashFor`, `creTickBucket`, `minorUnitsFromDecimal`
- `lib/beacon/sanctions.ts` — pinned-snapshot primitive with drift detection
- `lib/beacon/receipt.ts` — `buildBeaconReceipt(mandatePair) → BeaconReceipt` with replay-safety + sanctions-drift checks
- `lib/beacon/replay-store.ts` — process-local idempotency-key store (Phase B → Vercel KV)
- `app/api/paypal/webhook/route.ts` — Beacon receipt attached to every `Session` at ingest
- `app/api/mandate/receipt/[paymentMandateId]/route.ts` — `GET` endpoint returning the receipt by Payment Mandate id
- `scripts/fail/beacon-replay-within-ttl.ts` — replay-safety reproducer (gate fires at `beacon`)
- `scripts/fail/beacon-sanctions-list-drift.ts` — sanctions-list drift reproducer (gate fires at `beacon`)

## The named host-protocol defect (AP2 version)

PayPal's webhook spec retries on `5xx`/timeout up to 25 attempts across 72 hours. AP2 itself documents a Payment Mandate as unique via `payment_mandate_id`, but the id is held by the signing wallet — a compromised agent, a client-authored retry, or a merchant integration with retry-at-ambiguity semantics can mint a fresh Payment Mandate id against the same cart contents, defeating a naive `payment_mandate_id`-keyed dedupe (scar §12). The Beacon layer defends against this by deriving a **server-authored** idempotency key from the canonical Payment Mandate contents, the amount, and the 5-minute CRE tick bucket — a reposted mandate inside the same bucket collides regardless of what id the client minted, and routes to `duplicate-routed` rather than auto-settling. Honest adjacency to PocketChange's A2P2 §7 call-out (BLI Legal Tech 2 field): same defect family, different host.

## Reg E anchor (the US judge lever)

12 CFR 1005.11(c)(2) requires a financial institution to provisionally credit a disputed EFT within ten business days of a complaint. The Beacon's `slaWindowSeconds` defaults to 864 000 — if the deadline passes without a matching reversal event, the `emitSLABreach(mandateId)` call on the deployed contract emits `SLABreached` on-chain, giving the regulator a tamper-evident timeline without a bank login. The GENIUS Act (public law 118-168, full enforcement January 2027) raises the audit bar for payment stablecoins — a PYUSD settlement with a Beacon-anchored receipt satisfies the "tamper-evident log" requirement under §501.

## Phase B — what's open

- Deploy `MandateAnchor` to Arbitrum Sepolia at a stable address; emit `postMandate` from the webhook so the receipt carries `anchorTxHash`.
- Swap in `canonicalize` from npm for RFC 8785 JCS parity.
- Promote `beaconReplayStore` from in-process `Map` to Vercel KV so a replay 72 hours after a cold start still routes to `duplicate-routed`.
- Full OFAC SDN pull from `https://ofac.treasury.gov/consolidated/consolidated.json` with scheduled digest refresh; keep `pinSanctionsSnapshot` as the deterministic fallback.
- `/mandate-inspector/[paymentMandateId]` UI page rendering the receipt with "verify on Arbiscan" link.

Related: [[project_bli_legal_tech_2]] · [[project_paypal_ai_hackathon]] · [[hackathon_winning_playbook]] (§Rule-0 primitive-first, §Rule-2 hard-parts).
