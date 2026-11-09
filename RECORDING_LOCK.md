# Recording lock — T-48h go/no-go

**Date:** 2026-11-09 (today). **Lock timestamp:** 2026-11-10 23:59 UTC (tomorrow). **Submission deadline:** 2026-11-12 20:00 UTC (12:00 PM PST — canonical). **From the lock, build hours end.**

BLI-born gate #9 per [[project_bli_legal_tech_2]] post-mortem. Supersedes `docs/RECORDING_LOCK.md` as the authoritative lock surface.

---

## Current go/no-go state

| Item | State | Note |
|---|---|---|
| Canonical video | ⏳ not yet cut | Primary record window: 2026-11-10 20:00–23:00 WAT (19:00–22:00 UTC). Backup: 2026-11-11 same slot. |
| X post wording | ⏳ draft only | See §4 below. Post concurrent with Devpost submit, not before. |
| SUBMISSION writeup | ✅ 2,198 chars body (target 1,900–2,100 ± 100) | `docs/SUBMISSION.md` — comparable to Keeperhub 2,330-char winner. |
| Devpost form rules verified | ✅ `SUBMISSION_FORM_RULES.md` landed | ≤3 min, YouTube public, no third-party trademarks or music. No speed/atempo rule stated — default 1.0× per [[feedback_submission_form_rules_first]]. |
| Repo public with LICENSE at top | ✅ `KaJota-inc/kajota-paypal` MIT visible in About | Verified via `gh api`. |
| Hosted demo URL live | ✅ `kajota-paypal.vercel.app` | 6 surfaces return HTTP 200. |
| PYUSD escrow deployed | ❌ not yet | Blocks the on-chain tail of the video. Fallback: demo with MockPYUSD or stop at the off-chain stages. |
| GH Actions 6-hour runner firing | ❌ not yet | Blocks "evidence of earnings not transactions" (playbook move #1). Fallback: seed `/evidence` with hand-fired demo rows before cutting the video. |
| Upstream PR count | 1/5 — AP2 #255 ecosystem comment posted ([comment-6598336168](https://github.com/google-agentic-commerce/AP2/issues/255#issuecomment-6598336168)) | Four drafted PRs RETIRED as dupes (see `UPSTREAM_PR_*.md`). Honest ledger ships as "1 ecosystem comment filed; 4 would-have-been PRs confirmed dupe by upstream contributors and retired". |

## Lock preconditions (must flip to ✅ before cutting the video)

1. **Env vars added to Vercel** so the `/api/paypal/webhook` and `/api/ap2/verify` routes don't throw at request time when the video's live demo hits them. Checklist: `VERCEL_ENV_CHECKLIST.md`.
2. **At least one real settlement row on `/evidence`** so the surface is not empty. Options:
   - Deploy the PYUSD escrow pair + fire one real on-chain release before recording (ideal)
   - Seed one scripted release with MockPYUSD + label the chip as `"demo"` in the dashboard (acceptable fallback per `docs/HARD_PARTS.md` scar #17 — sandbox/production chain-id guardrail)
3. **Three distinct hustler addresses** staged — [[feedback_hustle_engine_leverage]] §Oct-24-patch: "the levers collapse if the same wallet plays multiple roles. Allocate ≥3 distinct hustler addresses (not burners) in the first on-chain cycle". Three addresses from the deploy keystore, each labeled with a plausible identity (merchant / agent / affiliate).

If any precondition is still ❌ at 2026-11-10 20:00 UTC, the backup window (Nov 11 same slot) is used. If still ❌ at 2026-11-11 20:00 UTC, the video is cut around the stages that work — the honest ledger in the writeup carries the gap. Submission goes in regardless. BLI's lesson: filed-and-ranked > unfilled-and-perfect.

## 3. Recording-day minute-by-minute (2026-11-10)

Primary slot: 20:00–23:00 WAT (19:00–22:00 UTC). See `docs/RECORDING_LOCK.md` §5 for the earlier draft. Keep the 6-beat shot list unchanged — the pitch frame is locked.

- **Hook (0:00–0:10)**: *"The PayPal Agent Toolkit gives agents 42 tools. Zero of them pay an agent."* Scroll the official Agent Toolkit tool list on screen.
- **Problem (0:10–0:35)**: Nigerian fintech framing; T+30 reconciliation pain.
- **Pipeline (0:35–1:10)**: Architecture diagram → zoom to `release(bytes32)` on Arbiscan.
- **Live demo (1:10–2:10)**: `/chat` → `/dashboard` → Arbiscan → `/leaderboard` with real PYUSD totals.
- **Hard parts receipt (2:10–2:30)**: `pnpm reproduce:fail` running — 7/7 gates fire.
- **Callback (2:30–2:55)**: Zoom back to Agent Toolkit docs with "Tool #43: Mesh" tacked on.

**Hard rules on the cut:**
- 1.0× speed only (no atempo, no `-filter:a atempo=1.1`) per [[feedback_submission_form_rules_first]]
- Owner's voice only — no AI VO (Zama S4 ban precedent)
- No third-party trademarks or copyrighted music (Devpost rule)
- YouTube public, "Not for kids"

## 4. X post wording (DRAFT — post concurrent with Devpost submit on Nov 12)

```
The PayPal Agent Toolkit gives agents 42 tools. Zero of them pay an agent.

Kajota Mesh is the 43rd — an N-party atomic payout rail bound to the AP2 Payment Mandate pair, settled in PYUSD on Arbitrum Sepolia.

Submission: paypalaihackathon.devpost.com/software/[slug]
Live demo: kajota-paypal.vercel.app
Code: github.com/KaJota-inc/kajota-paypal
Hard parts: 21 scars at /docs/HARD_PARTS.md

7-gate adversarial table + atomic release + Nigerian-fintech framing. Nov 12 2026.
```

Post AFTER the submission form is clicked and the submission ID is on hand — never before. Reason: if the submission fails a reCAPTCHA or form-level rule, we don't want public commitment ahead of reality.

## 5. SUBMISSION writeup final char-count

Current: **2,198 chars** body (Inspiration → What we got wrong first). Target: **1,900–2,100 ± 100**. Keeperhub winner comp: 2,330 chars. No further trimming unless the competitor scan verdict changes hero framing — it does not (Branch A, hold frame).

## 6. Deadline-day (2026-11-12) rules

- **Review-only.** No new PRs, no new code, no new artefacts.
- Final video URL verified in incognito at 12:00 UTC (8h before cut-off).
- Submission form submit button clicked at **17:00 UTC** (3h buffer before 20:00 UTC cut-off).
- Single click, screenshot the submission ID, don't touch the form again.

## 7. Fallback — if the video is not uploaded by 2026-11-12 17:00 UTC

Upload whatever cut exists, even uncaptioned. A rough 1.0× cut with the hook intact beats a missed submission. Devpost permits draft-submission edits before deadline, not after. Submit the form with whatever URL is live; update later if a better cut uploads in time. Do NOT skip submission.

Related: [[project_bli_legal_tech_2]], [[feedback_submission_form_rules_first]], [[feedback_realvoice_demo_video]], [[feedback_demo_video_production]].
