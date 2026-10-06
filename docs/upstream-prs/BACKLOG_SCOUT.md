# Upstream backlog scout — 10 candidates ranked for the halfway deadline

_Scouted 06 Oct 2026. Playbook move #3 halfway deadline: 26 Oct (20 days). First-place Keeperhub bursar took three issues from the maintainers' backlog; we need at least one merged by halfway to clear the move._

Methodology: Pulled every open, unassigned issue from `paypal/agent-toolkit` (17 open) and `google-agentic-commerce/AP2` (82+ open). Dropped the ones whose body was spam, empty or outside the toolkit's scope. Ranked the remainder by (merge-probability × capability-add × alignment-with-pitch).

Fix-shape anchors: each row names the file:line the issue cites, the shape of the fix, estimated LOC, and whether the PR is a **capability** add (preferred, playbook move #4) or **correctness** fix. The merge-probability column is a judgement call grounded in: author audit cadence, maintainer engagement in comments, size of blast radius, and whether a fix is already linked in a comment.

---

## Tier 1 — bank-a-merge-fast (open this week)

Small, obvious, uncontroversial. Each one, merged, counts toward the Day-1-of-halfway Keeperhub bursar pattern.

### 1. AP2 #294 — docs link to a nonexistent `specification.md`

- **Author:** @skurzyp (10 Jul 2026, 1 comment)
- **Where:** `agentpaymentsprotocol.info` "view the specification" button points at `/blob/main/docs/specification.md`; the file lives at `/blob/main/docs/ap2/specification.md`.
- **Fix shape:** one-line HTML/markdown edit to the landing page (or `docs/` navigation).
- **LOC:** 1
- **Capability or correctness:** correctness (docs)
- **Merge probability:** HIGH — zero controversy.
- **Draft readiness:** ready to open — needs locating the exact linking file in the docs site repo.

### 2. AP2 #367 — `ReceiptClient` crashes when optional callback is omitted

- **Author:** @sunruize93-cmyk (02 Oct 2026, 0 comments)
- **Where:** `ReceiptClient.verify_receipt()` raises `TypeError: 'NoneType' object is not callable` when `has_reference_in_store_cb` is omitted, despite the parameter defaulting to `None`.
- **Fix shape:** `if callback is not None:` guard around the call site.
- **LOC:** ~3
- **Capability or correctness:** correctness (bug)
- **Merge probability:** HIGH — minimal diff, documented defect, no API change.
- **Draft readiness:** needs the specific line in `code/sdk/python/ap2/sdk/receipt_client.py` (TBD on next scout pass).

### 3. AP2 #372 — delegation hop never verifies when `cnf.jwk` carries `"use"`

- **Author:** @vicentewolde (04 Oct 2026, 0 comments)
- **Where:** `code/sdk/python/ap2/sdk/sdjwt/common.py:77-86`, `ParsedToken.cnf_jwk`. `JsonWebKey.model_validate(cnf['jwk'])` hands jwcrypto an enum value for `use`, which jwcrypto refuses, so every delegation hop silently fails to verify.
- **Fix shape:** unwrap the enum before handing it to jwcrypto, OR serialise via `.model_dump(mode="json")`.
- **LOC:** ~2
- **Capability or correctness:** correctness (bug)
- **Merge probability:** HIGH — fresh, specific, author found the exact line.
- **Draft readiness:** ready; one `model_dump(mode="json")` substitution.

### 4. AP2 #322 — `vct` documentation omits the version suffix

- **Author:** @mh-yu (08 Aug 2026, 0 comments)
- **Where:** schema `const` values are versioned (`mandate.payment.1`, `mandate.checkout.1`) but the adjacent descriptions drop the suffix. A naive reader implements plain-prefix matching and accepts across versions.
- **Fix shape:** docstring + markdown edits in the Pydantic models + the docs.
- **LOC:** ~10 across 3-5 files
- **Capability or correctness:** correctness (docs)
- **Merge probability:** HIGH — @mh-yu is a prolific, respected contributor on this repo.
- **Draft readiness:** ready.

### 5. paypal/agent-toolkit #43 — API domain should be `api-m.(sandbox.)paypal.com`

- **Author:** @gordonchanhk (04 Jun 2025, 0 comments)
- **Where:** `typescript/src/shared/client.ts:50-51` hard-codes `api.sandbox.paypal.com` / `api.paypal.com`. PayPal's own docs recommend the CDN-managed `api-m.*` variant.
- **Fix shape:** two string replacements. Should also mirror into the Python side.
- **LOC:** ~4
- **Capability or correctness:** correctness (operational)
- **Merge probability:** MEDIUM-HIGH — 15 months unmerged suggests low maintainer bandwidth, but the fix is undeniable. Our drafted PR #98 touches the same file, so a bundled follow-up PR after #98 lands is natural.
- **Draft readiness:** ready; depends on #98 to land first to avoid merge conflict.

---

## Tier 2 — security-correctness, 30-100 LOC

Each exposes a real attack surface. Maintainers can push back on scope but cannot argue the bug. Each PR, if merged, is a **named defect in the HOST project** — playbook move #2 bonus.

### 6. AP2 #317 — execution-date constraints pass when the closed mandate omits the field

- **Author:** @mh-yu (07 Aug 2026, 0 comments)
- **Where:** `ExecutionDateEvaluator` in the Python SDK; reads a missing value and immediately returns true, bypassing the open mandate's `not_before` / `not_after` window.
- **Fix shape:** reorder the check — missing `execution_date` on a closed mandate with a `not_before`/`not_after` window on the open side should refuse, not pass.
- **LOC:** ~15 + tests
- **Capability or correctness:** correctness (security)
- **Merge probability:** HIGH — security bug, specific file, author has a track record.

### 7. AP2 #319 — Python KB-SD-JWT verifier accepts tokens missing `aud` or `nonce`

- **Author:** @Silentpartnercoding (08 Aug 2026, 3 comments)
- **Where:** `code/sdk/python/ap2/sdk/sdjwt/kb_sd_jwt.py` `verify()`. `expected_aud: str | None = None` and `expected_nonce: str | None = None` — if either is `None`, the verifier skips the check, accepting malformed tokens.
- **Fix shape:** require both; make the defaults raise rather than skip; add a `strict=False` escape hatch for library callers who truly want to skip (documented).
- **LOC:** ~25 + 2 tests
- **Capability or correctness:** correctness (security)
- **Merge probability:** HIGH — this is in @mh-yu's bug cluster (#313/#326/#342/#319 all target KB enforcement). Maintainers are already engaged.

### 8. AP2 #309 — x402 PSP continues without mandate verification when agent-provider key is unavailable

- **Author:** @giorgioroth (31 Jul 2026, 0 comments)
- **Where:** `merchant_agent_mcp/server.py:663` returns `no_public_key`; two other roles refuse but the settlement role continues. Role inconsistency = security hole.
- **Fix shape:** make the PSP role refuse on `no_public_key` to match the other roles' behaviour.
- **LOC:** ~10
- **Capability or correctness:** correctness (security)
- **Merge probability:** MEDIUM-HIGH — cross-role consistency arguments are compelling.

---

## Tier 3 — design-level, worth a conversation first

Big enough that an unsolicited PR would be rejected. The move is to post a technical comment, build consensus, then PR.

### 9. AP2 #346 — one user consent redeems for multiple payments (replay)

- **Author:** @FutureEnterprises (02 Sep 2026, 1 comment)
- **The claim:** no verifier is required to remember an accepted closed Payment Mandate. Presenting the same user-signed mandate twice yields two completed checkouts and two MPP-signed Receipts whose `reference` is the same mandate hash. The author distinguishes this from #313/#326/#342/#319 (which make `aud`/`nonce` mandatory on KB hops — those don't catch replay because the nonce is agent-chosen).
- **Fix shape:** `MandateUsageStore` with `(mandate_hash → first_accepted_at)` dedupe; make the Credential Provider consult it before issuing a credential; the Shopping Agent spec already forbids re-presentation, so the Credential Provider enforcement is the symmetric defence.
- **LOC:** ~80 + conformance vector + test
- **Capability or correctness:** capability (new primitive — "the double-spend floor")
- **Merge probability:** MEDIUM — requires alignment on where state belongs; the author has sketched the problem thoroughly but no reference impl is linked. **This is exactly our thesis's adjacency** (Mesh's deactivate-only registry is a chain-side analogue of the mandate-usage store). A comment proposing the shape, with Mesh as a reference-implementation data point, lands directly under `google-agentic-commerce`.
- **Draft readiness:** write a comment first, see if a maintainer signals support, then open a PR with the fix + a conformance vector.

### 10. paypal/agent-toolkit #95 — no human gate, no spend bound, LangChain/CrewAI examples enable capture

- **Author:** @AUTHENSOR (29 Aug 2026, 1 comment)
- **Why it's the one most aligned with the Kajota pitch:** this issue's three-point suggested fix — optional approval hook on capture, per-tool spend bounds in `Configuration`, examples that omit `capture` from the default action set — IS the API [[project_kajota_shield]] exposes as `checkAndSpend`. The alignment is uncanny.
- **Fix shape (if we open the PR):**
  1. Add `approval_callback: (ctx) => Promise<"approve" | "deny">` to the Python `PayPalToolkit` constructor; `capture_order` consults it before HTTP.
  2. Add `max_capture_amount` and `payee_allowlist` to `Configuration`; enforced inside the tool handler.
  3. LangChain + CrewAI examples drop `capture: True` from the default `actions` and route a demo capture through the approval hook.
- **LOC:** ~120 across Python + examples
- **Capability or correctness:** capability (new primitive — payment-safety guardrails)
- **Merge probability:** MEDIUM — significant surface change, and PayPal engineering may want to shepherd it internally. BUT: a well-shaped PR with an `approval_callback` default-off (opt-in) is a much smaller ask than redesigning the examples; opt-in-default is the merge-friendly path.
- **Draft readiness:** comment first, offering to send an opt-in PR. **This is also a natural co-marketing play** — Kajota Shield (`project_kajota_shield` memory) ships the same primitive on the Mesh substrate, so we can cite a reference implementation that already exists in testable code.

---

## Our existing targets (status check)

For completeness, where the previously-drafted artefacts stand:

- **paypal/agent-toolkit #98** — drafted at `docs/upstream-prs/paypal-agent-toolkit-98/`. Awaiting user go-ahead to open. Opening this week pulls Tier 1 #5 behind it (same file).
- **paypal/agent-toolkit #96** — SKIPPED. The `@paypal/mcp` source is not in the `paypal` GitHub org; fix has no visible home.
- **AP2 #255 comment** — drafted at `docs/upstream-prs/ap2-255-comment/`. Posting lands us in the hilarl / chopmob-cloud / evidai / AmitabhainArunachala conversation under Google's roof.

---

## Decision matrix

If we open ≥1 PR per week between now and 26 Oct:

| Week | Target | Why |
|---|---|---|
| 06–12 Oct | #98 (open) + #255 (comment) + #294 (new) | Bank the drafted ones + a free-money docs fix |
| 13–19 Oct | #367 + #372 | Two more fresh correctness fixes; small PRs iterate fast |
| 20–26 Oct | #317 OR #319 | A security PR, bigger diff, serves as the halfway-deadline target |
| 27 Oct–03 Nov | #322 + #43 | Doc + domain fixes, bundled after #98 lands |
| 04–11 Nov | #95 comment | Set up the Kajota Shield reference-implementation co-marketing |

Five merged PRs by submission (12 Nov) is the ambitious target. Three is realistic. One is the move #3 floor — and we currently have **zero merged**, so this is a shift from "wrote drafts" to "shipped merges."

---

## Not scouted this round

- `openai/openai-agents-python` (Vercel AI SDK's Python counterpart) — adjacent but not a direct PayPal / AP2 touchpoint.
- `circlefin/stablecoin-evm`, `Paxos/pyusd` — stablecoin repos; unlikely to accept external PRs on short notice.
- `argus-xyz`, `rivier-ai/rivr` — related reference implementations in the AP2 ecosystem; no public issues yet.

Follow-up scout cadence: fresh pass every Monday morning so new issues enter the triage before they age.
