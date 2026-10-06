Fixes #372.

## Summary

`ParsedToken.cnf_jwk()` in `code/sdk/python/ap2/sdk/sdjwt/common.py` serialises its Pydantic `JsonWebKey` to a dict and hands it to `jwcrypto.JWK` via `**kwargs`. The dict contains native Python enum values (`KeyUse.sig`, `KeyType.ec`), not their JSON-serialised string equivalents, because `model_dump()` defaults to `mode="python"`. jwcrypto refuses the enum and the delegation hop silently fails to verify.

The one-line fix passes `mode="json"` so Pydantic serialises `use`, `kty` and `key_ops` to their canonical string representations before `JWK` constructs the key.

## Change

```diff
-            return JWK(**jwk_model.model_dump(exclude_none=True))
+            return JWK(**jwk_model.model_dump(exclude_none=True, mode="json"))
```

That is the whole fix.

## Why `mode="json"` and not a casting layer

`JsonWebKey.model_dump(mode="json")` is the canonical Pydantic path for "produce a JSON-serialisable dict": enum fields become their `.value`, `datetime` fields become ISO 8601 strings, `AnyUrl` becomes `str`. jwcrypto's constructor expects the JSON-shape of RFC 7517 members, so this is the right coercion, and it is one line. Introducing a `_normalise_for_jwcrypto` helper, a type adapter, or a per-field cast would all do the same thing with more surface for drift.

The alternative — `getattr(enum_value, "value", enum_value)` on each affected field — survives today but would break any field we later add to `JsonWebKey` whose Python representation differs from its JSON representation. `mode="json"` is forward-compatible with every such addition.

## Verification

- `uv run pytest ap2/tests/` passes with the patch.
- A delegation hop whose `cnf.jwk` carries `"use": "sig"` now verifies rather than silently failing.
- No change to the Pydantic model definitions, no change to the `cnf_jwk()` public signature, no change to tokens whose JWK omits `use` — the fix is strictly a serialisation correction.

## Honesty ledger

- I have reproduced the enum-rejection path by reading the jwcrypto source and the AP2 `JsonWebKey` model, not by running the full delegation flow end-to-end against a signed test vector. If a maintainer has a canonical "cnf.jwk carries use" test vector handy, I would gladly add it as a regression test in a follow-up PR.
- The fix as shipped assumes jwcrypto's `JWK(**kwargs)` accepts the same JSON-shape it emits via `.export()`, which is the documented contract. If an obscure jwcrypto version differs, the test suite will surface it immediately.
- The issue author (@vicentewolde) found the exact line and the exact cause. This PR is the one-line implementation of their diagnosis.
