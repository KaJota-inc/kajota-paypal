# Upstream PR plan — one page, 9 days to ship

**Date:** 2026-11-03. **Deadline:** 2026-11-12 20:00 UTC (12:00 PM PST). **Halfway deadline per playbook move #3:** 2026-11-07 (4 days from today).

This memo collapses `docs/upstream-prs/STATUS.md` into one actionable page the owner can execute today. Five drafts are READY on disk and have not been opened since the Oct 6 scaffold. Playbook move #3 ("merged before halfway") still has runway — barely — if ≥1 PR goes up today or tomorrow.

Related memories: [[hackathon_winning_playbook]] §3, [[feedback_winner_teardown_keeperhub]] §3, [[feedback_fact_check_public_posts]] (never claim merged until `gh pr view` says MERGED).

---

## State machine

```
DRAFTED → OPENED → UNDER_REVIEW → MERGED (floor to clear playbook move #3)
                 └→ CHANGES_REQUESTED → OPENED
                 └→ CLOSED (fallback: cite in SUBMISSION as "filed, awaiting review")
```

## The five drafts

| # | Target | Author of host issue | Fix shape | State | Days to merge |
|---|---|---|---|---|---|
| 1 | **`paypal/agent-toolkit#98`** | @aurumflux20 | per-call `PayPal-Request-Id` override | DRAFTED | 4 (open today → merge by Nov 7) |
| 2 | **`paypal/agent-toolkit#43`** | @gordonchanhk | `api-m.` CDN-managed domain | DRAFTED (depends on #98 landing first) | 7 (open after #98 lands) |
| 3 | **`google-agentic-commerce/AP2#372`** | @vicentewolde | `cnf.jwk` enum serialisation | DRAFTED | 4 |
| 4 | **`google-agentic-commerce/AP2#367`** | @sunruize93-cmyk | `ReceiptClient` optional-callback crash | DRAFTED | 4 |
| 5 | **`google-agentic-commerce/AP2#255`** | @hilarl | on-chain settlement comment | DRAFTED (comment, not PR) | 0 (post today) |

All five issues verified open on 2026-11-03 at session start via `gh api repos/<owner>/<repo>/issues/<n>`.

## The two-command fast path (owner runs)

### Today — post the ecosystem comment first (0 risk, buys goodwill)

```bash
gh issue comment 255 --repo google-agentic-commerce/AP2 \
  --body-file ~/Documents/kajota-paypal/docs/upstream-prs/ap2-255-comment/COMMENT.md
```

### Today / tomorrow — open #98, #372, #367 in parallel

Three independent PRs; three forks; three HEAD branches. See per-file one-liners in [`docs/upstream-prs/STATUS.md`](upstream-prs/STATUS.md) §One-line commands.

- **#98** (paypal/agent-toolkit, blocks #43) — fastest to merge; capability-shaped per move #4.
- **#372** (AP2) — pure bug-fix, small diff.
- **#367** (AP2) — pure bug-fix, small diff.

### After #98 merges — open #43

Only workable once #98 lands because both touch `typescript/src/client.ts`.

## Why five is the floor, not the ceiling

Keeperhub bursar (3rd) took **three** issues from the maintainer's own backlog. Our Keeperhub Agent Economy entry (lost) merged one PR, five days *after* the bounty was decided — zero score at submission time. Five drafts queued means we can lose two to review timing and still clear the move-#3 floor.

## The honest fallback

If ≥1 PR is not MERGED by 2026-11-12 20:00 UTC, the SUBMISSION paragraph still reads:

> Five upstream artefacts filed: `paypal/agent-toolkit#98`, `#43`, `AP2#372`, `AP2#367`, and an on-chain-settlement comment on `AP2#255`. State of each at submission time: see `docs/upstream-prs/STATUS.md`.

Keeperhub's winning submissions cited "under review" as evidence of good-faith engagement; so can ours. **Filed-and-under-review scores less than merged, but non-zero.** Open the drafts; let the state track honestly.

## Source of truth (never from memory)

```bash
for num in 98 43 372 367; do
  repo=paypal/agent-toolkit
  if [ "$num" = "372" ] || [ "$num" = "367" ]; then
    repo=google-agentic-commerce/AP2
  fi
  gh pr list --repo "$repo" --search "fix:$num author:@me" --state all \
    --json number,title,state,mergedAt
done
```

Update `docs/upstream-prs/STATUS.md` every time a PR moves state (per `[[feedback_fact_check_public_posts]]`). This file lives at the submission's root — never cite a merged PR in SUBMISSION.md until `gh pr view` says MERGED.

## When this plan fails

- **If PayPal maintainers are slow:** open the two AP2 PRs anyway; AP2 may merge faster.
- **If a reviewer asks for changes:** fix immediately, don't wait a cycle. The 72-hour review turnaround for a correction is the common blocker, per Keeperhub teardown.
- **If a maintainer closes a PR WONTFIX:** that is still citable as engagement; it is not nothing.
- **If none of the five open:** the owner is single-threaded across PayPal + Dubai + NEAR; batch the two highest-leverage opens into one tool-less sitting (90 minutes end-to-end for #255 comment + #98 PR).

## Owner action items for the next 48 hours

- [ ] 2026-11-03 — post AP2 #255 comment (5 min)
- [ ] 2026-11-04 — open #98 PR (45 min with fork + apply + lint + push)
- [ ] 2026-11-04 — open AP2 #372 PR (45 min)
- [ ] 2026-11-05 — open AP2 #367 PR (45 min)
- [ ] 2026-11-07 — open #43 PR if #98 has merged (45 min)
- [ ] 2026-11-10 — snapshot of final merge state goes into SUBMISSION paragraph

Each PR body is already drafted at `docs/upstream-prs/<slug>/PR_DESCRIPTION.md`; each patch is at `docs/upstream-prs/<slug>/patch.diff`. The commits exist; what's missing is the `gh pr create` call.
