# Kajota Mesh for PayPal × AI

**The 43rd tool for the PayPal Agent Toolkit** — fan out an order's proceeds to the merchant, the agent, and the affiliate, in one transaction, with N payees, bound to an AP2 Payment Mandate and settled in PYUSD on Arbitrum.

Submission for the [PayPal AI Hackathon](https://paypalaihackathon.devpost.com/) · deadline **12 Nov 2026, 12:00 PM PST**.

---

## The gap we fill

The PayPal Agent Toolkit exposes forty-two tools across invoicing, orders, subscriptions, disputes, catalogues and shipment tracking. **None of them pay an agent.** The Cart API v1 accepts no `splits`, `payees` or `distributions` field. An AI agent that discovers a product, negotiates its price and closes the sale is reimbursed, if at all, by an invoice emitted days later — a workflow that defeats the point of autonomous commerce.

Kajota Mesh is the on-chain primitive that settles the gap atomically.

## What it does

1. A shopper asks an agent to find a product.
2. The agent calls [Channel3](https://www.trychannel3.com/) for discovery; each returned offer carries affiliate commission data.
3. The agent assembles an **AP2 Cart Mandate**, submits a PayPal Cart API checkout, and emits a signed **AP2 Payment Mandate** on confirmation.
4. Our edge function verifies the Mandate, registers a Mesh listing (`CosellRegistryV2.register`) with recipients `[merchant, agent, affiliate]` and shares `[70_00, 20_00, 10_00]` basis points, and deposits the PYUSD equivalent of the order amount (`CosellEscrowV2.deposit`).
5. A single `release(depositId)` call fans the proceeds out atomically. Each party sees funds land in the same block.

The share table is fixed at listing time; the entity that triggers release cannot influence who gets what. Dust lands on the last recipient; the escrow retains nothing.

## Substrate

Kajota Mesh ships ten verified contracts on Arbitrum Sepolia (chainId `421614`). The substrate was built for the Arbitrum Open House Singapore hackathon (submitted 04 Oct 2026) and is reused here under its own licence; see [`docs/mesh-substrate`](docs/mesh-substrate/README.md).

| Contract | Address |
|---|---|
| `CosellRegistryV2` | `0x5cda1ae03fd8207cb0c7416ddc899fe89a603ef9` |
| `CosellEscrowV2` (USDC) | `0xce77674ef1f3abcd34370825390f351eb6a8fffd` |
| `CosellEscrowV2` (USDG) | `0xfc82984e0282af934dca6c38d715235d491303c2` |
| `AgentIdentityBinding` | `0x716d9c1229d38ec6f6cd7a5edd781e757a73f629` |
| `X402DepositFacilitator` (USDC) | `0xdbae565ce0be455e859cd8ff42aec8ad30bbbcf9` |
| `X402DepositFacilitator` (USDG) | `0x15f42a9f92ab72ec67fb4298f9a95a476382d0ac` |

A **PYUSD** escrow + facilitator pair is planned for deployment in Phase A against Paxos's canonical Arbitrum Sepolia PYUSD at `0x637A1259C6afd7E3AdF63993cA7E58BB438aB1B1`.

## Local setup

```bash
pnpm install
cp .env.example .env.local
# fill PAYPAL_CLIENT_ID, PAYPAL_CLIENT_SECRET, CHANNEL3_API_KEY, OPENAI_API_KEY
pnpm dev
```

Open http://localhost:3000.

## Documentation

- [`docs/planning/pitch.md`](docs/planning/pitch.md) — the Rule-0 primitive-first pitch
- [`docs/planning/plan.md`](docs/planning/plan.md) — six-week submission plan, hard-parts table, demo storyboard
- [`docs/planning/scout.md`](docs/planning/scout.md) — Devpost field map and sponsor-award pathways
- [`docs/HARD_PARTS.md`](docs/HARD_PARTS.md) — the engineering scars this submission names (Phase B)
- [`docs/AP2_MANDATE.md`](docs/AP2_MANDATE.md) — Payment Mandate decoder (Phase B)
- [`docs/WEBHOOK.md`](docs/WEBHOOK.md) — PayPal order → Mesh deposit flow (Phase B)
- [`docs/DEMO_VIDEO.md`](docs/DEMO_VIDEO.md) — three-minute video beat sheet (Phase D)

## Licence

[MIT](LICENSE) — the licence is visible in the repository root for Devpost submission compliance.

## Credits

Built on the Kajota Mesh substrate (`KaJota-inc/kajota-arbitrum-singapore`), the PayPal Developer Platform, the Agent Payments Protocol, Channel3, Vercel's AI SDK, and viem. Judges and reviewers are welcome to open issues.
