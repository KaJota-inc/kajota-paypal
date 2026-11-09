# UPSTREAM PR — `google-agentic-commerce/AP2` (issue #372)

**Verdict: DO NOT OPEN as a PR. Three competing PRs already open. Comment on the best one.**

Scanned the live upstream on 2026-11-09. Our drafted patch is a semantic dupe of fixes already submitted by three different contributors over a two-month window. Opening ours now is PR-farming.

---

## What we drafted (Oct 6, 2026)

`ParsedToken._build_jwk` serialises `cnf.jwk` with `mode="json"` so Pydantic enum fields (`KeyUse`, `KeyType`, `KeyOperation`) are dumped as string values rather than enum objects — which is what jwcrypto's `JWK` constructor accepts.

```python
# code/sdk/python/ap2/sdk/sdjwt/common.py
jwk_model = JsonWebKey.model_validate(cnf['jwk'])
- return JWK(**jwk_model.model_dump(exclude_none=True))
+ return JWK(**jwk_model.model_dump(exclude_none=True, mode="json"))
```

## What's already open upstream

| PR | Author | Date | Shape |
|---|---|---|---|
| **`AP2#385`** | @aksharprabhudesai | 2026-10-18 | *"dump JsonWebKey in json mode so enums are serialized as strings"* — direct dupe of our one-line fix |
| **`AP2#383`** | @aeoess | 2026-10-17 | *"dump cnf.jwk in JSON mode so keys with 'use' verify"* — same fix, named after the specific failure case (`use`) |
| **`AP2#355`** | @harkanwalbedi | 2026-09-11 | *"serialize pydantic models in json mode to support enum claims in mandates"* — broader generalisation of the same fix |

Three PRs. Same patch. Two months and counting. Issue #372 is **saturated**.

## Why we're not opening ours

- Our one-line diff is byte-identical to #385's one-line diff. Submitting it would be a verbatim dupe.
- A fourth PR on the same one-line fix reads as unaware or farming — neither is a signal we want.

## What we do instead

**Post a comment on `AP2#385`** supporting the fix with our concrete integration context — *"our TS verifier at `KaJota-inc/kajota-paypal/lib/ap2/` hit the same divergence in a Phase-A spike (see HARD_PARTS scar #—)"* — as a reviewer affirmation. That's a positive voice on a stalled PR, not a competing claim.

```bash
gh issue comment 385 --repo google-agentic-commerce/AP2 \
  --body "Hit the same divergence in our TypeScript AP2 verifier on \`KaJota-inc/kajota-paypal\` — the enum-vs-string shape silently passed Pydantic validation but failed jwcrypto key build. +1 on landing this; our Phase B SD-JWT-VC path depends on it being the canonical fix."
```

## State machine update

| # | Target | Was | Now |
|---|---|---|---|
| 3 | `AP2#372` | DRAFTED | ❌ RETIRED — dupe of #385 (@aksharprabhudesai), #383 (@aeoess), #355 (@harkanwalbedi) |

Related: [[feedback_fact_check_public_posts]], [[feedback_winner_teardown_keeperhub]] §3.
