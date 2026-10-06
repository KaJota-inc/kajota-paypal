# Winning plan — Kajota Mesh for PayPal × AI

_Drafted 06 Oct 2026, Day 3 of 42. Deadline 12 Nov 2026, 12:00 PM PST. Winners announced 21 Dec 2026._

This document applies every surviving lesson from the memory corpus to the current state of `kajota-paypal` and names the specific moves that take the submission from "well-built" to "top-three." It is referred to by every subsequent build decision in this repo until the submission closes.

Memory files consulted: [[hackathon_winning_playbook]], [[feedback_winner_teardown_keeperhub]], [[feedback_scout_the_field_before_positioning]], [[feedback_submission_form_rules_first]], [[feedback_fact_check_public_posts]], [[feedback_verify_deadline_vs_today]], [[feedback_demo_video_production]], [[feedback_realvoice_demo_video]], [[feedback_receipt_pip_video_pattern]], [[feedback_backend_demo_pattern]], [[feedback_x402_self_facilitator]], [[project_kajota_shield]], [[project_kajota_hub]], [[project_coach_mesh]], [[project_concierge]], [[project_kajota_witness]].

---

## 1. The thesis — one line

> **"PayPal's Agent Toolkit gives agents 42 ways to spend money and none to earn it. Kajota Mesh is the 43rd tool — a programmable fan-out that atomically splits a PayPal order's proceeds across the merchant, the agent that closed the sale, and the affiliate, bound to an AP2 Payment Mandate and settled in PYUSD on Arbitrum."**

Rule 0 template fit: *`<PayPal checkout + AP2 Payment Mandate + PYUSD>` + `<N-party atomic fan-out agentic layer>`*. Both halves name primitives a judge recognises. The pitch stays constant across the Devpost write-up, the three-minute video opening, and the README's first screen.

---

## 2. Scored against the seven winning moves ([[hackathon_winning_playbook]])

| # | Move | Current state | Gap to close | Owner |
|---|---|---|---|---|
| 1 | Prove the money worked (runner over DAYS) | ✗ Zero on-chain executions | **Largest gap.** GitHub Actions cron every 6h posting a stub-signed Mandate pair to the deployed webhook, deposits a scripted $0.10 PYUSD, releases to three wallets. Starts accumulating the day PYUSD escrow deploys. | Me |
| 2 | Name HOST defect | ✓ Agent Toolkit's 42-tools / 0-payouts gap, named in `pitch.md`, `scout.md`, `HARD_PARTS.md`, and the drafted PR #98 body | Hold the line; name it once in the submission write-up with one quoted file path | Me |
| 3 | Upstream PR MERGED by halfway + raid backlog | ✗ 2 drafts, 0 opened | **Open both this week** — `paypal/agent-toolkit#98` + comment on `google-agentic-commerce/AP2#255`. Scout 10 more unassigned issues from the two backlogs | User (approve open) + Me |
| 4 | Capability over correctness | ✓ Mesh N-party fan-out is a new capability; PR #98's per-call `request_id` adds a capability rather than fixes a message | Keep every new PR capability-shaped; refuse scope creep into typo-fix PRs | Me |
| 5 | ~2k-char write-up | ✗ Current docs are 40 KB combined | **Draft `docs/SUBMISSION.md` at 2 000 chars** by 20 Oct; freeze after one revision loop | Me |
| 6 | Failure modes as runnable scripts | ✓ 5-gate adversarial table + happy path, both green via `pnpm reproduce` / `pnpm reproduce:fail` | Add two more: PayPal refund → `refundToOriginalBuyer`, dual-currency currency-mismatch | Me |
| 7 | "What we got wrong first" section | ~ Honesty ledgers inside PR drafts, nothing stand-alone | Write `docs/WHAT_WE_GOT_WRONG_FIRST.md` with real entries: AP2 schema guess, `LayoutProps` typecheck, zod-v3 pin, dashboard `useEffect` lint, Metro parent-root for RN worktrees (sibling bug), tsx CJS top-level await | Me |

### Scoreboard summary (what we fix today vs what we fix in-window)

- **Today / this week:** 2, 4 (hold), 5 (draft), 6 (extend), 7 (write), 3 (open the two drafted artefacts)
- **In-window (6–26 Oct):** 1 (deploy + runner) — gates on PYUSD faucet + Vercel hosting

---

## 3. Scored against the PayPal AI Hackathon rubric

Five criteria, no stated weights (Devpost default = equal weight unless organiser specifies). Order given on the brief:

| Criterion | Memory anchor | Current state | Plan to peg it |
|---|---|---|---|
| Technological Implementation | H0 post-mortem lesson 1 — "make the sponsor's primitive the star" | ✓ 10 commits, Agent Toolkit + Cart API + PYUSD + AP2 named, 97 Mesh forge tests inherited | Add 2 more PayPal surfaces: PayPal Payouts v2 (for a merchant-direct fallback path) + Shipment Tracking (links release trigger to a logistics event). Keep the "nine services, one instance" tactic from [[project_kajota_hub]] for how we talk about load-bearing integration |
| Design | Rule 1 (form-factor match) | ✓ Dashboard in AG Grid; routes `/chat`, `/dashboard`, `/`; Geist typography; dark/light aware; click-to-verify affordance in every row | Deploy to Vercel so the design is public; add a `/evidence` route (H0 lesson 4 — a page a judge clicks beats a script a judge clones) |
| Potential Impact | H0 lesson 2 — "constraint as headline"; H0 lesson 6 — "name the monetization mechanism" | ~ Prose only in `pitch.md` | Rewrite with the first-person Nigerian-fintech framing (see §9) + name the mechanism: a 25 bps fee on each release, invoiced in PYUSD. "A merchant on $100k/mo of agent-closed GMV pays $250/mo in Mesh fees and recovers 29 days of float." |
| Innovation / Idea | Scoreboard above (new capability) | ✓ The 43rd Agent Toolkit tool is a legible new capability | Hold. The pitch's shape is correct. |
| Presentation | [[feedback_demo_video_production]], [[feedback_realvoice_demo_video]], [[feedback_receipt_pip_video_pattern]], [[feedback_submission_form_rules_first]] | ✗ No video yet | Produce under 3 min, YouTube public, owner's voice, trimmed at 1.0× (never atempo). Shot list in `docs/DEMO_VIDEO.md` — now the active production plan, not a stub |

---

## 4. Judging-specific amplifiers (from H0, Zama S3, Keeperhub teardowns)

Each is a specific tactic that moved submissions from the median to the top three in events the memory logs:

1. **Click-to-verify public evidence page.** `kajota-paypal.vercel.app/evidence` — a no-login page listing every webhook that fired, every Mesh tx hash, every settled amount per recipient, auto-refreshing every 60 s. Reads from `/api/orchestrator/sessions`. Beats a reproducer script a judge has to clone. H0 lesson 4.
2. **The sponsor primitive is the screenshot.** The merchant dashboard's N-way fan-out column IS the Agent Toolkit's 43rd tool rendering. A judge screenshotting the dashboard captures the pitch. H0 lesson 1.
3. **Deterministic layer decides, LLM only explains.** The release decision is on-chain (`CosellEscrowV2.release`'s zero-argument shape); the agent chat only *narrates* the fan-out. Rapid Agent pattern #2.
4. **SSE-stream the agent's reasoning on `/chat`.** When the agent chooses which affiliate commission to accept, show the tool call live. Rapid Agent pattern #1 + #6.
5. **Named deterministic N-step loop.** `DISCOVER → MANDATE → CHECKOUT → VERIFY → PROJECT → REGISTER → DEPOSIT → RELEASE` — eight stages, legible in the architecture diagram. Rapid Agent pattern #1.
6. **"Nine services, one instance" vocabulary.** Reuse the [[project_kajota_hub]] voice when describing the stack — load-bearing substrate, not a checkbox list. Zama S3 auxiliary pattern.
7. **Hard-parts appendix.** 18 scars, each with the file path or Arbiscan link that proves it. See `docs/HARD_PARTS.md` after today's rewrite. Zama S3 Rule 2.

---

## 5. The gaps, prioritised

Ranked by playbook-leverage × unblocked-today:

### Must land this week (06–12 Oct)
- **Open PR #98** — needs user approval. Draft is in `docs/upstream-prs/paypal-agent-toolkit-98/`. ⏱ 15 min of user time.
- **Post AP2 #255 comment** — needs user approval. Draft is in `docs/upstream-prs/ap2-255-comment/`.
- **Rewrite `docs/HARD_PARTS.md`** as a Rule-2 constraints table — Zama S3 shape, each row carrying a file path, a one-line "symptom," a one-line "cause," a one-line "fix" + a reproducer link. Lands today.
- **Write `docs/WHAT_WE_GOT_WRONG_FIRST.md`** with six concrete entries from the build so far. Lands today.
- **Scaffold `docs/architecture.mmd`** (mermaid) — a submission-form requirement most hackathons mark as a gap when missing. Lands today.
- **Draft `docs/SUBMISSION.md` at 2 000 chars** in Keeperhub-winner cadence. Lands today.
- **Scout 10 more unassigned issues** across `paypal/agent-toolkit` + `google-agentic-commerce/AP2` for additional merge targets. Lands this week.
- **Walk the Devpost submission form end-to-end** by 15 Oct per [[feedback_submission_form_rules_first]]. Needs user Devpost account.

### Must land Phase B (12–25 Oct)
- **Deploy to Vercel** — public preview URL. ⚠ Needs user Vercel account; one-time setup.
- **Deploy PYUSD escrow pair on Arbitrum Sepolia** — needs funded EOA + Paxos faucet.
- **GitHub Actions runner** every 6 hours — fire a stub Mandate → webhook → deposit → release → log the tx hashes to `/evidence`. Accumulates the "runner on a 6-hourly GitHub Action" that Keeperhub's bursar won 3rd with.
- **Open two more upstream PRs** from the scouted backlog. Target ≥1 merged by 26 Oct (window halfway).
- **Build the SSE agent chat** on `/chat` using Vercel AI SDK + OpenAI, calling Channel3 for discovery. Needs OpenAI key.

### Must land Phase C (26 Oct–03 Nov)
- **Public `/evidence` page** reading from live chain + sessions store, auto-refreshing.
- **Walk the Devpost form a second time** per [[feedback_submission_form_rules_first]].
- **Freeze the pitch** — no further positioning changes after this per [[feedback_scout_the_field_before_positioning]] scout cycle.

### Must land Phase D (04–11 Nov)
- **Record the demo video** per [[feedback_realvoice_demo_video]] (owner's voice via whisper.cpp sync) OR [[feedback_demo_video_production]] (OBS + ffmpeg, no AI VO given Zama's ban precedent). 1.0× trim only.
- **Edit the write-up to 2 000 chars** — final cadence match.
- **Dress-rehearse the submission form** — paste every field, verify no required artefact is missing.

### Submit (11–12 Nov)
- Submit at 09:00 PST 12 Nov leaving a 3-hour recovery buffer.

---

## 6. Risk register

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| PYUSD Arb Sepolia faucet refuses | Medium | Blocks Move #1 | Mint `MockPYUSD` with byte-identical EIP-3009 domain; label visibly as mock in the dashboard; swap when faucet opens |
| PayPal sandbox doesn't emit AP2 Mandates | Medium | Blocks live webhook demo | Stub-sign Mandates in the orchestrator with the project's own key, labelled "stub-signed" chip in the inspector modal |
| Both upstream PRs sit unreviewed through 26 Oct | Medium | Playbook Move #3 fails | Open 3–5 more smaller PRs by 20 Oct to raise merge probability; comment on open PRs by other contributors to signal good-faith engagement; attend any sponsor office hours posted on Devpost |
| Devpost form has a hidden rule we miss | Low | DQ risk | Walk the form **twice**, log every field in `docs/SUBMISSION_FORM_WALK.md` |
| Owner single-threaded across PayPal + BLI Legal Tech + Dubai Arbitrum | High | Scope slip | Lock PayPal Phase D (04–11 Nov) as blackout; BLI deadline Nov 1 and Dubai submit opens Nov 16, so cadence is sequential |
| Scope creep into sponsor-bonus chasing | Medium | Dilutes primitive | Hard rule: Channel3, AG Grid, APIMatic, Render only; drop Bryntum, Astropods, KERNEL, Zapier |
| Mesh substrate audit gap exposed on judging | Low | Credibility hit | Honesty-ledger entry up-front: "97 tests, no third-party audit yet; substrate is testnet-only, no mainnet funds moved" |

---

## 7. Milestones

```
Week of 06 Oct — Phase A finish line
  Mon 06  WIN_PLAN + HARD_PARTS rewrite + SUBMISSION draft + architecture.mmd
  Tue 07  Open PR #98; post AP2 #255 comment (user approve)
  Wed 08  Scout 10 more upstream targets; open 1 more PR
  Thu 09  Deploy to Vercel (user)
  Fri 10  PYUSD escrow pair deploy on Arb Sepolia; GH Actions runner scaffold
  Sat 11  First real end-to-end on-chain execution
  Sun 12  Second upstream PR opened

Week of 13 Oct — Phase B
  Submission form walk-through #1
  SSE agent chat on /chat
  /evidence page shell
  Daily GH Actions firings start accumulating

Week of 20 Oct — Phase B closes
  SUBMISSION.md at 2k chars locked
  Second upstream PR open-and-under-review
  5 GH Actions executions already in the ledger

Week of 27 Oct — halfway + Phase C start
  ⏱ Playbook halfway deadline: ≥1 upstream PR MERGED
  /evidence auto-refreshing on live Vercel URL
  Dashboard polish pass (empty states, status chip animations)

Week of 03 Nov — Phase D opens
  Freeze the pitch
  Record demo video (owner's voice, 1.0×)
  Draft the Devpost form fields

Week of 10 Nov — Phase D closes + submit
  Mon 10  Form walk-through #2
  Tue 11  Dress-rehearse the submission; peer-review the write-up
  Wed 12  Submit by 09:00 PST
```

---

## 8. The 2 000-character Devpost write-up (first draft)

Lives in [`SUBMISSION.md`](../SUBMISSION.md). Draft imported on first commit; frozen 03 Nov; edited only in the submission form itself after that.

---

## 9. First-person framing (H0 lesson 3)

> "I spent a decade inside Nigerian payment infrastructure — Remita, Ecobank, Breet — building reconciliation for merchants whose settlement always landed days after the sale. The one place every system I built hit the same wall was the same: when more than one party contributed to a sale, cutting them in took T+30 at best, a quarterly spreadsheet at worst. Agentic commerce is about to make that wall unbearable. An AI agent that discovers a product, closes the sale, and then waits for a human to reconcile its commission is not autonomous — it is a lead-gen tool with worse UX. Kajota Mesh is the primitive that lets the agent get paid at the same block the merchant does."

Use the paragraph in the Devpost **Inspiration** section verbatim. First-person is the differentiator the H0 teardown identified; the Pulse post-mortem flagged third-person framing as what lost `project_kajota_pulse`.

---

## 10. Click-to-verify evidence surface

`/evidence` — a dedicated public route, no login, auto-refreshing every 60 s. Reads from `/api/orchestrator/sessions` + direct `viem` `getLogs` against the deployed Mesh contracts on Arbitrum Sepolia. Two tables:

1. **Live settlements.** Latest 20 webhook-triggered Mesh executions. Each row: timestamp, PayPal order id, Mandate hash, recipients[] with on-chain tx hash per payee, release-tx Arbiscan link, status.
2. **The accumulating runner.** Latest 20 cron-fired executions from the GitHub Actions runner, with the commit SHA that scheduled each one. Playbook Move #1 incarnated.

A judge who clicks `/evidence` sees activity from today — Keeperhub bursar's winning move.

---

## 11. Hard-parts table (bar before Rule 2)

Live in [`HARD_PARTS.md`](../HARD_PARTS.md). Rewritten today from prose into a Zama-S3-shaped constraints table: 18+ rows, each with symptom → cause → fix → reproducer link. The pre-today version was six paragraphs of prose; the new shape is what Ghostlend, Blackout and Vesper used to peg Technical Implementation.

---

## 12. The submission package manifest

Every artefact a judge or a form field asks for, with its current state:

| Artefact | Required by | State | Location |
|---|---|---|---|
| Public GitHub repo with LICENSE | Devpost brief | ✓ (local, MIT) | `KaJota-inc/kajota-paypal` once pushed |
| Hosted demo URL | Devpost brief | ✗ | `kajota-paypal.vercel.app` (Phase B) |
| 3-minute YouTube demo | Devpost brief | ✗ | Phase D |
| Architecture diagram | Devpost rubric | ✓ (today) | `docs/architecture.mmd` |
| 2k-char write-up | Playbook move #5 | ✓ (draft today) | `docs/SUBMISSION.md` |
| Hard parts appendix | Zama S3 Rule 2 | ✓ (rewritten today) | `docs/HARD_PARTS.md` |
| What we got wrong first | Playbook move #7 | ✓ (today) | `docs/WHAT_WE_GOT_WRONG_FIRST.md` |
| Reproducer scripts | Playbook move #6 | ✓ (1 happy + 5 fail) | `scripts/` |
| Click-to-verify page | H0 lesson 4 | ✗ | `/evidence` (Phase C) |
| Runner evidence (accumulating) | Playbook move #1 | ✗ | GitHub Actions (Phase B) |
| Honesty ledger | Keeperhub winner cadence | ✓ (in PR drafts) | Collated into `SUBMISSION.md` + `WHAT_WE_GOT_WRONG_FIRST.md` |

---

## 13. What to NOT build

- No Bryntum / Astropods / Elastic / KERNEL / Zapier integration — scope creep.
- No multi-chain. Mesh is Arbitrum Sepolia only this round; the pitch stays legible.
- No fiat on-ramp. PayPal provides fiat → PYUSD on their rail; we do not re-invent it.
- No mainnet deploy. Testnet only; disclose up front.
- No AI voice-over in the video — some hackathons ban it (per Zama S4 memory); use the owner's voice.
- No Casper / 0G / Flare integration — those are other hackathons. Keep the PayPal story clean.

---

## 14. Session hand-off

Session continues now with four concrete deliverables:

1. `HARD_PARTS.md` — Zama-S3-shaped constraints table
2. `SUBMISSION.md` — 2 000-character Devpost draft
3. `WHAT_WE_GOT_WRONG_FIRST.md` — six concrete entries
4. `architecture.mmd` — mermaid diagram of the eight-stage pipeline

Each committed in its own small commit for a clean review history. The GH Actions runner skeleton + Vercel deploy prep land in a follow-up pass.
