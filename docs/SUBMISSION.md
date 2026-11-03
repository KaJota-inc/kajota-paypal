# Devpost submission draft — Kajota Mesh for PayPal × AI

**Target: 1 900–2 100 characters** per playbook move #5 (Keeperhub winners: 1 903 and 2 330 chars; our Keeperhub loss: ~6 300 chars). The artefact is the verb, not the argument for the verb.

Measurement excludes the elevator pitch (Devpost scores it separately) and the Built-with list.

---

## Elevator pitch (≤280 chars for the Devpost field)

Kajota Mesh is the atomic payout rail for the agent sell-side. One PayPal order, N payees, same block as the merchant. AP2-bound, PYUSD-settled on Arbitrum — the 43rd tool for the PayPal Agent Toolkit, and the one that pays agents what they just earned.

## Inspiration

A decade inside Nigerian payment infra meant reconciling settlement that landed days after the sale. When more than one party contributed, cutting them in took T+30 or a quarterly spreadsheet. Agentic commerce makes that wall unbearable: an agent that closes a sale and waits for a human to reconcile its commission is a lead-gen tool with worse UX. Mesh pays the agent in the same block as the merchant.

## What it does

PayPal's Agent Toolkit gives agents **42 tools**. Zero pay an agent. The Cart API has no `splits` field; the AP2 Payment Mandate names one `merchant_agent`. Mesh is the 43rd tool. A PayPal checkout fires our webhook; the verifier cross-refs `payment_details_id`, projects the cart plus Channel3 attribution into an N-recipient split summing to 10 000 bps, and `CosellEscrowV2(PYUSD)` on Arbitrum Sepolia releases to every payee in one block. `/leaderboard` ranks agents by PYUSD earned — standing as a reward you don't pay out in cash.

## How we built it

Next.js 16 strict + AG Grid + viem + jose + PayPal Agent Toolkit. Ten verified Arbitrum Sepolia contracts from `KaJota-inc/kajota-arbitrum-singapore`. The Mandate Beacon compliance layer ports from `kajota-zama` and ships a server-authored idempotency key — the AP2 §7 replay-inside-TTL defect, HARD_PARTS scar #19.

## Challenges

Runnable, not prose. `pnpm reproduce:fail` fires seven adversarial gates with a hash per branch (bps mismatch, duplicate recipient, swapped mandate pair, tampered cart, expired mandate, beacon replay inside TTL, sanctions-list drift). `HARD_PARTS.md` carries 21 scars, each with a file path or Arbiscan link.

## Accomplishments

Five upstream artefacts queued: `paypal/agent-toolkit#98` and `#43`, `AP2#372` and `#367`, plus an on-chain-settlement comment on `AP2#255`. A GitHub Actions runner fires one end-to-end execution every six hours; `/evidence` is the public no-login ledger a judge clicks, not clones.

## What we got wrong first

Seven entries in [`WHAT_WE_GOT_WRONG_FIRST.md`](WHAT_WE_GOT_WRONG_FIRST.md). Chief: our first AP2 schema was wrong on three load-bearing fields; the real Pydantic names exactly one `merchant_agent` — the gap Mesh fills.

## Built with

PayPal Agent Toolkit · PayPal Cart API v1 · PayPal Payouts · PYUSD · AP2 v0.2 (Payment Mandate SD-JWT-VC) · Channel3 search · Arbitrum Sepolia · viem · Next.js 16 · AG Grid · Vercel AI SDK · OpenAI · jose · zod · `KaJota-inc/kajota-arbitrum-singapore` (Mesh substrate, Apache 2.0) · `kajota-zama hackathon/bli-mandate-beacon` (Mandate Beacon layer, MIT).

---

_Body char-count target: 1 900–2 100 chars across Inspiration → What we got wrong first (excluding elevator and Built-with, scored separately). Lock on 2026-11-10 per `docs/RECORDING_LOCK.md`._
