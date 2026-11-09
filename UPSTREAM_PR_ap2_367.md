# UPSTREAM PR — `google-agentic-commerce/AP2` (issue #367)

**Verdict: DO NOT OPEN as a PR. Comment on #384 instead.**

Scanned the live upstream on 2026-11-09. Our drafted patch is a semantic dupe of `AP2#384` by @aksharprabhudesai (opened 2026-10-17). Opening ours is noise.

---

## What we drafted (Oct 6, 2026)

`ReceiptClient.verify_receipt` guards the `has_reference_in_store_cb` call so an omitted callback does not crash; instead the method returns `reference_check_skipped: True` on the result dict.

```python
# code/sdk/python/ap2/sdk/receipt_wrapper.py
- if not has_reference_in_store_cb(receipt_reference):
+ if has_reference_in_store_cb is None:
+     _logger.warning('has_reference_in_store_cb was not supplied; ...')
+     reference_check_skipped = True
+ elif not has_reference_in_store_cb(receipt_reference):
      ...
```

## What's already open upstream

- **`AP2#384`** by @aksharprabhudesai — *"fix(sdk): check has_reference_in_store_cb before calling in verify_receipt"* — opened 2026-10-17. Same fix, slightly tighter diff (guard before invocation, no new return flag). Issue #367 is **covered**.

Only one competing PR here, not three — but still a verbatim dupe.

## Why we're not opening ours

- @aksharprabhudesai has three AP2 PRs open from Oct–Nov (#384, #385, #390, #391). Clearly an active contributor the maintainers are engaging with. A fourth PR from an unknown contributor over the same patch competes for review attention.
- Our diff adds a `reference_check_skipped` return flag that @aksharprabhudesai's does not — but that's a design question the issue author (@sunruize93-cmyk) opened in the first place. Taking a DIFFERENT path to the same bug is a new PR, not a dupe — but it still needs the maintainer's call between two designs rather than merging one.

## What we do instead

**Post a comment on `AP2#384`** proposing the `reference_check_skipped` flag as a follow-up refinement rather than a rival PR:

```bash
gh issue comment 384 --repo google-agentic-commerce/AP2 \
  --body "+1. In our TS AP2 verifier (KaJota-inc/kajota-paypal/lib/ap2/) we found a caller frequently needs to know whether the store check happened at all — e.g. in a Phase-A sandbox where the issuer-side store isn't built yet. A follow-up tweak could surface \`reference_check_skipped: True\` on the result dict when the callback is omitted (as in our drafted alternative). Happy to send that as a follow-up PR against this one once it lands."
```

## State machine update

| # | Target | Was | Now |
|---|---|---|---|
| 4 | `AP2#367` | DRAFTED | ❌ RETIRED — dupe of #384 (@aksharprabhudesai) |

Related: [[feedback_fact_check_public_posts]], [[feedback_winner_teardown_keeperhub]] §3.
