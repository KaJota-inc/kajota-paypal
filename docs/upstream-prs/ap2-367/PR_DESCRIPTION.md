Fixes #367.

## Summary

`ReceiptClient.verify_receipt()` at `code/sdk/python/ap2/sdk/receipt_wrapper.py:146` calls `has_reference_in_store_cb(receipt_reference)` unconditionally, but the parameter defaults to `None` and the docstring says it is optional. The result is a `TypeError: 'NoneType' object is not callable` for every otherwise-valid signed receipt verified without the callback — including the exact "verify this signed receipt" sanity flow the SDK is likely to be used for.

## Change

```diff
-        if not has_reference_in_store_cb(receipt_reference):
-            _logger.warning(
-                'Receipt reference not found in store: %s',
-                receipt_reference,
-            )
-            return {
-                'error': 'receipt_reference_not_found_in_store',
-                'message': ...
-            }
+        reference_check_skipped = False
+        if has_reference_in_store_cb is None:
+            _logger.warning(
+                'has_reference_in_store_cb was not supplied; skipping store '
+                'check for receipt reference %s. The returned result flags '
+                'reference_check_skipped=True so callers can detect the gap.',
+                receipt_reference,
+            )
+            reference_check_skipped = True
+        elif not has_reference_in_store_cb(receipt_reference):
+            _logger.warning(
+                'Receipt reference not found in store: %s',
+                receipt_reference,
+            )
+            return {
+                'error': 'receipt_reference_not_found_in_store',
+                'message': ...
+            }
```

Then propagate `reference_check_skipped` into the verified result dict.

## Why skip-with-flag rather than skip-silently or raise

Three paths were considered:

1. **Silently skip when None** — matches the docstring but hides a weakened verification from the caller. Operators who later wire a store-backed callback would never know their old receipts were accepted without the check.
2. **Raise ValueError when None** — matches the on-disk behaviour (which the author filed as a bug) and contradicts the parameter default + docstring.
3. **Skip, warn, flag in the result dict** (this PR) — honours the documented optionality, surfaces the degraded verification in both operator logs and the API contract, lets callers reject on `reference_check_skipped` if they need to.

Option 3 is the smallest surface change that preserves back-compat for callers who do pass a callback (identical behaviour) and makes the documented optional path actually work for those who don't.

## Verification

Added two cases to `code/sdk/python/ap2/tests/receipt_wrapper_tests.py`:

- `test_verify_receipt_returns_verified_with_skipped_flag_when_callback_omitted`
- `test_verify_receipt_still_rejects_unknown_reference_when_callback_supplied`

Both pass; existing cases unchanged.

## Honesty ledger

- Changing the shape of the returned dict is a soft API change. `verified: True` consumers see no delta; consumers reading the dict for `error` or `message` see no delta. The new key is `reference_check_skipped: True/False` and only when the receipt verifies.
- The docstring is updated to spell out the new flag so a caller reading the Python docs doesn't need to find this PR.
- Alternative diff considered: fold the two warnings into one branch via a helper. Rejected because the current shape makes the three outcomes (no callback / rejected / verified) legible without a helper hop.
