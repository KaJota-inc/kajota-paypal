# Recording lock — PayPal AI Hackathon demo video

**T-48h gate (BLI-born).** Lock date: **2026-11-10**. Submission deadline: **2026-11-12 20:00 UTC (12:00 PM PST)**.

**Why this gate exists.** BLI Legal Tech 2 ([[project_bli_legal_tech_2]]) was feature-complete by late October but missed its 2026-11-01 01:01 UTC deadline because no calendar block was ever locked for the voice-over + form walk. The video arrived 33 hours after cutoff. The engineering wasn't the gap; the scheduling was.

Rule we added to the playbook: **"T-48h is the recording lock, T-24h is the form-walk lock, deadline-day is review-only."**

Related memories: [[project_bli_legal_tech_2]] (the loss), [[feedback_submission_form_rules_first]] (video speed + hosting rules), [[feedback_demo_video_production]], [[feedback_realvoice_demo_video]] (owner's voice, whisper-sync), [[feedback_ios_sim_recording]], [[feedback_receipt_pip_video_pattern]].

---

## 1. The non-negotiables (from Devpost form rules, verified 2026-11-03)

Walked live at `https://paypalaihackathon.devpost.com/rules` on 2026-11-03.

- **Length:** < 3 min (judges aren't required to watch past that). Target **2:30** to leave margin for upload + buffer per `[[hackathon_winning_playbook]]`.
- **Speed:** no explicit atempo rule stated in the Devpost rules page — but default to **1.0× only** per `[[feedback_submission_form_rules_first]]`. Zama S4 disqualifier precedent. Trim content, don't speed up.
- **Voice:** owner's voice, never AI VO. Hackathons increasingly ban AI voice (Zama precedent).
- **Hosting:** **YouTube only** per Devpost rules. Must be publicly visible. Link on the submission form.
- **Content:** footage must show the project functioning on the device it was built for.
- **IP:** no third-party trademarks or copyrighted music without permission.

## 2. The calendar block (lock BEFORE the moment it binds)

**Primary slot:** 2026-11-10 (Tuesday) · 20:00–23:00 WAT (19:00–22:00 UTC). Three-hour window. If this slips, fallback is 2026-11-11 (Wednesday) · 20:00–23:00 WAT.

**Backup slot:** 2026-11-11 (Wednesday) · 20:00–23:00 WAT. Final absolute cut-off: 2026-11-12 09:00 UTC — anything after that risks YouTube processing (variable, can take 2+ hours) racing the 20:00 UTC deadline.

Owner marks the block as blackout. No PRs, no other hackathon work, no meetings.

## 3. Shot list (3-minute cut)

Draws from `docs/DEMO_VIDEO.md` and the Rule-0 pitch. Open with the HOST defect; close with the "pays agents" callback. Lift the structure that worked on BLI (`~/Movies/beacon-vo-mcp-3min.mp4` is the reference pattern).

| Beat | Time | Shot | VO cue |
|---|---|---|---|
| 1. Hook | 0:00–0:10 | Agent Toolkit docs page scrolling through 42 tool names | "The PayPal Agent Toolkit gives agents 42 tools. Zero of them pay an agent." |
| 2. Problem | 0:10–0:35 | Nigerian fintech framing + T+30 reconciliation pain | "A decade in Nigerian payment infra meant reconciling settlement that landed days after the sale." |
| 3. Pipe reveal | 0:35–1:10 | Diagram of 8-stage pipeline → zoom to `release(bytes32)` on Arbiscan | "A PayPal checkout fires our webhook; the AP2 Mandate pair verifies; one transaction releases to every payee." |
| 4. Live demo | 1:10–2:10 | `/chat` → `/dashboard` → click to Arbiscan → `/leaderboard` with real PYUSD totals | "The agent closes the sale; `/leaderboard` ranks who earned what. Standing as a reward you don't pay out in cash." |
| 5. Hard parts receipt | 2:10–2:30 | `pnpm reproduce:fail` running in terminal — 7/7 gates fire with hash per branch | "Seven adversarial gates fire with a hash per branch. HARD_PARTS carries 21 scars." |
| 6. Callback | 2:30–2:55 | Zoom back to the Agent Toolkit docs with "Tool #43: Mesh" tacked on | "The 43rd tool for the PayPal Agent Toolkit — and the one that pays agents what they just earned." |

## 4. Prep checklist (land by 2026-11-09)

- [ ] All five upstream PRs opened (status captured in `UPSTREAM_PR.md`)
- [ ] `/evidence` page accumulating runner-fired txs from GH Actions (needs remote + Vercel deploy first)
- [ ] Final SUBMISSION draft locked at 2 100 ± 100 chars (currently 2 198 — within range)
- [ ] COMPETITOR_SCAN verdict logged — branch A/B/C determines hero shot
- [ ] Devpost submission form walked end-to-end once; log the fields in `docs/SUBMISSION_FORM_WALK.md`
- [ ] YouTube channel visibility set to Public before upload (not after — the processing delay bites)
- [ ] OBS + screen recording setup verified (resolution, FPS, mic input)

## 5. Recording-day minute-by-minute (2026-11-10)

| Clock | Action |
|---|---|
| 20:00 WAT | Open OBS. Fire local dev server. Verify `/chat`, `/dashboard`, `/leaderboard`, `/evidence`, `/mandate-inspector/<id>` all load. |
| 20:10 WAT | Rehearse the voice-over once at 1.0×, no video. 2:30 target. |
| 20:25 WAT | Record take 1. Full pass. |
| 20:40 WAT | Record take 2. Full pass. |
| 20:55 WAT | Pick the better take. Trim to 2:30 at 1.0× — content cut, never atempo. |
| 21:30 WAT | Overlay captions + Arbiscan URL overlays with ffmpeg + whisper-sync per `[[feedback_realvoice_demo_video]]`. |
| 22:00 WAT | Upload to YouTube. Public. "Not for Kids." Monitor processing. |
| 22:30 WAT | Grab the public URL + verify it plays in incognito. Paste into Devpost draft submission. |
| 23:00 WAT | Save draft. Block ends. |

## 6. What the form walk reveals (2026-11-11, T-24h)

Open the Devpost "Enter a Submission" page. Click every field. Log in `docs/SUBMISSION_FORM_WALK.md`:
- Required artefacts (logo? thumbnail? screenshot count?)
- Character caps on each text field (DoraHacks had an undocumented 960-char cap; Devpost may differ)
- Required URLs (video, repo, hosted demo — do they all need to be live before save?)
- Multi-category submission — do we tick Grand + Best Use of PayPal + AI + Best Use of Agentic Commerce + AG Grid + APIMatic + Channel3 + Render?
- Final submission is one-shot or editable? (Devpost allows draft edit before deadline; verify.)

Any surprise found on this walk gets fixed before 2026-11-12 00:00 UTC. Zama S4 lesson: the form hid a disqualifier that cost a re-record.

## 7. Deadline-day (2026-11-12) rules

- **Review-only.** No new PRs, no new code, no new artefacts.
- Final video URL verified in incognito at **12:00 UTC** (8h before cut-off).
- Submission form submit button clicked at **17:00 UTC** (3h before cut-off at 20:00 UTC) — leaves buffer for a reCAPTCHA re-attempt or an "edit submission" trip.
- Owner confirms: single click, screenshot the submission ID, don't touch the form again.

## 8. Fallback — if the video is not uploaded by 2026-11-12 17:00 UTC

- Upload whatever cut exists, even if un-captioned. A rough-cut 1.0× video with a strong hook beats a missed submission.
- Devpost permits post-submission edit of a draft before deadline — not after. Submit the form with the current URL, then update if a better cut uploads in time.
- Do NOT skip submission. BLI's lesson is "submit something good enough" vs "miss something perfect."
