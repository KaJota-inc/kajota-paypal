# Devpost submission form — canonical rules

**Captured 2026-11-09** from `https://paypalaihackathon.devpost.com/rules` and the hackathon landing page's **REQUIREMENTS** section. The form behind `https://devpost.com/submit-to/31302-paypal-ai-hackathon/manage/submissions` requires authentication to view its per-field controls — the fields below are from the sponsor's public Requirements and Rules pages; any additional per-field caps (960-char additional-info caps on DoraHacks, for instance) come to light only on the actual form walk, which the owner performs on 2026-11-11 (T-24h lock per `RECORDING_LOCK.md`).

Per [[feedback_submission_form_rules_first]]: these are the known-authoritative constraints; the form-walk on Nov 11 adds any undocumented ones.

---

## Non-negotiable deadlines

| Milestone | Date (canonical) | Time zones |
|---|---|---|
| Submission Period opens | 2026-10-01 | 09:15 PT |
| **Submission Period closes** | **2026-11-12** | **12:00 PM PT = 20:00 UTC = 21:00 WAT** |
| Judging Period | 2026-12-01 → 2026-12-15 | 14:00 PT to 08:00 PT |
| Winners Announced | 2026-12-21 | ~14:00 PT |

**Deadline is 20:00 UTC, not 23:59 UTC.** Confirmed canonical via the Rules page §1 *"Dates and Timing"*.

## What must be in the submission

### Project (free text)

- Must integrate at least one PayPal technology (API / SDK / product / developer capability) **meaningfully** — not a decorative mention.
- Must incorporate AI into the experience or functionality **meaningfully**.
- Must demonstrate a **working prototype or proof of concept**. A design mockup or non-functional demo does NOT meet the requirement.

### Text description

- Explain features and functionality.
- No stated character cap on the sponsor pages — Devpost's standard field takes 2,000 words comfortably. Our `docs/SUBMISSION.md` body is 2,198 chars; well inside any plausible cap.

### Functional demo

- Satisfied by **either** a hosted demo URL **or** clear setup-and-run instructions in the repo. We have both (`kajota-paypal.vercel.app` + `pnpm preflight`).

### Public code repository

- GitHub, GitLab, or Bitbucket.
- **Must be public and open source**, with a license file **detectable at the top of the repository page (in the About section)**.
- ✅ `https://github.com/KaJota-inc/kajota-paypal` — MIT auto-detected, visible in the right-side About panel.

### Demo video

- **Under 3 minutes** (judges aren't required to watch past that — hard cap at 2:55 for safety).
- Must show the project functioning **on the device it was built for**.
- **Must be uploaded to YouTube**, publicly visible, link on the submission form. "Anywhere else will not be considered."
- Must NOT include third-party trademarks or copyrighted music / material without permission.
- **No stated speed rule.** Per [[feedback_submission_form_rules_first]] default to 1.0× — atempo/speed-up DQs are common hackathon rules that live on the form itself even when absent from the landing page, so avoid.

### Tools

- Identify which AI tools / models / services were used.
- Explain **how** each tool was used.

## Eligibility clauses

From §3 *"Eligibility"*:

- Entrant must be the age of majority where they reside. ✅ (Owner is 30+.)
- Hackathon is **not open** to residents of: Brazil, Quebec, Russia, Crimea, Cuba, Iran, North Korea, and any other OFAC-sanctioned territory. ✅ (Nigeria is not on the list.)
- Not open to employees or affiliates of PayPal / Devpost / Judges. ✅.
- Must appoint one Representative if a team. ✅ (Solo entry = owner is the Representative.)

## IP clauses

From §4 *"How To Enter"* / *"Intellectual Property"*:

- Submission must be the entrant's original work product.
- Solely owned by the entrant, no other person or entity holding rights.
- Must not violate any third-party IP (copyright, trademark, patent, contract, privacy).
- **Open-source software is allowed** provided the entrant complies with the open-source license. ✅ (Mesh substrate Apache 2.0, Beacon layer MIT, both carried forward in `README.md` under "Credits".)
- A third party may contract to provide technical assistance only when the Submission's components are solely the entrant's work.

## "Newly built or significantly updated" clause

From §4:

> Projects must be either newly created by the Entrant or, if the Entrant's Project existed prior to the Hackathon Submission Period, must have been **significantly updated** after the start of the Hackathon Submission Period. Entrants should explain how their Project was significantly updated during the Submission Period.

**Our status:** the Mesh substrate on `KaJota-inc/kajota-arbitrum-singapore` existed before the window. The `KaJota-inc/kajota-paypal` repo was created on 2026-10-04 (scaffold) and has received ~15 commits during the window, including the Mandate Beacon layer port (lib/beacon/), AP2 verifier (lib/ap2/), PayPal webhook integration, AG Grid dashboard, Vercel deploy, 5 upstream PR drafts (4 retired as dupes, 1 ecosystem comment posted). The writeup must call this out in the description per §4.

## "Multiple Submissions" clause

From §4:

> An Entrant may submit more than one Submission, however, each Submission must be unique and substantially different from each of the Entrant's other Submissions.

**Our status:** One submission. Not relevant.

## Testing clause

From §4:

> Judges are not required to test the Project and may choose to judge based solely on the text description, images, and video provided in the Submission.

**Implication:** the SUBMISSION writeup + video carry most of the weight. The deployed URL and repo are backup proof. This reinforces the Keeperhub-winner cadence: short, dense writeup; punchy video; everything else is receipts.

## Modifications after submission

From §5:

> Once the Submission Period has ended, you may not make any changes or alterations to your Submission, but you may continue to update the Project in your Devpost portfolio.

**Implication:** everything the judges see is frozen at 2026-11-12 20:00 UTC. Treat the form as one-shot. Submit at 17:00 UTC for a 3h buffer.

## Language requirement

All materials in English, or English translation provided. ✅.

## Judging criteria (five, no stated weights — Devpost default = equal)

1. **Technological Implementation** — thoroughness and skill in using PayPal Developer Platform and AI tools. Non-trivial working implementation.
2. **Design** — complete, coherent product experience, not just a technical proof-of-concept.
3. **Potential Impact** — credible case for solving a real problem for a real audience.
4. **Innovation / Idea** — creative and novel, differentiated from existing concepts.
5. **Presentation** — video demonstrates end-to-end working project; pitch communicates problem, audience, and significance.

## Prize-category entry mechanics (unverified until form walk)

$67.5K+ pool split across:
- Grand (1st $12k / 2nd $8k / 3rd $5k)
- Category bonuses ($5k each): Most Creative · Most Impactful · Best Demo Delivery · Best Use of PayPal + AI · Best Use of Agentic Commerce
- Sponsor awards: AG Grid ($5k/$2k/$1k × 3), APIMatic ($1k × 3 + 6mo sub), Bryntum ($1k × 3), Channel3 ($1.5k), Render (credits × 3)

**Form-walk open question:** does the submission form let you tick multiple category checkboxes, or does Devpost auto-enter you into all applicable categories? Historical pattern (other Devpost hackathons): auto-enter. Confirm on Nov 11 walk.

## The one-shot discipline

Per [[feedback_submission_form_rules_first]]:
- Walk the form end-to-end **BEFORE** the recording lock on Nov 10. Log every field in this doc's appendix.
- Have the SUBMISSION writeup, YouTube URL, repo URL, LinkedIn-style headshot, 3:2 thumbnail ≤5MB, and any team/Rep details ready.
- Submit at 17:00 UTC on Nov 12. Screenshot the submission ID. Do not re-open the form.

## Appendix — fields discovered on Nov 11 form walk (to be filled)

_Owner fills this in during the Nov 11 (T-24h) walk. Any undocumented caps or required fields land here before the Nov 10 recording lock becomes immutable._

```
Field: ________
Cap / rule: ________
Our value: ________
```

Related: [[feedback_submission_form_rules_first]], [[feedback_verify_deadline_vs_today]], [[project_paypal_ai_hackathon]].
