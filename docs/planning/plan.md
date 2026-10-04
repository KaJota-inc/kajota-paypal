# Submission plan — Kajota Mesh for PayPal × AI

_PayPal AI Hackathon · deadline 12 Nov 2026, 12:00 PM PST (3:00 PM EST) · 39 days from drafting._

---

## 1. The deliverable

A single Devpost submission comprising:

- **Primary repository.** `KaJota-inc/kajota-paypal`, public, MIT-licensed, with a visible `LICENSE` file. Contains the PayPal-side orchestration (AP2 Mandate decoder, PayPal webhook listener, Channel3 discovery edge, merchant dashboard, agent-side chat harness). Links the Mesh substrate as a git submodule or dependency.
- **Substrate repository.** `KaJota-inc/kajota-arbitrum-singapore`, cross-linked. HEAD `9f8fb5e` at hackathon start. Any PayPal-driven contract changes (e.g. a PYUSD escrow pair, a Mandate-hash field in the deposit event) ship as additive deployments, not forks of the existing deployment artefacts.
- **Hosted demo.** `kajota-paypal.vercel.app` — connect-wallet landing page, demo-merchant storefront, judge-triggerable checkout, merchant dashboard, Arbiscan links.
- **Demo video.** Under three minutes, YouTube public, no third-party trademarks or copyrighted audio, no sped-up footage. Owner's voice over OBS screen capture.
- **Submission form.** Walked end-to-end by 15 Oct; locked and dress-rehearsed by 10 Nov; filed by 09:00 PST on 12 Nov to leave a three-hour recovery buffer.

A written project description capped at approximately 2,200 characters, written in the register of the Section 3.4 scars rather than marketing — the winning Keeperhub pattern applies ([[feedback_winner_teardown_keeperhub]]).

---

## 2. Team shape

One person — Bori — with Claude as pair. No team coordination overhead; the trade-off is velocity-bound output. Milestones below are sized against roughly four focused hours per day, five days a week, with weekend latitude for the demo-video week.

---

## 3. Milestones

Six weeks, five phases. The playbook ([[hackathon_winning_playbook]]) rule — "upstream PR MERGED by the window's halfway point" — translates here into a *merged* PayPal-side artefact (e.g. a `paypal/agent-toolkit` fork with a `mesh_payout` tool, or a public reference-implementation Gist of the AP2 Mandate decoder) by 26 Oct.

### Phase A — foundation (04 Oct → 11 Oct)

Target: the repo compiles, deploys and sends one PayPal sandbox order end-to-end through a stub fan-out.

- 04 Oct · scout.md, pitch.md, plan.md shipped (this session).
- 05 Oct · scaffold `kajota-paypal`: Next.js + TS, Vercel, pnpm, `.env.example`, MIT licence, README skeleton.
- 05 Oct · PayPal Developer sandbox account provisioned; client_id + client_secret in `.env.local`.
- 06 Oct · "hello checkout" — one hard-coded PayPal order routed to a stub webhook that logs the order payload.
- 06 Oct · AP2 Mandate schema spike: fetch the TypeScript reference implementation, verify a sample Payment Mandate signature.
- 07 Oct · deploy a `CosellEscrowV2(PYUSD)` + `X402DepositFacilitator(PYUSD)` pair on Arbitrum Sepolia against Paxos's `0x637A…B1B1`. Add deployment to `deployments/421614.json` in the substrate repo. Smoke-test with a MockPYUSD fallback if the Paxos faucet refuses.
- 08 Oct · agent-side harness: a Vercel AI SDK demo that calls Channel3 for product discovery, drafts a Cart Mandate and attaches a Payment Mandate.
- 09 Oct · end-to-end stub flow: Channel3 → Cart Mandate → PayPal checkout → webhook → stub Mesh deposit log. No chain tx yet.
- 11 Oct · scout re-check (first live-gallery pass). Snapshot in `scout.md`.

### Phase B — primitive (12 Oct → 25 Oct)

Target: a real on-chain fan-out triggered by a real PayPal checkout.

- 12 Oct · AP2 Payment Mandate decoder: a Vercel edge function that verifies the Mandate's JWT signature, extracts `transaction_id`, and projects the Cart contents to a Mesh `recipients[]` + `shares[]` tuple.
- 13 Oct · PayPal webhook listener: signature verification, idempotency keyed on Mandate `transaction_id`, retry-safe.
- 14 Oct · the relayer: on verified webhook, call `CosellRegistryV2.register(...)` for the Mandate's cart composition, then `CosellEscrowV2.deposit(...)` with the equivalent PYUSD amount from an orchestration wallet (either held, or minted via Paxos faucet in-flight).
- 16 Oct · the first green end-to-end execution — PayPal sandbox order → AP2 Mandate → Mesh listing → on-chain fan-out. Capture tx hashes, pin them in README.
- 18 Oct · merchant dashboard first cut: a Next.js page with AG Grid, columns `OrderId · Mandate hash · listingId · Recipients · Shares · Settlement tx · Status`. One row per sandbox order.
- 20 Oct · release-trigger surface: a merchant action in the dashboard that calls `release(depositId)` and refreshes the row.
- 22 Oct · refund path: PayPal sandbox refund → Mesh `refundToOriginalBuyer` where destination-locked prevents the agent from keeping their share.
- 25 Oct · Phase B closes. The system settles.

**Playbook halfway-point gate (26 Oct):** at least one upstream artefact *merged*. Candidates in descending preference: (a) a PR to `paypal/agent-toolkit` that adds a `request_mesh_payout_quote(cart)` tool; (b) a PR to Paxos's testnet docs adding Arbitrum Sepolia faucet instructions; (c) a merged PR on `google-agentic-commerce/ap2` adding Payment-Mandate-to-on-chain-escrow example documentation; (d) a merged Channel3 example repo integration.

### Phase C — form factor and polish (26 Oct → 03 Nov)

Target: a judge opening the hosted demo and understanding the primitive in sixty seconds.

- 26 Oct · merchant-dashboard design pass. Palette, typography, state empty/loading/error. [[artifact-design]].
- 28 Oct · agent-side chat UI: a shopper prompts in natural language, Channel3 returns offers, PayPal checkout triggers, dashboard updates in real time (SSE).
- 30 Oct · Mandate inspector modal: click a row, see the full Payment Mandate JSON (`vct`, `transaction_id`, Cart, signatures).
- 31 Oct · wallet onboarding: judge connects any Arbitrum-Sepolia-enabled wallet, is funded with the faucet-link flow, can register their own listing.
- 02 Nov · performance pass: lazy-load Arbiscan links, cache registry reads.
- 03 Nov · hard-parts README table landed. Eighteen scars (Section 7). This is the write-up.

### Phase D — demo and submission (04 Nov → 11 Nov)

Target: the three-minute video, the submission form, the public write-up.

- 04 Nov · video shot list (`demo/SHOT_LIST.md`). Opening frame: a cursor hovering over the Cart API docs page with "no splits field here" circled.
- 05 Nov · final scouting pass of the Devpost gallery. Pitch frozen after this.
- 06 Nov · video recording in OBS: screen capture at 2560×1440, 25 Mbps, zero compression on master. Owner's voice; no AI VO.
- 07 Nov · video edit: ffmpeg trims at 1.0× speed only; adelay/amix for VO; PIL overlays for callouts; export to 1080p60 YouTube master. [[feedback_demo_video_production]], [[feedback_realvoice_demo_video]].
- 08 Nov · submission form dress rehearsal. Every field answered. Draft the write-up (2,000–2,200 chars, Keeperhub cadence).
- 10 Nov · submission form second rehearsal. Fine-print re-check (video speed, team-size, licence location). [[feedback_submission_form_rules_first]].
- 11 Nov · the submission is complete except for the final paste.

### Phase E — submission + aftercare (12 Nov → 21 Dec)

- 12 Nov 09:00 PST · submit.
- 12 Nov · a Discord update post ([[feedback_fact_check_public_posts]] — every claim verified against live state).
- 14 Nov · merge upstream PRs' review comments if any arrived during the window.
- 21 Dec · results published. Post-mortem drafted on the day regardless of outcome.

---

## 4. Tech stack

| Layer | Choice | Rationale |
|---|---|---|
| Frontend | Next.js 15 (App Router), TS strict, Tailwind | Standard, Vercel-native, fast to deploy |
| UI tables | AG Grid Community | Sponsor-award eligibility; also the right primitive for a dashboard that lists sales × payees |
| Agent runtime | Vercel AI SDK + OpenAI Agents SDK | PayPal's own Agent Toolkit targets both; the sandbox integration is tested |
| Payment surface | PayPal Cart API v1 + PayPal Agent Toolkit (`@paypal/mcp`) | Mandatory PayPal integration; two surfaces are stronger than one |
| Standards | AP2 Payment Mandate v0.2.0 (TS reference impl) | Signed-Mandate-to-listing snapshot is a load-bearing differentiator |
| Discovery | Channel3 `/v1/search` | Sponsor-award pathway; also brings affiliate attribution natively |
| Chain | Arbitrum Sepolia | Mesh substrate is already there; PYUSD testnet is at `0x637A…B1B1` |
| Token | PYUSD (production narrative) + Paxos USDG (fallback) + MockPYUSD (safety net) | PYUSD is the PayPal headline; others are failovers if the faucet is down |
| Smart contracts | Hardhat 3 + Solidity 0.8.24 + OpenZeppelin 5.1 | Inherited unchanged from `kajota-arbitrum-singapore` |
| On-chain reads | `viem` with `getLogs` | No indexer dependency; demo stays judge-triggerable |
| Hosting | Vercel (web + edge functions) + Render ($1k credit, [[project_kajota_hub]] substrate for the webhook listener) | Sponsor-award pathway |
| Observability | Vercel Analytics + Arbiscan event polling | Enough for a demo; no PagerDuty-grade on-call |

APIMatic is pursued as a lightweight secondary: a published Postman collection and APIMatic reference portal off the Cart API spec, as the sponsor rewards developer-experience work.

---

## 5. Repo scaffolding

```
kajota-paypal/
├── LICENSE                              # MIT, visible at the About section
├── README.md                            # the submission write-up lives here
├── docs/
│   ├── HARD_PARTS.md                    # the 18-scar table (Section 7)
│   ├── AP2_MANDATE.md                   # how we decode the Payment Mandate
│   ├── WEBHOOK.md                       # PayPal order → Mesh deposit flow
│   └── DEMO_VIDEO.md                    # SHOT_LIST + beats + VO script
├── app/                                 # Next.js
│   ├── (merchant)/dashboard/            # AG Grid merchant surface
│   ├── (buyer)/chat/                    # agentic shopper surface
│   ├── api/
│   │   ├── paypal/webhook/              # signature + Mandate verify
│   │   ├── mesh/deposit/                # relayer call
│   │   ├── mesh/release/                # merchant-triggered release
│   │   ├── channel3/search/             # affiliate-attributed discovery
│   │   └── ap2/verify/                  # Mandate signature validator
├── lib/
│   ├── ap2/                             # Mandate decoder (TS ref impl adapted)
│   ├── paypal/                          # SDK wrapper, Cart + Agent Toolkit
│   ├── mesh/                            # viem clients, ABI, address book
│   └── channel3/                        # thin typed client
├── scripts/
│   ├── seed-sandbox.ts                  # sandbox merchant + products + agent
│   ├── reproduce-paypal-mesh-flow.sh    # end-to-end reproducer (judge-usable)
│   └── deploy-pyusd-pair.ts             # add PYUSD escrow + x402 pair
└── test/
    ├── ap2.test.ts                      # Mandate verify
    ├── webhook.test.ts                  # signature, idempotency, replay
    └── e2e.test.ts                      # paypal sandbox → mesh deposit → release
```

Target line count at submission: under five thousand lines of TypeScript, under one thousand of new Solidity. Compact beats sprawling; the substrate carries the weight.

---

## 6. End-to-end demo path (storyboard)

A single judge-triggerable path. Written as a sequence of camera cuts for the video; each cut must survive a reproducible script.

1. **Open on the gap.** PayPal Agent Toolkit docs. Caret hovering on the tool list. On-screen caption: *forty-two tools. zero of them pay the agent.*
2. **Enter the agent.** The buyer chat opens. "Find me a leather bag under $120 that pays its reviewer." The agent, running on Vercel AI SDK + OpenAI Agents SDK, calls Channel3. Three offers return. Each one has an affiliate commission structure. The agent picks one.
3. **The Mandate.** The agent emits an AP2 Payment Mandate. The viewer sees the JSON blob float up: `vct: "mandate.payment"`, `transaction_id: "aGVsbG8…"`, `cart.payees: [merchant, agent, affiliate]`.
4. **PayPal checkout.** The agent calls `POST /merchant-cart/{id}/checkout`. The sandbox order confirms.
5. **Webhook landing.** On the right of the screen, the merchant dashboard refreshes. A new row: `OrderId · Mandate hash · listingId · Recipients(3) · Shares(70/20/10) · Pending`.
6. **The relayer.** Behind the scenes, the webhook listener verifies the signature, decodes the Mandate, registers the listing, and deposits PYUSD. Four Arbiscan links light up progressively in the row — register, approve, deposit, release.
7. **Settled.** The row flips to `Settled`. The merchant sees $84 PYUSD arrive; the agent sees $24; the affiliate sees $12. No off-platform spreadsheet. No T+30 reconciliation.
8. **Click into the row.** A modal shows the full Mandate JSON, the Mesh listing hash, the Arbiscan tx. Nothing is hidden.
9. **Close on the headline.** _The 43rd tool for the PayPal Agent Toolkit._

The video script runs ~130 seconds at a comfortable 2.1 words per second over 275 words. Buffer: thirty seconds for titling, five for the licence card at the end.

---

## 7. Hard-parts README table (preview — 18 scars)

Carried forward from the Mesh substrate (eleven) and anticipated on the PayPal seam (seven). The published `HARD_PARTS.md` turns each row into a paragraph.

| # | Scar | Carried from / new |
|---|---|---|
| 1 | Deactivate-only registry — listings cannot be edited after `register()` | Mesh |
| 2 | Sum-to-10000-bps invariant — enforced in `register` and re-asserted in `computeSplit` | Mesh |
| 3 | Zero-argument release — the trigger cannot influence who gets what | Mesh |
| 4 | Zero-dust rounding — last recipient absorbs the floor remainder | Mesh |
| 5 | EIP-3009 replay prevention via the token's own nonce map | Mesh |
| 6 | Fee-on-transfer guard — `PostRelayAssertionFailed` reverts the entire deposit | Mesh |
| 7 | Destination-locked refund — `_originalBuyerOf` recorded on relay, enforced on refund | Mesh |
| 8 | Token-agnostic constructor — same bytecode across USDC, USDG, PYUSD | Mesh |
| 9 | Mainnet-chainId guardrail — explicit set, catches the 46630-vs-4663 off-by-10× | Mesh |
| 10 | ERC-8004 metadata-not-proof hop — binding is attestation, not verification | Mesh |
| 11 | MockUSDC byte-identical EIP-3009 domain for smoke tests | Mesh |
| 12 | PayPal order ID → Mesh `listingId` idempotency keyed on AP2 `transaction_id` | PayPal seam |
| 13 | AP2 Payment Mandate signature verification before any on-chain write | PayPal seam |
| 14 | AP2 `agent_id` ↔ ERC-8004 `agentCardHash` binding at Mandate decode | PayPal seam |
| 15 | PYUSD approval reset quirk — same `forceApprove` dance as Circle USDC | PayPal seam |
| 16 | Refund flow — PayPal refund triggers `refundToOriginalBuyer`; the agent cannot keep its share | PayPal seam |
| 17 | Sandbox-vs-production chainId guardrail — PayPal sandbox binds strictly to Arb Sepolia | PayPal seam |
| 18 | Webhook replay guard — Mandate `transaction_id` is a durable idempotency key across retries | PayPal seam |

---

## 8. Submission-form checklist (to walk by 15 Oct)

- [ ] Project name entered
- [ ] Elevator pitch (280 chars)
- [ ] Full description (~2,000–2,200 chars, Keeperhub cadence)
- [ ] "What it does" — one paragraph
- [ ] "How we built it" — one paragraph
- [ ] "Challenges we ran into" — one paragraph (the hard-parts table abbreviated)
- [ ] "What we learned" — one paragraph (optional)
- [ ] "What's next" — one paragraph (optional)
- [ ] Built-with tags (PayPal, PYUSD, AP2, Vercel AI SDK, Arbitrum, Channel3, AG Grid)
- [ ] Try-it-out link (`kajota-paypal.vercel.app`)
- [ ] Repository link (`github.com/KaJota-inc/kajota-paypal`)
- [ ] Video link (YouTube public)
- [ ] Image / cover art (1200×675)
- [ ] Testing credentials for judges (sandbox PayPal client_id, sandbox agent key)
- [ ] Prize category opt-ins (Agentic Commerce, PayPal + AI, Most Impactful, Channel3, AG Grid, APIMatic, Render — only the ones we actually integrated)

---

## 9. Risks and mitigations

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| PayPal sandbox Mandate feature not actually enabled on dev accounts | Medium | Blocks the demo | Verify by 05 Oct; if blocked, build a stub Mandate signer and label clearly in the video |
| PYUSD Arbitrum Sepolia faucet refuses | Medium | Blocks on-chain tx | Mint MockPYUSD with byte-identical EIP-3009 domain; dual-track from day one |
| AP2 Payment Mandate spec changes mid-window | Low | Could invalidate the decoder | Pin to v0.2.0; capture the schema file in-repo at scaffold |
| Submission-form fine print bans sped-up video or external links | Low | Could cost the video pass | Walk the form by 15 Oct; constrain the edit at 1.0× from the first cut |
| Mesh substrate security issue discovered mid-window | Low | Reputational and submission risk | Treat as blocker; patch upstream before PayPal seam ships |
| Scope creep into Bryntum / Postman / Elastic / Astropods / KERNEL / Zapier | Medium | Dilutes the primitive-first pitch | Hard rule: no sponsor integration beyond Channel3, AG Grid, APIMatic, Render |
| Owner's single-threaded availability during church-media and gold-fleet overlaps | Medium | Milestones slip | Reserve 04–11 Nov as blackout for Phase D; shift lower-priority tasks |

---

## 10. Session hand-off

What landed this session: `scout.md`, `pitch.md`, `plan.md` under `~/Documents/kajota-paypal/`.

What the next session picks up: Phase A, days 05–08 Oct. First task — scaffold the `KaJota-inc/kajota-paypal` GitHub repo and the Next.js app; confirm PayPal sandbox credentials; verify the AP2 TypeScript reference implementation; attempt the Paxos PYUSD Arbitrum Sepolia faucet.

What remains open and must be resolved before Phase B: whether the PayPal sandbox Agent Toolkit path actually emits an AP2 Payment Mandate (or whether we stub-sign one). Walk `developer.paypal.com/docsai/limited-release/agentic-commerce/quickstart` with real credentials and either confirm or document the stub.
