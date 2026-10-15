# Devpost submission draft — Kajota Mesh for PayPal × AI

**Target: ~2 000 characters** per playbook move #5 (Keeperhub winners: 1 903 and 2 330 chars; our Keeperhub loss: 6 300 chars). Reviewed only against this cap after one revision pass; the artefact is the verb, not the argument for the verb.

---

## Elevator pitch (≤280 chars for the Devpost field)

Kajota Mesh is the atomic payout rail for the agent sell-side. One PayPal order, N payees, same block as the merchant. AP2-bound, PYUSD-settled on Arbitrum — the 43rd tool for the PayPal Agent Toolkit, and the one that pays agents what they just earned.

## Inspiration

Marketplaces are moated by their sell side — makers, resellers, agents who close sales. The buy side is a search bar. The sell side comes back only if payout arrives fast and visibly.

I spent a decade in Nigerian payment infra — Remita, Ecobank, Breet — reconciling settlement that landed days after the sale, and when more than one party contributed, taking T+30 or a quarterly spreadsheet to cut everyone in. Agentic commerce makes that wall unbearable: an AI agent that closes a sale and waits for a human to reconcile its commission is a lead-gen tool with worse UX. Mesh pays the agent in the same block as the merchant.

## What it does

PayPal's Agent Toolkit gives agents 42 tools. **Not one pays an agent.** The Cart API has no `splits` field; the AP2 Payment Mandate names one `merchant_agent`. Mesh fills the gap. A PayPal checkout fires our webhook with the AP2 Mandate pair; the verifier cross-refs `payment_details_id`, projects the Cart plus Channel3 affiliate attribution into a 2–16-recipient tuple summing to 10 000 bps, registers on `CosellRegistryV2` (Arbitrum Sepolia), deposits PYUSD and releases atomically in one transaction. The `/leaderboard` ranks every agent and affiliate by PYUSD earned, with streaks — standing is a reward you don't have to pay out in cash.

## How we built it

Next.js 16 strict + AG Grid + viem + jose + Vercel AI SDK + PayPal Agent Toolkit. On-chain: ten verified contracts carried forward from Arbitrum Singapore (`KaJota-inc/kajota-arbitrum-singapore@9f8fb5e`), 97 forge tests. PYUSD escrow is a redeploy against Paxos's canonical Sepolia address.

## Challenges

Runnable, not prose: `scripts/fail/*.ts` fires sum-not-10 000-bps, duplicate-recipient, expired-cart-mandate, swapped-mandate-pair, tampered-cart-contents. `pnpm reproduce:fail` prints a hash per branch.

## Accomplishments

Two upstream PRs: `paypal/agent-toolkit#98` (per-call PayPal-Request-Id) and a technical comment on `google-agentic-commerce/AP2#255`'s on-chain-settlement thread. A GitHub Actions runner fires one end-to-end execution every six hours; `/evidence` is the live ledger.

## What we got wrong first

[`WHAT_WE_GOT_WRONG_FIRST.md`](WHAT_WE_GOT_WRONG_FIRST.md) — six honest entries. Chief: our first AP2 Payment Mandate schema was wrong on three load-bearing fields; the real Pydantic names exactly one `merchant_agent` — the gap Mesh fills.

## Built with

PayPal Agent Toolkit · PayPal Cart API v1 · PayPal Payouts · PYUSD · AP2 v0.2 (Payment Mandate SD-JWT-VC) · Channel3 search · Arbitrum Sepolia · viem · Next.js 16 · AG Grid · Vercel AI SDK · OpenAI · jose · zod · `KaJota-inc/kajota-arbitrum-singapore` (Mesh substrate, Apache 2.0).

---

_Draft character count target: 1 900–2 100 chars across Inspiration + What it does + How we built it + Challenges + Accomplishments + What we got wrong first (excluding the elevator pitch and built-with list which Devpost scores separately). Measured after each edit until the target locks on 03 Nov._
