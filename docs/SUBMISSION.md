# Devpost submission draft — Kajota Mesh for PayPal × AI

**Target: ~2 000 characters** per playbook move #5 (Keeperhub winners: 1 903 and 2 330 chars; our Keeperhub loss: 6 300 chars). Reviewed only against this cap after one revision pass; the artefact is the verb, not the argument for the verb.

---

## Elevator pitch (≤280 chars for the Devpost field)

The 43rd tool for the PayPal Agent Toolkit: fan out a PayPal order's proceeds to the merchant, the agent that closed the sale, and the affiliate — one transaction, N payees, AP2-bound, PYUSD-settled on Arbitrum.

## Inspiration

I spent a decade inside Nigerian payment infrastructure — Remita, Ecobank, Breet — building reconciliation for merchants whose settlement always landed days after the sale. The one wall every system I built hit was the same: when more than one party contributed to a sale, cutting them in took T+30 at best, a quarterly spreadsheet at worst. Agentic commerce is about to make that wall unbearable. An AI agent that discovers a product, closes the sale, and then waits for a human to reconcile its commission is not autonomous — it is a lead-gen tool with worse UX. Kajota Mesh is the primitive that lets the agent get paid at the same block the merchant does.

## What it does

PayPal's Agent Toolkit gives agents 42 tools — invoicing, orders, subscriptions, disputes. **Not one pays an agent.** The Cart API v1 accepts no `splits` field. The AP2 Payment Mandate names one `merchant_agent`. When the agent earns a commission for closing the sale, it is reimbursed days later, through an out-of-band invoice.

Mesh fills the gap. A PayPal Cart API checkout triggers our webhook with the AP2 Mandate pair. The verifier cross-refs `payment_details_id`, projects the Cart's `displayItems` plus any Channel3 affiliate attribution into a 2–16-recipient tuple summing to exactly 10 000 bps, registers the listing on `CosellRegistryV2` (Arbitrum Sepolia), deposits the PYUSD equivalent, and releases atomically to every payee in one block. The release trigger cannot change the share table — fixed at listing time.

## How we built it

Next.js 16 + TypeScript strict + AG Grid dashboard + viem for chain reads/writes + jose for Mandate verification + Vercel AI SDK + OpenAI for the buyer-chat harness + the PayPal Agent Toolkit for merchant-side tool calls. On-chain: ten verified contracts carried forward from the Arbitrum Open House Singapore submission (`KaJota-inc/kajota-arbitrum-singapore@9f8fb5e`), 97 forge tests. The PYUSD escrow pair is a redeploy against Paxos's canonical Arbitrum Sepolia PYUSD `0x637A1259…B1`.

## Challenges

Documented as runnable `scripts/fail/*.ts` not prose: sum-not-10 000-bps, duplicate-recipient, expired-cart-mandate, swapped-mandate-pair, tampered-cart-contents. `pnpm reproduce:fail` fires every gate and prints a hash per branch. The full constraints appendix with symptom-cause-fix rows is in `docs/HARD_PARTS.md`.

## Accomplishments

Two upstream contributions filed: a fix for `paypal/agent-toolkit#98` (per-call PayPal-Request-Id, closes an idempotency gap in `create_order` + `capture_order`) and a technical comment on `google-agentic-commerce/AP2#255`'s on-chain-settlement thread. A GitHub Actions runner that fires one real end-to-end execution every six hours into our deployed webhook; see `/evidence` for the accumulating ledger.

## What we got wrong first

[`WHAT_WE_GOT_WRONG_FIRST.md`](WHAT_WE_GOT_WRONG_FIRST.md) — six real entries, honestly disclosed. Chief among them: our first guess at the AP2 Payment Mandate schema was wrong on three load-bearing fields; the real Pydantic model named exactly one `merchant_agent`, which is precisely the gap Mesh fills.

## Built with

PayPal Agent Toolkit · PayPal Cart API v1 · PayPal Payouts · PYUSD · AP2 v0.2 (Payment Mandate SD-JWT-VC) · Channel3 search · Arbitrum Sepolia · viem · Next.js 16 · AG Grid · Vercel AI SDK · OpenAI · jose · zod · `KaJota-inc/kajota-arbitrum-singapore` (Mesh substrate, Apache 2.0).

---

_Draft character count target: 1 900–2 100 chars across Inspiration + What it does + How we built it + Challenges + Accomplishments + What we got wrong first (excluding the elevator pitch and built-with list which Devpost scores separately). Measured after each edit until the target locks on 03 Nov._
