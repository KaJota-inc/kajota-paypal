# Upstream PR draft — `google-agentic-commerce/AP2` #372

**Issue:** [google-agentic-commerce/AP2#372](https://github.com/google-agentic-commerce/AP2/issues/372) — @vicentewolde, "A delegation hop never verifies when cnf.jwk carries 'use' (ParsedToken.cnf_jwk hands jwcrypto an enum)."

**Status:** patch drafted, PR not yet opened. Opening is a user-approved step.

**Why this issue:** fresh (04 Oct 2026), unassigned, zero comments, exact file:line evidence, two-line Python fix. Playbook Tier 1 — bank-a-merge-fast per [`BACKLOG_SCOUT.md`](../BACKLOG_SCOUT.md). This is our second drafted upstream artefact after `paypal/agent-toolkit#98`; opening both pushes playbook move #3 past the "drafts" state.

## Shape of the fix

`ParsedToken.cnf_jwk()` rebuilds the holder key via Pydantic and then hands it to `jwcrypto.JWK`. The intermediate step `.model_dump(exclude_none=True)` returns native Python enum instances (`KeyUse.sig`, `KeyType.ec`) rather than their JSON-serialised string values. jwcrypto refuses the enum. Every delegation hop whose JWK carries a `use` claim silently fails to verify.

The one-line fix passes `mode="json"` to `model_dump`, which serialises enum fields to their underlying string values — exactly what jwcrypto expects.

## How to apply the patch

```bash
# 1. Fork and clone
gh repo fork google-agentic-commerce/AP2 --clone
cd AP2

# 2. Create a branch
git checkout -b fix/parsed-token-cnf-jwk-enum-372

# 3. Apply the patch
git apply ~/Documents/kajota-paypal/docs/upstream-prs/ap2-372/patch.diff
```

```bash
# 4. Verify with the AP2 test suite
cd code/sdk/python && uv run pytest ap2/tests/
```

```bash
# 5. Commit + push + open PR
git add -A && git commit -m "fix(sdjwt): serialise cnf.jwk enum fields for jwcrypto (#372)"
git push -u origin fix/parsed-token-cnf-jwk-enum-372
gh pr create --repo google-agentic-commerce/AP2 \
  --title "fix(sdjwt): serialise cnf.jwk enum fields for jwcrypto (#372)" \
  --body-file ~/Documents/kajota-paypal/docs/upstream-prs/ap2-372/PR_DESCRIPTION.md
```

## Files in this directory

- `README.md` — this file
- `PR_DESCRIPTION.md` — the PR body, written in the audit cadence @vicentewolde uses
- `patch.diff` — unified diff against `google-agentic-commerce/AP2@e1ea56d` (the commit the issue references)
