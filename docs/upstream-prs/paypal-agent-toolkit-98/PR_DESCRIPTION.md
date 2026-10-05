Fixes #98.

## Summary

`PayPal-Request-Id` is now settable per call on the two money-moving tools, so a retried `create_order` or `capture_order` can carry an idempotency key that is stable across retries of the same purchase and distinct between different purchases — the two properties the current per-client-only API cannot satisfy at once.

## Changes

Three files, ~30 net lines.

### `typescript/src/shared/client.ts`

`getHeaders()` gains an optional `{ requestId?: string }`. Per-call `requestId` wins over the per-client `_context.request_id`, which keeps the existing behaviour when no override is passed. Non-call-site code (the other 38 `getHeaders()` callers) is unaffected.

### `typescript/src/shared/parameters.ts`

`createOrderParameters` and `captureOrderParameters` each gain an optional `request_id` field. The tool description says, in the words of the current API's two failure modes:

> Idempotency key sent as `PayPal-Request-Id`. Must be **stable across retries of the same purchase** and **distinct between different purchases**. Omit to fall back to the client-level `request_id`.

### `typescript/src/shared/functions.ts`

`createOrder` and `captureOrder` read `params.request_id` and pass it to `getHeaders({ requestId })`. For `captureOrder` an unset `request_id` defaults to `params.id` (the order id), so a retried capture of the same order is deduped by PayPal without the caller having to think about idempotency — this is the author's point (2) in the issue's "direction of a fix."

## What this does NOT do

- The other 38 `getHeaders()` call sites are untouched. Those are listed in the issue; most are read-side or non-idempotent-API calls. If maintainers want them covered too, I'll follow up — I'd rather land the two that move money first than widen the diff.
- The Python surface is a mirror PR waiting on this one. Same shape, same scope.
- No existing public API is removed. Clients that already set `_context.request_id` keep working exactly as before.

## Verification

- `pnpm run build` passes.
- No regression tests are added by this PR — the repo currently ships `"test": "echo \"Error: no test specified\" && exit 1"`, so a test file would be dead code against today's npm scripts. The behaviour is a direct, verifiable code change:
  - `getHeaders()` without arguments is byte-identical to before.
  - `getHeaders({ requestId })` with a truthy string attaches `PayPal-Request-Id: <that string>`.
  - `getHeaders({ requestId: undefined })` falls through to `_context.request_id`.
- If maintainers would like test infrastructure added, happy to open a separate PR introducing `node:test` (built-in, zero deps) with coverage for these three cases plus the `captureOrder` default-to-order-id behaviour.

## Honesty ledger

- The `captureOrder` default (fall back to order id) is my own call. The issue author suggested it; a maintainer may prefer to keep `request_id` strictly explicit and ship a doc-only default. If so, strip the `?? params.id` line and the behaviour becomes "explicit-only" — same PR, two lines fewer. Happy to adjust.
- I have not run the toolkit against the PayPal sandbox under a dropped-connection retry. The claim is a code-level correctness one; the behavioural evidence remains to be added when sandbox + a timed-out POST can be rehearsed.
- `_context.request_id` has one legitimate use case the author gave weight to — a short-lived client that serves exactly one order — and this PR preserves that.
- No test file in this PR because `typescript/package.json`'s `"test"` script is currently a stub. Adding a test file would be dead code against the npm scripts. Open to a follow-up PR that introduces `node:test`.

## Why this matters

A capture call that times out and is retried against an already-captured order is the single failure mode `PayPal-Request-Id` exists to prevent. The current toolkit makes that header unreachable to the agent framework retrying the call, which is the framework's default behaviour. This PR gives the agent a way to say "this is the same purchase; retry it safely" without touching every call-site in the integrator's code.
