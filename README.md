# Kajota Mesh for PayPal × AI

**The 43rd tool for the PayPal Agent Toolkit** — fan out an order's proceeds to the merchant, the agent, and the affiliate, in one transaction, with N payees, bound to an AP2 Payment Mandate and settled in PYUSD on Arbitrum.

Submission for the [PayPal AI Hackathon](https://paypalaihackathon.devpost.com/) · deadline **12 Nov 2026, 12:00 PM PST**.

---

## The gap we fill

The PayPal Agent Toolkit exposes forty-two tools across invoicing, orders, subscriptions, disputes, catalogues and shipment tracking. **None of them pay an agent.** The Cart API v1 accepts no `splits`, `payees` or `distributions` field. The AP2 Payment Mandate names exactly one `merchant_agent`. An AI agent that discovers a product, closes the sale, and then waits for a human to reconcile its commission is not autonomous — it is a lead-gen tool with worse UX. Kajota Mesh is the on-chain primitive that lets the agent get paid at the same block the merchant does.

## The three surfaces a judge opens

| Surface | What it is | Why it matters |
|---|---|---|
| [`/`](http://localhost:3000) | Landing with the Rule-0 pitch and three deep-links | Thirty-second orientation |
| [`/chat`](http://localhost:3000/chat) | Buyer surface — scripted SSE agent trace walking the eight-stage pipeline | Shows how an AI agent uses the primitive |
| [`/dashboard`](http://localhost:3000/dashboard) | Merchant surface in AG Grid — every order, Mandate hash, Mesh listing, N-way fan-out and Arbiscan receipts | The sponsor product's canonical form factor |
| [`/evidence`](http://localhost:3000/evidence) | Public no-login page with live settlement counters + verify-yourself contract table | H0 click-to-verify lesson — a judge clicks, not clones |

## What runs

Phase A pipeline (soldered):

```
PayPal Cart API → AP2 Payment Mandate → /api/paypal/webhook
  → verify (schema + jose.jwtVerify + cart_hash + payment_details_id + cart_expiry)
  → Mandate Beacon receipt (compliance hash, Reg E + CBN SLA bound)
  → project (Cart.displayItems → recipients[] + shares[] = 10000 bps)
  → CosellRegistryV2.register (Arbitrum Sepolia)
  → CosellEscrowV2(PYUSD).deposit
  → release — atomic fan-out to N payees in one block
```

Reproducers:

```bash
pnpm install
pnpm reproduce             # happy path, no env needed
pnpm reproduce:fail        # 7/7 adversarial gates fire; prints a gate table
pnpm typecheck && pnpm lint && pnpm build
```

The [`scripts/fail/`](scripts/fail/) directory ships seven failing-first scripts:

- `sum-not-10000-bps` — attribution policy that would leave the merchant with negative residual
- `duplicate-recipient` — merchant and agent collapse to the same address
- `expired-cart-mandate` — valid JWT, lapsed `cart_expiry`
- `swapped-mandate-pair` — Payment Mandate for Cart B submitted with Cart A
- `tampered-cart-contents` — JWT valid, `contents.total` mutated post-signing
- `beacon-replay-within-ttl` — same mandate commitment re-presented inside the SLA window
- `beacon-sanctions-list-drift` — sanctions-list version drift between sign and settle

## Substrate

Ten verified contracts on Arbitrum Sepolia (chainId `421614`). Carried forward under its own licence from `KaJota-inc/kajota-arbitrum-singapore@9f8fb5e` (Arbitrum Open House Singapore submission, 04 Oct 2026). See [`docs/mesh-substrate`](docs/mesh-substrate/README.md).

| Contract | Address |
|---|---|
| `CosellRegistryV2` | `0x5cda1ae03fd8207cb0c7416ddc899fe89a603ef9` |
| `CosellEscrowV2` (USDC) | `0xce77674ef1f3abcd34370825390f351eb6a8fffd` |
| `CosellEscrowV2` (USDG) | `0xfc82984e0282af934dca6c38d715235d491303c2` |
| `AgentIdentityBinding` | `0x716d9c1229d38ec6f6cd7a5edd781e757a73f629` |
| `X402DepositFacilitator` (USDC) | `0xdbae565ce0be455e859cd8ff42aec8ad30bbbcf9` |
| `X402DepositFacilitator` (USDG) | `0x15f42a9f92ab72ec67fb4298f9a95a476382d0ac` |

A **PYUSD** escrow + facilitator pair deploys in Phase A against Paxos's canonical Arbitrum Sepolia PYUSD at `0x637A1259C6afd7E3AdF63993cA7E58BB438aB1B1`. See [`docs/DEPLOY.md`](docs/DEPLOY.md).

## Upstream contributions queued

Three PR drafts + one issue comment live under [`docs/upstream-prs/`](docs/upstream-prs/), each with a reviewed patch and PR body ready for one-click open:

- **`paypal/agent-toolkit#98`** — per-call `PayPal-Request-Id` override on `getHeaders()`, closes an idempotency gap in `create_order` and `capture_order`.
- **`google-agentic-commerce/AP2#372`** — `ParsedToken.cnf_jwk` enum serialisation fix (`mode="json"` on `model_dump`).
- **`google-agentic-commerce/AP2#367`** — `ReceiptClient.verify_receipt` crash when optional callback is omitted.
- **`google-agentic-commerce/AP2#255`** — ecosystem comment on hilarl's on-chain settlement-side mandate binding proposal.

Ten more candidates triaged across both backlogs in [`docs/upstream-prs/BACKLOG_SCOUT.md`](docs/upstream-prs/BACKLOG_SCOUT.md).

The [`.github/workflows/mesh-runner.yml`](.github/workflows/mesh-runner.yml) GitHub Action fires one real end-to-end execution every six hours into the deployed webhook — playbook move #1's accumulating runner.

## Local setup

```bash
pnpm install
cp .env.example .env.local
# fill PAYPAL_CLIENT_ID, PAYPAL_CLIENT_SECRET, CHANNEL3_API_KEY, OPENAI_API_KEY
pnpm dev
```

Open http://localhost:3000, then click `/chat` → `Run`, or `/dashboard` → `Seed demo rows`, or `/evidence`.

## Documentation

- [`docs/planning/WIN_PLAN.md`](docs/planning/WIN_PLAN.md) — scoreboard against the 7 winning moves + the PayPal rubric, milestones to 12 Nov
- [`docs/SUBMISSION.md`](docs/SUBMISSION.md) — ~2 000-char Devpost write-up draft, first-person Nigerian-fintech framing
- [`docs/HARD_PARTS.md`](docs/HARD_PARTS.md) — Zama-S3-shaped constraints table (21 scars across Mesh, PayPal seam, Beacon)
- [`docs/WHAT_WE_GOT_WRONG_FIRST.md`](docs/WHAT_WE_GOT_WRONG_FIRST.md) — honest ledger of build-time mistakes
- [`docs/architecture.mmd`](docs/architecture.mmd) — mermaid diagram of the eight-stage pipeline
- [`docs/AP2_MANDATE.md`](docs/AP2_MANDATE.md) — Payment Mandate decoder spec
- [`docs/WEBHOOK.md`](docs/WEBHOOK.md) — PayPal order → Mesh deposit flow
- [`docs/DEPLOY.md`](docs/DEPLOY.md) — Vercel one-time setup + env table + runner wiring
- [`docs/DEMO_VIDEO.md`](docs/DEMO_VIDEO.md) — three-minute video beat sheet
- [`docs/planning/pitch.md`](docs/planning/pitch.md), [`docs/planning/plan.md`](docs/planning/plan.md), [`docs/planning/scout.md`](docs/planning/scout.md), [`docs/planning/mandate-beacon-reuse-brief.md`](docs/planning/mandate-beacon-reuse-brief.md) — kick-off artefacts

## Verified by Concordium

The Concordium Trusted Agents layer (Encode Club × Concordium, Dec 9 2026
deadline) bolts an accountability record onto the already-shipped Kajota
buyer agent. One line summary: the Kajota agent is registered on
Concordium's Agent Registry, its Agent Card hash is pinned on chain, and
its Base + Arb Sepolia payout keys are bound via CIS-8 — so a merchant
can see *"Verified by Concordium — verified-external-key"* before any
PayPal order fires.

**Four CCDScan testnet transactions:** see
[`concordium/ccdscan-links.md`](concordium/ccdscan-links.md) for the live
hashes.

| # | Transaction | CCDScan |
|---|---|---|
| 1 | Register Agent Card (Agent Registry mint) | [testnet.ccdscan.io](https://testnet.ccdscan.io/) — see `ccdscan-links.md` |
| 2 | Pin Agent Card hash (metadata_hash on chain) | [testnet.ccdscan.io](https://testnet.ccdscan.io/) — see `ccdscan-links.md` |
| 3 | Bind Base Sepolia key via CIS-8 | [testnet.ccdscan.io](https://testnet.ccdscan.io/) — see `ccdscan-links.md` |
| 4 | x402 testnet payment with sponsored fees | [testnet.ccdscan.io](https://testnet.ccdscan.io/) — see `ccdscan-links.md` |

### Demo script

```bash
node concordium/demo.mjs
```

Runs the four-case preflight (direct analogue of Fizzl13/x402-doctor PR
#508): Kajota's own buyer agent paid; a copycat server, a payTo swap,
and a revoked-badge card all refused. Matches the integration-depth
dimension Concordium scores on.

### Verification states

The `concordium.verify` MCP tool and the on-page preflight return the
same four-state taxonomy (Fizzl13 PR #509 parity):

- `verified-external-key` — payTo is the key the agent bound via CIS-8 → pay
- `endpoint-unlisted` — card doesn't list this origin → refuse
- `mismatch` — payTo is not the agent's registered wallet → refuse
- `revoked` — registry no longer lists the agent as Active → refuse

Plus `verified-wallet`, `owner-only`, `not-bound`, `card-mismatch`,
`no-agent-wallet`, `not-read` for the remainder of the exhaustive set,
and the cross-day diff `payto_changed_bound` (info) vs `payto_changed`
(caution) for a rotated payTo. See
[`lib/concordium/verify.ts`](lib/concordium/verify.ts).

### Registry census snapshot

See [`concordium/registry-census.md`](concordium/registry-census.md).

### Path to production

- The `/chat` buyer agent gates on the Concordium verdict before PayPal
  checkout fires. A `caution` stops the pipeline.
- The `/mandate-inspector/:id` surface annotates every verdict with the
  Concordium panel (badge, owner, CCDScan links, CIS-8 bound keys).
- The `/api/mcp` endpoint wraps `verifyConcordium` + `buyer_chat.plan`
  as a Streamable-HTTP MCP so another agent — or the Concordium testnet
  Agent Registry MCP itself — can call Kajota by its Agent Card.
- Kajota's `/.well-known/agent-card.json` is the A2A Agent Card another
  agent fetches before paying, carrying the Concordium badge extension.

### Hackathon submission

Four integration goals, all covered:

- **Verified by Concordium badge** → `/mandate-inspector/*` panel + `/chat` preflight
- **ERC-8004 Agent Card in Concordium Registry** → Agent Card pinned via
  CIS-8 key binding to the existing Base + Arb-Sepolia keys
- **x402 testnet with sponsored fees** → `concordium/x402-pay.mjs`
- **MCP wrapper** → `/api/mcp` with `buyer_chat.plan` + `concordium.verify`

## Licence

[MIT](LICENSE) — the licence is visible in the repository root for Devpost submission compliance.

## Credits

Built on the Kajota Mesh substrate (`KaJota-inc/kajota-arbitrum-singapore`), the Mandate Beacon from `kajota-zama hackathon/bli-mandate-beacon`, the PayPal Developer Platform, the Agent Payments Protocol, Channel3, Vercel's AI SDK, and viem. Judges and reviewers are welcome to open issues.
