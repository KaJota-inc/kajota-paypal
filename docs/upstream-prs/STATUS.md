# Upstream PR status tracker

_Last updated 03 Nov 2026 — Day 30 of 42. Playbook move #3 halfway redefined: Nov 7 (4 days). Submission deadline Nov 12 20:00 UTC._

One table, one truth. Each row is a drafted upstream artefact, its current state, and the exact command the user runs to move it one step. Updated at every commit that touches `docs/upstream-prs/`.

**Current reality (2026-11-03):** 1/5 posted (AP2 #255 ecosystem comment). 4 drafts remain for `gh pr create`. Target repos verified open via `gh api`. See [`../UPSTREAM_PR.md`](../UPSTREAM_PR.md) for the owner action plan.

## State machine

```
DRAFTED → OPENED → UNDER_REVIEW → MERGED
                 └→ CHANGES_REQUESTED → OPENED
                 └→ CLOSED
```

## The five drafts

| # | Repo / target | Author of issue | Fix shape | State | Action |
|---|---|---|---|---|---|
| 1 | **`paypal/agent-toolkit#98`** | @aurumflux20 | per-call `PayPal-Request-Id` override | DRAFTED | `pnpm run open:98` or see `paypal-agent-toolkit-98/README.md` |
| 2 | **`paypal/agent-toolkit#43`** | @gordonchanhk | `api-m.` CDN-managed domain | DRAFTED (depends on #98 to land first) | After #98 merges, apply this |
| 3 | **`google-agentic-commerce/AP2#372`** | @vicentewolde | `cnf.jwk` enum serialisation | DRAFTED | `gh pr create` per `ap2-372/README.md` |
| 4 | **`google-agentic-commerce/AP2#367`** | @sunruize93-cmyk | `ReceiptClient` optional-callback crash | DRAFTED | `gh pr create` per `ap2-367/README.md` |
| 5 | **`google-agentic-commerce/AP2#255`** | @hilarl | on-chain settlement comment | ✅ **POSTED 2026-11-03** — [comment-6598336168](https://github.com/google-agentic-commerce/AP2/issues/255#issuecomment-6598336168) | — |

## One-line commands

### 1 — `paypal/agent-toolkit#98` (open first, blocks #43)

```bash
gh repo fork paypal/agent-toolkit --clone && cd agent-toolkit && \
  git checkout -b fix/per-call-request-id-98 && \
  git apply ~/Documents/kajota-paypal/docs/upstream-prs/paypal-agent-toolkit-98/patch.diff && \
  cd typescript && npm install && npm run build && cd .. && \
  git add -A && git commit -m "fix(client): accept per-call PayPal-Request-Id (#98)" && \
  git push -u origin fix/per-call-request-id-98 && \
  gh pr create --repo paypal/agent-toolkit \
    --title "fix(client): accept per-call PayPal-Request-Id override (#98)" \
    --body-file ~/Documents/kajota-paypal/docs/upstream-prs/paypal-agent-toolkit-98/PR_DESCRIPTION.md
```

### 2 — `paypal/agent-toolkit#43` (after #98 lands)

```bash
cd agent-toolkit && git checkout main && git pull upstream main && \
  git checkout -b fix/api-m-domain-43 && \
  git apply ~/Documents/kajota-paypal/docs/upstream-prs/paypal-agent-toolkit-43/patch.diff && \
  git add -A && git commit -m "fix(client): use CDN-managed api-m. domain (#43)" && \
  git push -u origin fix/api-m-domain-43 && \
  gh pr create --repo paypal/agent-toolkit \
    --title "fix(client): use CDN-managed api-m. domain (#43)" \
    --body-file ~/Documents/kajota-paypal/docs/upstream-prs/paypal-agent-toolkit-43/PR_DESCRIPTION.md
```

### 3 — `google-agentic-commerce/AP2#372`

```bash
gh repo fork google-agentic-commerce/AP2 --clone && cd AP2 && \
  git checkout -b fix/parsed-token-cnf-jwk-enum-372 && \
  git apply ~/Documents/kajota-paypal/docs/upstream-prs/ap2-372/patch.diff && \
  cd code/sdk/python && uv run pytest ap2/tests/ && cd ../../.. && \
  git add -A && git commit -m "fix(sdjwt): serialise cnf.jwk enum fields for jwcrypto (#372)" && \
  git push -u origin fix/parsed-token-cnf-jwk-enum-372 && \
  gh pr create --repo google-agentic-commerce/AP2 \
    --title "fix(sdjwt): serialise cnf.jwk enum fields for jwcrypto (#372)" \
    --body-file ~/Documents/kajota-paypal/docs/upstream-prs/ap2-372/PR_DESCRIPTION.md
```

### 4 — `google-agentic-commerce/AP2#367`

```bash
cd AP2 && git checkout main && git pull upstream main && \
  git checkout -b fix/receipt-wrapper-optional-callback-367 && \
  git apply ~/Documents/kajota-paypal/docs/upstream-prs/ap2-367/patch.diff && \
  cd code/sdk/python && uv run pytest ap2/tests/receipt_wrapper_tests.py && cd ../../.. && \
  git add -A && git commit -m "fix(receipt_wrapper): skip store check when callback omitted (#367)" && \
  git push -u origin fix/receipt-wrapper-optional-callback-367 && \
  gh pr create --repo google-agentic-commerce/AP2 \
    --title "fix(receipt_wrapper): skip store check when callback omitted (#367)" \
    --body-file ~/Documents/kajota-paypal/docs/upstream-prs/ap2-367/PR_DESCRIPTION.md
```

### 5 — `google-agentic-commerce/AP2#255` (ecosystem comment, not a PR)

```bash
gh issue comment 255 --repo google-agentic-commerce/AP2 \
  --body-file ~/Documents/kajota-paypal/docs/upstream-prs/ap2-255-comment/COMMENT.md
```

## Opening order (recommended) — REVISED 2026-11-03

1. **Today (Mon Nov 3):** #255 comment (5 min, no fork). Fastest action.
2. **Tue Nov 4:** #98 PR + #372 PR + #367 PR in one sitting (~2h total).
3. **Thu Nov 7 (halfway):** If #98 has merged, open #43 the same day. Minimum floor: ≥1 PR MERGED or ≥3 opened and under review by Nov 7.
4. **Mon Nov 10 (T-48h recording lock):** Snapshot the merge state into the SUBMISSION paragraph. Whatever has not merged by this moment is cited as "filed, under review" per `[[feedback_fact_check_public_posts]]`.

## Why five is the floor, not the ceiling

Keeperhub bursar won third place with THREE issues taken from the maintainers' backlog. Our Keeperhub Agent Economy entry had ONE merged, five days after judging — zero score at submission time. Five drafts queued means we have surface to lose one or two to review timing and still clear the floor.

## When a PR state changes

Every time a PR state changes (opened, review requested, merged, changes requested, closed), update the table above AND update [`BACKLOG_SCOUT.md`](BACKLOG_SCOUT.md) if the surrounding backlog has shifted.

The source of truth for merge state is the GitHub API, not a human's memory:

```bash
# which of our PRs have merged
for num in 98 43 372 367; do
  repo=paypal/agent-toolkit
  if [ "$num" = "372" ] || [ "$num" = "367" ]; then
    repo=google-agentic-commerce/AP2
  fi
  gh pr list --repo "$repo" --search "fix:$num author:@me" --state all \
    --json number,title,state,mergedAt
done
```
