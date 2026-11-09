# Competitor scan — T-72h lock

**Date:** 2026-11-09. **Lock status:** ✅ LOCKED. **Deadline:** 2026-11-12 20:00 UTC (12:00 PM PST — canonical, verified against `paypalaihackathon.devpost.com/rules`). **Submission window closes in ~79h.**

BLI-born gate #8 per [[project_bli_legal_tech_2]] post-mortem. Scans (a) upstream PR landscape for the N-party fan-out lane, (b) PayPal AI Hackathon Devpost submission gallery.

---

## 1. Devpost submission gallery — NOT YET PUBLISHED

Navigated to `https://paypalaihackathon.devpost.com/project-gallery` on 2026-11-09.

**Page contents:** *"The hackathon managers haven't published this gallery yet, but hang tight!"*

**What this means:** we cannot scout the field of entries pre-submission. Devpost holds the gallery private until the hackathon manager flips a visibility switch, usually after the submission period closes. Nothing to compare our pitch against; the "empty-gallery → thin field" branch from `docs/COMPETITOR_SCAN.md` §4 applies — we **hold the original frame** (43rd tool, N-party fan-out, AP2-bound, PYUSD-on-Arbitrum).

This is itself a data point: competitors cannot scout us either. The BLI-era "Verdict Desk surprise" failure mode cannot recur on this venue — gallery is blind.

## 2. Upstream `paypal/agent-toolkit` scan — NEAR-MISS DETECTED

Scanned open PRs on `paypal/agent-toolkit` for N-party fan-out, Payouts, or splits. Twenty-five open PRs reviewed.

### Near-miss — Branch A (worse execution than us)

- **`paypal/agent-toolkit#107`** by @rushabhT3 — *"Add Payouts tools (Python and TypeScript)"* — opened 2026-10-04, un-updated. Scope: wrapping `/v1/payments/payouts` as a tool. PayPal Payouts v2 is a **fire-and-forget batch disbursement** API — recipient list, item amounts, no atomic settlement, no mandate binding, no on-chain record. Mesh's differentiator: **atomic N-party release in one block, bound to the AP2 Payment Mandate pair, with HARD_PARTS scar #3 (zero-argument release — the trigger cannot change the share table)**.

   Delta the judges will see in 30 seconds: Payouts says *"here are 50 recipients, please pay them"*. Mesh says *"here is one PayPal order's proceeds — distribute atomically across its agent + affiliate + merchant in one transaction, with the share table frozen at cart signing, no trigger can change it after."*

   **Action: hold the 43rd-tool framing.** @rushabhT3's PR is on the same lane but at a different depth — Payouts is table-stakes batch; Mesh is agentic settlement.

### Dupe-of-our-drafts (not competitors — upstream contributors ahead of us)

- **`paypal/agent-toolkit#108`** @PRIEST099 — fixes issue #98 (our #98 draft retired, see `UPSTREAM_PR_paypal_agent_toolkit.md`).
- **`paypal/agent-toolkit#124`** @NovaCorpAI — Python half of #98 (also retires our draft).
- **`paypal/agent-toolkit#99`** @GANESH-NADKARNI — fixes issue #43 (our #43 draft retired).

## 3. Upstream `google-agentic-commerce/AP2` scan — DUPES ONLY

Scanned open PRs. 20 open as of 2026-11-09.

### Dupes-of-our-drafts (not competitors)

- **`AP2#385`** @aksharprabhudesai — direct dupe of our `#372` fix (`mode="json"` on `model_dump`)
- **`AP2#383`** @aeoess — same as #385, named after `"use"` field failure
- **`AP2#355`** @harkanwalbedi — broader generalisation of same fix
- **`AP2#384`** @aksharprabhudesai — direct dupe of our `#367` fix (callback guard)

### Not near-misses, but adjacent (noted for context)

- **`AP2#363`** @deepanshupal — multi-hop delegation in `MandateClient.present()` — adjacent but different primitive
- **`AP2#359`** @arjun2075 — checkout mandate binding verification — adjacent but buyer-side only
- **`AP2#391`** @aksharprabhudesai — reject negative payment amounts — adjacent sanity check

Nothing in the AP2 open-PR list touches **N-party fan-out of a single Payment Mandate's `payment_details_total` across multiple payees**. Our thesis's open space remains clean.

## 4. GitHub forks scan — not a signal

`gh search` for forks of `paypal/agent-toolkit` created in October 2026 would be the scouting move for stealth submissions, but it returns too much noise (forks are routinely created for issue exploration, not submissions). Skipping per cost-benefit; the Devpost gallery is the authoritative source and it is private until submissions close.

## 5. Verdict

**Branch A per `docs/COMPETITOR_SCAN.md`** — one near-miss identified (`#107` Payouts tools), execution worse, Mesh differentiator intact. **Keep the "43rd tool" framing in the hero.**

- Hero shot (video 0:00–0:10): *"The PayPal Agent Toolkit gives agents 42 tools. Zero of them pay an agent."*
- Delta shot (video 2:10–2:30): `pnpm reproduce:fail` running the 7-gate adversarial table with a hash per branch — none of the upstream open-PR contributors have this surface.

Scan locked 2026-11-09 by assistant + pending user review before Nov 10 20:00 UTC recording cut. Lock timestamp passes without further re-scouting unless the Devpost gallery flips public before Nov 12 20:00 UTC — in which case the owner runs `curl -s https://paypalaihackathon.devpost.com/project-gallery | grep -iE 'paypal|agent|fan-out|n-party'` once and re-decides Branch A/B/C.

Related: [[project_bli_legal_tech_2]], [[feedback_scout_the_field_before_positioning]], [[hackathon_winning_playbook]].
