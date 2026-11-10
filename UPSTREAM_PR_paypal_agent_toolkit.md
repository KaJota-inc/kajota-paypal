# UPSTREAM PR — `paypal/agent-toolkit` (issue #98)

**Verdict: DO NOT OPEN as a PR. Comment on #108 instead.**

Scanned the live upstream on 2026-11-09. Our drafted patch (`docs/upstream-prs/paypal-agent-toolkit-98/patch.diff`) is a semantic dupe of an already-open PR. Opening a second PR for the same fix is maintainer noise, not playbook move #3 signal.

---

## What we drafted (Oct 6, 2026)

Per-call `requestId` override on `getHeaders()` so each `create_order` / `capture_order` can carry its own idempotency key:

```ts
async getHeaders(overrides?: { requestId?: string }): Promise<Record<string, string>> {
  // ... Content-Type, Authorization ...
  const requestId = overrides?.requestId ?? this._context.request_id;
  if (requestId) headers['PayPal-Request-Id'] = requestId;
  // ...
}
```

## What's already open upstream

- **`paypal/agent-toolkit#108`** by @PRIEST099 — *"Send PayPal-Request-Id per call for create_order, capture_order and create_refund (fixes #98)"* — opened 2026-10-06, updated 2026-10-29. Same per-call override design. Ships `jest`-based `request-id.test.ts` with 101 lines of coverage, extends `jest.config.ts` with transpile-only mode, wires `npm test` to `jest`. Covers TypeScript side.
- **`paypal/agent-toolkit#124`** by @NovaCorpAI — *"python: send PayPal-Request-Id per call (create_order, capture_order, create_subscription, send_invoice)"* — opened 2026-11-08. Python half of the same fix.

Between the two, issue #98 is **fully covered** by open PRs waiting for maintainer review.

## Why we're not opening ours

- Playbook move #3 counts PRs **merged by the halfway point**, not PRs opened.
- A third PR on the same issue by a third contributor is PR-farming, not genuine engagement.
- Keeperhub teardown §3: *"Pick a change the maintainers can merge fast. A rule whose *message* makes a claim ... invites rounds of correction."* A dupe is the worst version of this — it invites the maintainer to pick between contributors.

## What we do instead

**Post an engagement comment on #108** (and optionally on #124). Author: `bori7` / `KaJota-inc`. Body suggestion saved below. One-sentence rationale: we are not the author, we're adopters of the pattern, and our Nov 12 submission consumes the per-call override via the `request_id` field on every `create_order` our webhook emits. That is net new context the reviewer can use.

```bash
gh issue comment 108 --repo paypal/agent-toolkit --body-file UPSTREAM_PR_paypal_agent_toolkit.md.comment
```

See the file `UPSTREAM_PR_paypal_agent_toolkit.md.comment` for the comment body (if landed separately).

## Novel PayPal contribution PR — LANDED

**`paypal/agent-toolkit#126` opened 2026-11-10 as DRAFT.** Proposes `request_mesh_fanout_quote` as the 43rd tool — a bridge tool that lets an agent request the deterministic N-party split of a PayPal order's proceeds before on-chain settlement, bound to an AP2 Payment Mandate id. Capability-shaped (move #4): *"X could not do Y at all; now it can."*

- URL: https://github.com/paypal/agent-toolkit/pull/126
- Diff: `typescript/src/shared/mesh.ts` (new module) + 1 line in `tools.ts` + `docs/MESH_FANOUT_DESIGN.md` (design doc with hard-parts appendix, prior-art disclosure, and a 5-level Scope Options list)
- Cites `#107` (@rushabhT3's Payouts) as complementary, not competing
- Cites the 5 real settlements fired on 2026-11-10 as evidence the primitive works
- Author: KaJota-inc

## Issue #43 (related — `api-m.` domain)

Same dupe pattern: **`paypal/agent-toolkit#99`** by @GANESH-NADKARNI since Sept 5 already fixes this. Do not open our draft. Our `docs/upstream-prs/paypal-agent-toolkit-43/patch.diff` is retired as of 2026-11-09.

## State machine update (append to `docs/upstream-prs/STATUS.md`)

| # | Target | Was | Now |
|---|---|---|---|
| 1 | `paypal/agent-toolkit#98` | DRAFTED | ❌ RETIRED — dupe of #108 (@PRIEST099) + #124 (@NovaCorpAI) |
| 2 | `paypal/agent-toolkit#43` | DRAFTED | ❌ RETIRED — dupe of #99 (@GANESH-NADKARNI) |

Related: [[hackathon_winning_playbook]] §3 + §4, [[feedback_fact_check_public_posts]], [[feedback_winner_teardown_keeperhub]] §3.
