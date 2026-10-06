Fixes #43.

## Summary

`PayPalClient` currently hard-codes `https://api.sandbox.paypal.com` and `https://api.paypal.com` for its REST base URL. PayPal's own developer documentation recommends the CDN-managed `api-m.*` variants for better global routing and TLS termination. @gordonchanhk filed this fifteen months ago with the exact two lines; the fix is a four-character prefix on each.

## Change

```diff
         this._baseUrl = this._isSandbox
-        ? 'https://api.sandbox.paypal.com'
-        : 'https://api.paypal.com';
+        ? 'https://api-m.sandbox.paypal.com'
+        : 'https://api-m.paypal.com';
```

## Why `api-m.` is the right choice

- PayPal's "REST APIs" developer guide names `api-m.sandbox.paypal.com` and `api-m.paypal.com` as the base URLs; the `api.*` variants resolve to the same backend but miss the CDN layer.
- Every other PayPal Developer-authored SDK and example I've seen (checkout-server-sdk, paypal-rest-sdk, the Python examples in this very repo at `python/paypal_agent_toolkit/common/paypalclient.py`) uses `api-m.*`.
- Independently, our own client at `KaJota-inc/kajota-paypal/lib/paypal/client.ts` arrived at `api-m.*` without consulting this issue, and the OAuth token exchange, order creation and capture all behaved identically to the toolkit's `api.*` path — modulo the CDN latency delta.

## What this does NOT do

- No Python-side change. The Python client uses `api-m.*` already (verified at `python/paypal_agent_toolkit/common/paypalclient.py`).
- No change to the OAuth token endpoint URL in the toolkit's `getAccessToken` path — that already builds from `this._baseUrl` and automatically inherits this fix.
- No breaking surface change. Any client code that hits `getBaseUrl()` sees the new value; nobody was constructing the URL by hand.

## Verification

- `pnpm run build` passes.
- The OAuth token exchange that follows at `client.ts:getAccessToken` resolves against `${this._baseUrl}/v1/oauth2/token`, which naturally picks up the new domain.
- No test script in the repo today, so no regression harness to update.

## Honesty ledger

- @gordonchanhk's issue has been open for fifteen months with zero comments; the delay is probably triage bandwidth, not disagreement about the fix. If a maintainer prefers to add a config override instead of hard-coding the new value, I will gladly add that — but the fix as drafted is strictly a correctness improvement with no new surface.
- No sandbox-vs-live regression test is included because the toolkit has no test infrastructure. Happy to add `node:test` coverage in a follow-up if that would help this land.
