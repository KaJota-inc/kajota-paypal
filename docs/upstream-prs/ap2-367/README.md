# Upstream PR draft — `google-agentic-commerce/AP2` #367

**Issue:** [google-agentic-commerce/AP2#367](https://github.com/google-agentic-commerce/AP2/issues/367) — @sunruize93-cmyk, "ReceiptClient crashes when its documented optional reference callback is omitted."

**Status:** patch drafted, PR not yet opened. Opening is a user-approved step.

**Why this issue:** Tier 1 bank-fast per [`BACKLOG_SCOUT.md`](../BACKLOG_SCOUT.md). The parameter `has_reference_in_store_cb` defaults to `None` in the signature and is documented as optional in the docstring, yet the function body calls it unconditionally. A single `is None` guard restores the documented behaviour. Third drafted upstream artefact after `paypal/agent-toolkit#98` and `AP2#372` — maintains a steady drip of focused PRs ahead of the 26 Oct halfway deadline.

## Shape of the fix

Current code at `code/sdk/python/ap2/sdk/receipt_wrapper.py:146`:

```python
if not has_reference_in_store_cb(receipt_reference):
```

When `has_reference_in_store_cb is None`, Python raises `TypeError: 'NoneType' object is not callable` even for an otherwise-valid signed receipt. The author reproduced this against both payment and checkout receipts.

Fix: branch on `None` first. When the callback is absent, log a warning (so the degraded verification is visible in operator logs) and attach `reference_check_skipped: True` to the returned result so callers can detect the gap programmatically.

## How to apply the patch

```bash
# 1. Fork and clone
gh repo fork google-agentic-commerce/AP2 --clone
cd AP2

# 2. Create a branch
git checkout -b fix/receipt-wrapper-optional-callback-367

# 3. Apply the patch
git apply ~/Documents/kajota-paypal/docs/upstream-prs/ap2-367/patch.diff
```

```bash
# 4. Verify with the AP2 test suite
cd code/sdk/python && uv run pytest ap2/tests/receipt_wrapper_tests.py
```

```bash
# 5. Commit + push + open PR
git add -A && git commit -m "fix(receipt_wrapper): skip store check when callback omitted (#367)"
git push -u origin fix/receipt-wrapper-optional-callback-367
gh pr create --repo google-agentic-commerce/AP2 \
  --title "fix(receipt_wrapper): skip store check when callback omitted (#367)" \
  --body-file ~/Documents/kajota-paypal/docs/upstream-prs/ap2-367/PR_DESCRIPTION.md
```

## Files in this directory

- `README.md` — this file
- `PR_DESCRIPTION.md` — PR body
- `patch.diff` — unified diff against `google-agentic-commerce/AP2@e1ea56d`
