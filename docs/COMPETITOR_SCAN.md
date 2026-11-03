# Competitor scan — PayPal AI Hackathon

**T-72h gate (BLI-born).** Final scan locks **2026-11-09 23:59 UTC** (3 days before submission). This file is a running draft until that moment, with a one-page final verdict appended at lock-time.

**Why this gate exists.** On BLI Legal Tech 2 ([[project_bli_legal_tech_2]]), the sibling-shape submission "Verdict Desk" landed in our lane without us scouting it pre-deadline. Second time this year a competitor was discovered post-cutoff (Keeperhub was the first — `[[feedback_scout_the_field_before_positioning]]`). Add a grep-the-gallery pass at T-72h, not T+0.

Related memories: [[feedback_scout_the_field_before_positioning]], [[project_bli_legal_tech_2]], [[hackathon_winning_playbook]] §Addendum.

---

## 1. What to grep for

The Rule-0 pitch for this submission: *"The 43rd tool for PayPal Agent Toolkit — N-party fan-out of PayPal proceeds, AP2-bound, PYUSD-settled on Arbitrum."* The claim is only differentiated if ≤2 other entries share it. One-liner greps to run against the Devpost gallery (empty on 2026-10-04; expected to fill by 2026-11-10):

- "43rd tool" / "forty-third tool"
- "N-party" / "fan-out" / "fanout" / "atomic split" / "atomic payout"
- "AP2" + "split" or "mandate" + "payout"
- "PYUSD" + "settlement" + "agent"
- "agent commission" or "pay the agent" or "pays agents"
- "merchant_agent" + "multiple"
- "PayPal Payouts" + "AI" + "multi-recipient"
- "ERC-8004" + "payout" (identity + settlement)

## 2. Scan sources

1. **Devpost gallery:** https://paypalaihackathon.devpost.com/submissions — primary. Open with filters: Most Recent, All Submissions, All Tracks. Scroll every row's title + elevator pitch.
2. **Devpost project search:** `site:devpost.com PayPal AI N-party` — cheap sanity check.
3. **GitHub search:** `is:public kajota-paypal-like topics` (not us) — hidden entries whose Devpost page isn't live yet.
4. **AP2 ecosystem threads:** `google-agentic-commerce/AP2#255` plus any new mandate-binding issues since 2026-10-04 — someone may have forked the thread into a submission.
5. **PayPal Agent Toolkit forks:** `gh search forks paypal/agent-toolkit --sort=newest --limit=50` — if a fork was created in October 2026, it may be a submission author.

## 3. What a near-miss looks like

A "near-miss" is any entry that:
- Pitches a programmable split of PayPal proceeds via a smart contract or Payouts API
- Names AP2 Payment Mandate as the authorisation primitive
- Settles in PYUSD or any Paxos stablecoin on an L2
- Positions as a "43rd tool" or "the missing piece in the Agent Toolkit"

A near-miss is NOT a:
- Dispute / refund automation (orthogonal to proceeds)
- Pricing or fraud agent (buy-side, not sell-side)
- Pure Agent Toolkit demo with a single payee (table stakes)

## 4. What to do when a near-miss is found

Three branches, pre-rehearsed per [[feedback_scout_the_field_before_positioning]]:

### Branch A — Near-miss has worse execution than us

- Hold the pitch. Keep the 43rd-tool framing.
- Add a one-line pass-by acknowledgement in `/evidence` or SUBMISSION: *"X also explores programmable splits; Mesh differs on [specific technical delta]."*
- Do not reposition in the final 48 hours.

### Branch B — Near-miss has equivalent execution

- Decide the technical delta the judges will see in the first 30 seconds of the demo video.
- Lead the demo with that delta, not the "43rd tool" headline.
- Candidate deltas: Mandate Beacon compliance receipt (`lib/beacon/*`), 7-gate adversarial table, 21-scar HARD_PARTS, Nigerian-fintech first-person framing, server-authored idempotency key (AP2 §7 defect).

### Branch C — Near-miss has better execution

- Reposition on the orthogonal angle: not "N-party fan-out" but "the compliance-receipt layer under every mandate-based payment system."
- The Mandate Beacon port already provides this; `MANDATE_BEACON.md` reads as the backup pitch.
- Submit anyway. Keeperhub's lesson #1: filed-and-ranked > unfilled-and-perfect.

## 5. Scan log (filled live until lock)

### 2026-11-03 — early-cycle sweep (today)

- Devpost gallery: **not yet visited** (owner single-threaded on scaffold today). First pass tomorrow 2026-11-04.
- GitHub forks: `gh search forks paypal/agent-toolkit --sort=newest --limit=20` — not run yet.
- AP2 ecosystem: `#255` has 8 replies as of 2026-10-04 scaffold; no new submissions filed in-thread.

### 2026-11-04 — first live gallery sweep (planned)

- Run full grep list above against the gallery.
- Catalogue every entry with "PayPal" + any payment-rail / mandate / split keyword.
- Note the top 10 entries by Devpost "likes" or team size.

### 2026-11-06 — second sweep (planned)

- Repeat sweep 48h later; late-submitters file in the final week.

### 2026-11-09 — LOCK (final sweep, append verdict below)

```
LOCK VERDICT (fill 2026-11-09):
- Entries in our lane counted: _____
- Nearest-miss name + URL: _____
- Branch (A / B / C): _____
- Action taken by 2026-11-10 09:00 UTC: _____
```

## 6. What NOT to let this become

- Not a weeks-long re-scope. Scan, decide in <2 hours, log the verdict.
- Not a late-stage pivot. Pitch is locked by 2026-11-07; this scan can shift the demo narrative, not the primitive.
- Not an obsessive hunt. If the gallery is still thin by 2026-11-09, cite thinness as the result — "field below critical mass of near-misses, holding original frame."

## 7. Cross-reference to recording day

The scan verdict directly shapes the demo-video opening per `docs/RECORDING_LOCK.md`:
- Branch A → hero shot stays "the 43rd tool"
- Branch B → hero shot becomes [specific delta]
- Branch C → hero shot pivots to "compliance receipt under every mandate payment"

Lock the verdict **before** rehearsing the voice-over on 2026-11-10.
