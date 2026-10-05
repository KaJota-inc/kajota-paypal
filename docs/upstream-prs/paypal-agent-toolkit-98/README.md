# Upstream PR draft — `paypal/agent-toolkit` #98

**Issue:** [paypal/agent-toolkit#98](https://github.com/paypal/agent-toolkit/issues/98) — "`PayPal-Request-Id` is set per client, not per call — and nothing ever sets it, so `create_order` and `capture_order` have no idempotency (`client.ts:122`)."

**Status:** patch drafted, PR not yet opened. Opening the PR is a user-approved step (visible, affects shared state).

**Why this issue:** fits playbook move #3 ("upstream PR MERGED by halfway + raid the maintainers' backlog") *and* move #4 ("capability not correctness") — this adds per-call idempotency as a new capability, not a message fix. The fix also mirrors Mesh's own idempotency pattern (`payment_mandate_id` as dedupe key, see [`lib/orchestrator/sessions.ts`](../../../lib/orchestrator/sessions.ts) and the webhook route). The hackathon's judges include six PayPal DevRel/Engineering staff who will see the PR directly on their own repo.

## Shape of the fix

Minimum defensible surface — three files, roughly thirty net lines, zero breaking changes.

1. **`typescript/src/shared/client.ts`** — `getHeaders()` accepts an optional `{ requestId?: string }`. Per-call `requestId` wins over the per-client `_context.request_id`.
2. **`typescript/src/shared/parameters.ts`** — `createOrderParameters` and `captureOrderParameters` each gain an optional `request_id` field with a tool description that spells out the two rules the current API makes impossible to satisfy at once ("stable across retries of the same purchase, distinct between purchases").
3. **`typescript/src/shared/functions.ts`** — `createOrder` and `captureOrder` thread the per-call `request_id` through to `getHeaders`. `captureOrder` additionally defaults to the order id when the caller does not supply one — a retried capture of the same order is then safely deduped.

Deliberately out of scope for this PR:

- The other 38 `getHeaders()` call sites. Only `createOrder`/`captureOrder` move money; the others can be addressed in a follow-up if the maintainers want it.
- The Python surface. Mirror PR to come once this one lands.

## How to apply the patch

```bash
# 1. Fork and clone
gh repo fork paypal/agent-toolkit --clone
cd agent-toolkit

# 2. Create a branch
git checkout -b fix/per-call-request-id-98

# 3. Apply the patch
git apply ~/Documents/kajota-paypal/docs/upstream-prs/paypal-agent-toolkit-98/patch.diff
```

```bash
# 4. Verify the build (the repo currently has no test script)
cd typescript && npm install && npm run build
```

```bash
# 5. Commit + push + open PR
git add -A && git commit -m "fix(client): accept per-call PayPal-Request-Id (#98)"
git push -u origin fix/per-call-request-id-98
gh pr create --repo paypal/agent-toolkit \
  --title "fix(client): accept per-call PayPal-Request-Id override (#98)" \
  --body-file ~/Documents/kajota-paypal/docs/upstream-prs/paypal-agent-toolkit-98/PR_DESCRIPTION.md
```

## Files in this directory

- `README.md` — this file
- `PR_DESCRIPTION.md` — the body for the GitHub PR, written in the format `aurumflux20` is tracking responses in (concrete, honesty-ledger style)
- `patch.diff` — unified diff against `paypal/agent-toolkit@a3aa963`
