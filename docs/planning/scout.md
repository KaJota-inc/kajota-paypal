# PayPal AI Hackathon — field scout

_Compiled 04 Oct 2026 (Day 3 of 42). Submission deadline 12 Nov 2026, 12:00 PM PST / 3:00 PM EST._

---

## 1. Executive summary

Four facts carry the submission.

**(a) The gallery is empty.** Of 4,576 registrants, no project has yet been published 72 hours into a 42-day window. Live comparative scouting is therefore premature; the field map in Section 4 is drawn instead from PayPal's own agentic-commerce surface, the AP2 protocol specification, past PayPal Dev Days coverage, and public work on `paypal/agent-toolkit`.

**(b) The host product has a load-bearing gap.** The PayPal Agent Toolkit exposes forty-two tools across invoicing, orders, subscriptions, disputes, catalogues and shipment tracking. Not one of them pays an agent. The Cart API v1 (`POST /merchant-cart`, `POST /merchant-cart/{cartId}/checkout`) accepts no `splits`, `payees`, `distributions` or `revenue_share` field in its published schema. The toolkit lets an agent *spend* on behalf of a consumer; it offers nothing that lets an agent *earn* for closing a sale. That is the defect this submission names and fills.

**(c) The Kajota Mesh substrate solves it.** Ten verified contracts on Arbitrum Sepolia, shipped as the Arbitrum Open House Singapore submission on 04 Oct 2026, settle an atomic 2–16-party fan-out from a single stablecoin deposit — token-agnostic, deactivate-only registry, zero-dust rounding, and a gasless EIP-3009 pay-in via `X402DepositFacilitator`. Two token pairs are live today (USDC and USDG); PYUSD is a constructor-level redeploy against a Paxos address that already exists on Arbitrum Sepolia at `0x637A1259C6afd7E3AdF63993cA7E58BB438aB1B1`.

**(d) AP2 is the bridge.** The Agent Payments Protocol (v0.2.0, April 2026; donated to the FIDO Alliance; co-founded with Google, Mastercard, PayPal, Coinbase, American Express and ~60 further partners now exceeding one hundred) represents each agentic purchase as three signed W3C Verifiable Credentials — Intent Mandate, Cart Mandate, Payment Mandate. The Payment Mandate (`vct = "mandate.payment"`, `transaction_id = base64url(hash(checkout_jwt))`) is the cryptographic receipt we snapshot into a Mesh `listingId` so the on-chain fan-out inherits the human authorisation it rode in on.

Together these support a primitive-first pitch: **PayPal + AP2 + PYUSD + N-party fan-out = the forty-third tool for the Agent Toolkit.** See `pitch.md`.

---

## 2. Hackathon vitals

| Field | Value |
|---|---|
| Devpost URL | https://paypalaihackathon.devpost.com/ |
| Window | 01 Oct 2026 → 12 Nov 2026, 12:00 PM PST (3:00 PM EST) |
| Winners announced | 21 Dec 2026 |
| Registered participants (04 Oct) | 4,576 |
| Published projects (04 Oct) | 0 |
| Total prize pool | ~$67,500+ in cash plus credits and subscriptions |

**Grand prizes.** 1st $12,000 · 2nd $8,000 · 3rd $5,000.

**Category awards (each $5,000, one winner):** Most Creative · Most Impactful · Best Demo Delivery · Best Use of PayPal + AI · **Best Use of Agentic Commerce**.

**Sponsor awards.** AG Grid ($5k / $2k / $1k) · APIMatic (3 × $1k + 6-month business subscription) · Bryntum (3 × $1k) · Channel3 ($1,500) · Render (credits $1k / $750 / $500).

**Judging rubric (order given; no weights disclosed).**

1. **Technological Implementation** — depth of PayPal Developer Platform and AI use; non-trivial working implementation.
2. **Design** — a coherent product experience, not merely a technical proof of concept.
3. **Potential Impact** — a credible, specific case for a real problem and real audience; the demonstration must actually address it.
4. **Innovation / Idea** — how novel the concept is and how it differs from existing work.
5. **Presentation** — a three-minute video that demonstrates the project end to end and communicates problem, audience and significance.

**Mandatory submission artefacts.** A public GitHub repository with a visible licence file; a functional demonstration (either reproducible instructions in the repo or a hosted URL — mockups do not count); a project description identifying the tools used; a demo video under three minutes, uploaded to YouTube, publicly visible, free of third-party trademarks or copyrighted music; and the submission form itself.

**Hard integration requirements.** Meaningful integration of at least one PayPal technology, API, SDK, product or developer capability; meaningful incorporation of AI into the experience or functionality.

**Prior-work rule.** New or existing projects are both admissible, "as long as you make meaningful progress on the project during the course of the hackathon." The Mesh substrate is therefore eligible as the foundation, provided we land material PayPal-side work in-window.

**Judges (PayPal-heavy):** Jo Franchetti, Eddie Jaoude, Marco Podien (DevRel) · Karthik Ravi (Engineering) · Himraj Singh (EM) · Nathaniel Olson (Senior PM) · Sylwia Vargas (AG Grid) · Ameer Hassan (APIMatic co-founder) · Mats Bryntse (Bryntum CEO) · Ignacio Valdez Bicard (Channel3) · Carly Richmond (Elastic) · Pooja Mistry (Postman) · Shifra Williams (Render).

**Fine print to re-verify on the submission form.** The marketing page is silent on AI-generated voice and sped-up video. The Zama S4 lesson applies: open the Devpost submission form and walk every field before locking the demo. [[feedback_submission_form_rules_first]].

---

## 3. The HOST-project defect

Our winning-playbook rule two tells us to name a specific defect in the project we integrate with and fix it in the open. The PayPal Developer Platform makes this unusually easy.

### 3.1 The 42-tool, zero-payout toolkit

The PayPal Agent Toolkit (`github.com/paypal/agent-toolkit`, 183 commits, 17 open issues) exposes the following surface to any LLM via OpenAI's Agent SDK, Vercel's AI SDK, LangChain and the Model Context Protocol:

| Category | Tool count | Representative tools |
|---|---|---|
| Invoicing | 20 | `create_invoice`, `send_invoice`, `record_payment_for_invoice`, `create_recurring_series` |
| Payments | 5 | `create_order`, `pay_order`, `get_order`, `create_refund`, `get_refund` |
| Disputes | 3 | `list_disputes`, `get_dispute`, `accept_dispute_claim` |
| Shipment | 3 | `create_shipment_tracking`, `update_shipment_tracking` |
| Catalog | 3 | `create_product`, `list_products`, `show_product_details` |
| Subscriptions | 8 | `create_subscription_plan`, `cancel_subscription` |
| Reporting | 2 | `list_transactions`, `get_merchant_insights` |
| **Payouts / mass-payout / revenue-share** | **0** | **—** |

Forty-two tools, each oriented toward a merchant transacting with a consumer. The agent is the mediator; it is never a payee.

### 3.2 The Cart API v1 ratifies this asymmetry

PayPal's limited-release Agentic Commerce product (hosted at `developer.paypal.com/docsai/limited-release/agentic-commerce/`) ships four Cart endpoints: `POST /merchant-cart`, `GET /merchant-cart/{cartId}`, `PUT /merchant-cart/{cartId}`, `POST /merchant-cart/{cartId}/checkout`. The published summary enumerates no multi-payee field. The downloadable schema (`schema.json`, `schema.yaml`) will be inspected directly next session, but the summary page's silence on `splits` is itself evidence: were such a field present, it would be the headline capability.

### 3.3 PayPal's own blog confirms the one-way framing

The "Accelerating Agentic Payments" post defines agentic commerce as "AI agents autonomously discovering, deciding, and purchasing on behalf of consumers." Verbs: discover, decide, purchase. All consumer-side. The word *payout*, the phrase *revenue share*, the construction *multi-party* — none appear.

### 3.4 Named consequence

The commercial consequence of this gap is already visible in the sponsor roster. **Channel3** (`trychannel3.com`) ships "Every product on the internet, in one API" with explicit *affiliate-ready offer selection where commission data is available*. Every API return from Channel3 carries the economic shape of a multi-party transaction (buyer, merchant, affiliate, agent) but no PayPal primitive settles that shape atomically. Payouts live in a separate rail — Payouts v1, mass-payout CSVs, delayed off-platform reconciliation — none of which an agent can trigger inside an AP2 Payment Mandate flow.

Mesh closes this loop.

---

## 4. Parallel-slot competitor scan

Direct scouting of the Devpost gallery will be worthless until roughly 05 Nov; we re-scout on the cadence given in Section 7. In the interim, three parallel-slot proxies are useful.

**(a) `paypal/agent-toolkit` fork activity.** 183 commits on main; 17 open issues; the examples directory contains Vercel AI SDK, OpenAI Agent SDK and MCP integrations, each of which demonstrates the agent *consuming* PayPal services. No fork or issue found so far proposes an agent-earns-money tool. If one emerges in the next six weeks, we re-position; the delta to our pitch is unlikely to be small because the toolkit itself cannot settle on-chain today.

**(b) PayPal Dev Days 2025 — "Agentic Integrations" track.** Confirmed as a hackathon track in May 2025. Winners were not retrieved; the mandate was "developed agents addressing business challenges using MCP Server, Agent Toolkit, or PayPal APIs." The judges have therefore seen hobbyist agentic hacks before, which raises the bar above "agent calls `create_invoice`." Our substrate (10 contracts, 97 tests, two live tokens, published demo) clears that bar on day one.

**(c) Protocol-war positioning.** Public analysis frames the agentic-payment protocol space as Visa TAP vs Google AP2 vs Coinbase x402 vs PayPal. We integrate three of the four: AP2 for the Mandate, x402 for gasless pay-in, PayPal for consumer-side checkout and PYUSD for settlement. A submission that spans the full width of the fault line is rare; one that spans it and still answers a specific merchant pain point (where does the agent's commission land?) is rarer.

Nothing scouted so far threatens Rule 0. The pitch stands.

---

## 5. Sponsor-award pathways

The main prizes aside, five sponsor bonuses are within reach from a single codebase. In descending alignment:

1. **Best Use of Agentic Commerce ($5,000)** — the strongest fit. Our primitive is a *missing agentic-commerce feature*, not a generic AI integration.
2. **Best Use of PayPal + AI ($5,000)** — comparable fit. Agent Toolkit + Cart API + PYUSD span three PayPal products.
3. **Channel3 ($1,500)** — plug the Channel3 search API in as the discovery edge of the demo. Every returned product offer carries affiliate commission data, which maps one-to-one onto a Mesh listing's `recipients[]` and `shares[]`.
4. **Most Impactful ($5,000)** — contingent on telling the economic story clearly: today the agent economy pays no one; tomorrow it pays everyone atomically.
5. **Best Demo Delivery ($5,000)** — contingent on video craft. [[feedback_demo_video_production]] and [[feedback_realvoice_demo_video]] are the recipes we lean on.

Secondary and lower-fit (reach, not goal): **AG Grid** ($5k / $2k / $1k) — a merchant-side revenue dashboard built in AG Grid would be a defensible addition and is low-effort; **APIMatic** ($1k + 6-month subscription) — publishing a Postman + APIMatic reference collection off the Cart API is modest work; **Render** ($1k credit) — our hub is already on Render ([[project_kajota_hub]]), so re-hosting the demo there is near-free; **Bryntum** — gantt/scheduler UI, not an obvious fit, do not chase.

Target: Grand or Agentic Commerce bonus as the primary spine; stack Channel3, Most Impactful and Best Demo Delivery as realistic adjacencies. Do not scatter effort across all sponsors.

---

## 6. Risks and open fine print

| Risk | Mitigation / open action |
|---|---|
| Sped-up video or AI-generated voice silently banned on the submission form | Walk the form end-to-end by 15 Oct and lock the ruling. [[feedback_submission_form_rules_first]] |
| "Meaningful progress during the hackathon" rule tested if the submission is read as an Arbitrum rehash | Ship PayPal-side artefacts under `kajota-paypal` as the primary repo; keep `kajota-arbitrum-singapore` as a submodule or linked substrate; demonstrate commit activity within the Oct–Nov window on the primary repo |
| PYUSD on Arbitrum Sepolia has no public faucet documented beyond `faucet.paxos.com` | Confirm the faucet works; if not, mint a `MockPYUSD` with byte-identical EIP-3009 domain [[Mesh scar #11]] and label the demo clearly |
| Judges may not read on-chain tx hashes as proof — they must click | Hosted demo at `kajota-paypal.vercel.app` with a live counter of settled fan-outs; a connect-wallet-and-register-a-listing path for the judge themselves ([[project_arbitrum_singapore]] lesson) |
| License missing in the About section fails the submission check | Add MIT (or Apache-2.0, consistent with Mesh substrate) at scaffold time, surface in `About` |
| AP2 reference libraries are Python/TS/Kotlin/Go — not Solidity | Verify the Mandate on a Node/Vercel edge function before hitting the chain; chain receives only the Mandate's `transaction_id` + hash |

Open fine-print questions to resolve on the submission form:

- Team size cap?
- Must the demo reproduce fully with sandbox credentials provided by the judge, or does a hosted demo satisfy the "functional demo" requirement on its own?
- Any clause on hackathon-period prior work (e.g. "committed before 01 Oct must not count toward implementation effort")?
- Any clause on sponsor-award eligibility (opt-in checkbox, separate form, mutually exclusive)?
- Does the three-minute cap apply to the YouTube video length or only to the demonstration itself?

---

## 7. Scouting cadence

The gallery will fill unevenly. We re-scout on this schedule, each pass logged below this section with a date and tally:

- **11 Oct** — first early-filer pass; snapshot gallery count.
- **25 Oct** — mid-window scouting; look for revenue-split and affiliate-attribution submissions explicitly.
- **05 Nov** — final-week scouting; freeze the pitch, do not retune after this.
- **10 Nov** — form walk-through dress rehearsal.
- **12 Nov** — submit before 09:00 PST to leave three-hour recovery buffer.

Scout checks per pass: `cosell`, `co-sell`, `revenue split`, `fan-out`, `fan out`, `payout split`, `N-party`, `multi-party payment`, `agent commission`, `affiliate attribution`, `AP2`, `payment mandate`, `PYUSD payout`, `agentic earn`, `agent payable`.

---

## 8. Sources

- https://paypalaihackathon.devpost.com/ — hackathon brief
- https://paypalaihackathon.devpost.com/project-gallery — gallery (empty on 04 Oct)
- https://developer.paypal.com/tools/agents/quickstart/ — Agent Toolkit quickstart
- https://github.com/paypal/agent-toolkit — Agent Toolkit source
- https://docs.paypal.ai/ — Agentic Commerce docs root
- https://developer.paypal.com/docsai/limited-release/agentic-commerce/quickstart — Cart API quickstart
- https://developer.paypal.com/api/agentic-commerce/v1 — Cart API reference
- https://developer.paypal.com/community/blog/accelerating-agentic-payments/ — PayPal positioning
- https://developer.paypal.com/community/blog/pyusd-on-arbitrum/ — PYUSD L2 announcement
- https://docs.sandbox.paxos.com/guides/stablecoin/pyusd/testnet — PYUSD testnet addresses (Arb Sepolia confirmed)
- https://ap2-protocol.org/ap2/payment_mandate/ — AP2 Payment Mandate schema
- https://cloudsecurityalliance.org/blog/2025/10/06/secure-use-of-the-agent-payments-protocol-ap2-a-framework-for-trustworthy-ai-driven-transactions — AP2 security framing
- https://blockeden.xyz/blog/2026/03/14/payment-giants-agent-protocol-war-visa-tap-google-ap2-coinbase-x402-paypal-ai-commerce/ — protocol-war context
- https://www.trychannel3.com/ — Channel3 product
- https://docs.paxos.com/guides/stablecoin/pyusd/mainnet — PYUSD mainnet (comparison)
- Kajota Mesh substrate — `/Users/oluwaboriola/Documents/kajota-arbitrum-singapore` HEAD `9f8fb5e`
