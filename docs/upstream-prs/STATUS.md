# Upstream PR status tracker

_Last updated 03 Nov 2026 — Day 30 of 42. Playbook move #3 halfway redefined: Nov 7 (4 days). Submission deadline Nov 12 20:00 UTC._

One table, one truth. Each row is a drafted upstream artefact, its current state, and the exact command the user runs to move it one step. Updated at every commit that touches `docs/upstream-prs/`.

**Current reality (2026-11-09, T-72h):** 1/5 landed (AP2 #255 ecosystem comment). **Four drafts RETIRED as semantic dupes of PRs already open upstream** — see worktree root `UPSTREAM_PR_paypal_agent_toolkit.md`, `UPSTREAM_PR_ap2_372.md`, `UPSTREAM_PR_ap2_367.md`. Playbook move #3 lands at 1/1 honest-engagement (the comment) + 4/4 retired-as-dupe with the upstream contributors acknowledged in the submission's honest ledger. Do NOT open a fifth PR for a dupe fix — PR-farming, not signal.

## State machine

```
DRAFTED → OPENED → UNDER_REVIEW → MERGED
                 └→ CHANGES_REQUESTED → OPENED
                 └→ CLOSED
```

## The five drafts

| # | Repo / target | Author of issue | Fix shape | State | Note |
|---|---|---|---|---|---|
| 1 | **`paypal/agent-toolkit#98`** | @aurumflux20 | per-call `PayPal-Request-Id` override | ❌ **RETIRED 2026-11-09** — dupe of [#108](https://github.com/paypal/agent-toolkit/pull/108) (@PRIEST099) + [#124](https://github.com/paypal/agent-toolkit/pull/124) (@NovaCorpAI) | See `../../UPSTREAM_PR_paypal_agent_toolkit.md` |
| 2 | **`paypal/agent-toolkit#43`** | @gordonchanhk | `api-m.` CDN-managed domain | ❌ **RETIRED 2026-11-09** — dupe of [#99](https://github.com/paypal/agent-toolkit/pull/99) (@GANESH-NADKARNI) | See `../../UPSTREAM_PR_paypal_agent_toolkit.md` |
| 3 | **`google-agentic-commerce/AP2#372`** | @vicentewolde | `cnf.jwk` enum serialisation | ❌ **RETIRED 2026-11-09** — dupe of [#385](https://github.com/google-agentic-commerce/AP2/pull/385) (@aksharprabhudesai) + [#383](https://github.com/google-agentic-commerce/AP2/pull/383) + [#355](https://github.com/google-agentic-commerce/AP2/pull/355) | See `../../UPSTREAM_PR_ap2_372.md` |
| 4 | **`google-agentic-commerce/AP2#367`** | @sunruize93-cmyk | `ReceiptClient` optional-callback crash | ❌ **RETIRED 2026-11-09** — dupe of [#384](https://github.com/google-agentic-commerce/AP2/pull/384) (@aksharprabhudesai) | See `../../UPSTREAM_PR_ap2_367.md` |
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
