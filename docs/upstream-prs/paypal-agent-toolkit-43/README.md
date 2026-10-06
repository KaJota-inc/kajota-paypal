# Upstream PR draft — `paypal/agent-toolkit` #43

**Issue:** [paypal/agent-toolkit#43](https://github.com/paypal/agent-toolkit/issues/43) — @gordonchanhk, "The API domain should be api-m.(sandbox.)paypal.com instead of api.(sandbox.)paypal.com."

**Status:** patch drafted, PR not yet opened. Opening is a user-approved step.

**Why this issue:** fifteen months old, unassigned, zero comments, zero controversy. @gordonchanhk cites the exact file:line and PayPal's own CDN-managed recommendation. One of the Tier-1 bank-fast candidates in [`BACKLOG_SCOUT.md`](../BACKLOG_SCOUT.md), picked up now because our own `lib/paypal/client.ts` independently settled on `api-m.*` as the right domain — we have direct evidence it is the correct call. Fourth drafted upstream PR after `#98`, `#372`, `#367`.

**Depends on #98 landing first** to avoid merge conflict on the same file (`typescript/src/shared/client.ts`). If #98 is still open when this ships, apply this patch on a branch rebased on the #98 branch.

## Shape of the fix

Two string replacements in `typescript/src/shared/client.ts`:

```diff
-        this._baseUrl = this._isSandbox
-        ? 'https://api.sandbox.paypal.com'
-        : 'https://api.paypal.com';
+        this._baseUrl = this._isSandbox
+        ? 'https://api-m.sandbox.paypal.com'
+        : 'https://api-m.paypal.com';
```

That is the whole change.

## How to apply the patch

```bash
# 1. Fork and clone (skip if you already have the fork from #98)
gh repo fork paypal/agent-toolkit --clone
cd agent-toolkit

# 2. Create a branch (rebased on fix/per-call-request-id-98 if that is still open)
git checkout -b fix/api-m-domain-43

# 3. Apply the patch
git apply ~/Documents/kajota-paypal/docs/upstream-prs/paypal-agent-toolkit-43/patch.diff
```

```bash
# 4. Verify the build (no test script in the repo today)
cd typescript && npm install && npm run build
```

```bash
# 5. Commit + push + open PR
git add -A && git commit -m "fix(client): use CDN-managed api-m. domain (#43)"
git push -u origin fix/api-m-domain-43
gh pr create --repo paypal/agent-toolkit \
  --title "fix(client): use CDN-managed api-m. domain (#43)" \
  --body-file ~/Documents/kajota-paypal/docs/upstream-prs/paypal-agent-toolkit-43/PR_DESCRIPTION.md
```

## Files in this directory

- `README.md` — this file
- `PR_DESCRIPTION.md` — PR body
- `patch.diff` — unified diff against `paypal/agent-toolkit@a3aa963`
