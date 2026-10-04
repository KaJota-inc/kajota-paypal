# Rule-0 primitive-first pitch

_PayPal AI Hackathon — Kajota Mesh for PayPal × AI. 04 Oct 2026._

---

## The Devpost tagline (under 150 chars)

**The 43rd tool for the PayPal Agent Toolkit: fan out an order's proceeds to the merchant, the agent, and the affiliate — one tx, N payees, AP2-bound, PYUSD-settled.**

(141 characters, including spaces.)

---

## The two-sentence pitch

The PayPal Agent Toolkit gives AI agents forty-two ways to spend money and none to earn it. **Kajota Mesh is the forty-third tool** — a programmable, atomic fan-out that splits a PayPal order's proceeds across two to sixteen payees at a share the registry locked before the money moved, bound to the AP2 Payment Mandate that authorised it, and settled in PYUSD on Arbitrum in a single transaction.

---

## The expanded pitch

PayPal's agentic-commerce surface, as the "Accelerating Agentic Payments" post puts it, lets AI agents *discover, decide, and purchase on behalf of consumers*. Three verbs. Each is consumer-side. The agent is a conduit, never a counterparty. The Cart API, the Agent Toolkit's forty-two tools, the AP2 Payment Mandate that PayPal co-signed into existence — all describe how a human's money reaches a merchant, through an agent, with cryptographic receipts. None answer the next-order question that every real agentic marketplace must answer: *when the agent, the merchant and the affiliate have all contributed to the sale, how does each one get paid, atomically, in the same transaction?*

The host product does not solve this. Payouts v1 is batch and off-platform. The Cart API accepts no `splits` field. The Mandate names a single payee. An agent that closes a sale today is reimbursed, if at all, by an invoice it emitted to the merchant days later — a workflow that defeats the point of autonomous commerce.

Kajota Mesh is the on-chain primitive that closes the loop. The system comprises an immutable, deactivate-only registry of listings, each one a tuple of two to sixteen recipient addresses with basis-point shares that must sum to exactly ten thousand; a token-agnostic escrow that holds stablecoin deposits against those listings; an x402-style gasless pay-in facilitator that consumes an EIP-3009 `TransferWithAuthorization` and routes the deposit without the buyer ever holding gas; and an identity-binding contract that links an operator's EOA to its ERC-8004 attestation on a home chain. The release path is zero-argument — the entity that triggers settlement cannot influence who receives what, because the share table was fixed at listing time. Rounding dust falls to the last recipient by construction; the escrow retains nothing.

For PayPal, the integration is a webhook with teeth. When a PayPal order settles with an attached AP2 Payment Mandate, a trusted relayer decodes the Mandate's `cart` contents into a Mesh listing — merchant, agent (via its ERC-8004-bound EOA), referring affiliate — and deposits the equivalent of the order amount in PYUSD on Arbitrum Sepolia at `0x637A…B1B1`. Release settles each payee in the same transaction. The merchant takes PayPal's existing PYUSD-to-USD rail at their option; the agent, routinely crypto-native, keeps PYUSD. The Mandate's `transaction_id` (base64url of the checkout JWT hash) becomes a natural idempotency key, so webhook retries fan out the proceeds exactly once.

The substrate is not vapour. Ten contracts are verified on Arbitrum Sepolia; a mirrored stack is live on Robinhood Chain testnet; two token pairs settle real USDC and USDG today; ninety-seven unit tests pass; the hosted demo at `kajota-mesh.vercel.app` reads the chain directly over `viem` logs with no indexer; and the Oct 4 reproducer `scripts/oct4-agent-settlement.sh` runs a three-party fan-out in four transactions from a cold shell. PYUSD support is a redeploy, not a rewrite, because the escrow and facilitator take `IERC20` at construction.

What we build in-window is the PayPal seam: an AP2 Mandate decoder on a Vercel edge function; a PayPal webhook listener that verifies the signature and triggers deposit; a merchant-side React dashboard — rendered through AG Grid as a Rule-1 form-factor match to PayPal's own merchant surface — that shows each order's Mandate, listing hash, N-way fan-out and on-chain receipt; and a Channel3 discovery edge in the agent-side demo so that *every product the agent chooses already carries the affiliate attribution that becomes the second payee*. The video opens on a consumer prompt, closes on a four-recipient Arbiscan transaction, and in between the merchant dashboard refreshes with every settlement in real time — the primitive-first pitch landing as a merchant feature, not an engineering demo.

---

## Why this survives the field

**Technological Implementation.** Agent Toolkit (invoked by the agent-side agent) + Cart API (merchant-side checkout) + PYUSD (settlement token) + AP2 (Mandate decoder) + Mesh (fan-out) — five load-bearing PayPal/standards surfaces, each used non-trivially. The ninety-seven-test substrate establishes we did not learn Solidity last week.

**Design.** The judge-visible surface is a merchant dashboard, not a block explorer. AG Grid gives the row-level breakdown of each sale into payees; the Mandate hash is a one-click modal. The agent-side experience is a shopper chat; the on-chain receipt is a tooltip, not the headline.

**Potential Impact.** Three real-world audiences, each with a specific problem the primitive solves:
- The Channel3-style affiliate network that today reconciles commissions on T+30 and loses sellers to platforms that pay faster.
- The agentic storefront whose AI shopping agents produce measurable conversions but cannot bank the uplift inside the same session.
- The platform-plus-creator two-sided marketplace that today splits its payouts via quarterly spreadsheet.

**Innovation / Idea.** Two novelties, neither thin. First, the agentic-commerce stack is normally framed as discovery → decision → purchase; we add settlement → attribution as its missing fourth stage, naming the host gap explicitly. Second, the Mandate-to-listing snapshot binds a W3C Verifiable Credential to an on-chain fan-out in a way that neither AP2 nor PayPal document publicly today.

**Presentation.** A sub-three-minute video. Open on the problem (an agent, an unpaid affiliate, a quarterly spreadsheet). Cut to the primitive (one PayPal order, one Mandate, one Mesh listing). Hold on the settlement (four Arbiscan links lighting up in the dashboard). Close on the headline: _forty-three_. The playbook ([[feedback_demo_video_production]], [[feedback_realvoice_demo_video]], [[feedback_receipt_pip_video_pattern]]) carries it the rest of the way.

---

## Title candidates (pick one at launch; favour the first)

1. **Kajota Mesh — the 43rd Agent Toolkit tool** (ties the pitch to the gap and the number)
2. **Mesh for PayPal — one order, N payees, one transaction**
3. **The PayPal fan-out** (short, confident, memorable)
4. **Mandate to Mesh — AP2's missing payee** (standards-anchored)

Deprecated candidates: anything containing "revolutionary", "powered by", "next-generation", or three nouns strung together. See [[hackathon_winning_playbook]] rule 5.
