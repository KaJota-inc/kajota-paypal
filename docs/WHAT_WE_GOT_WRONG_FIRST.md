# What we got wrong first

Playbook move #7 is written as a submission requirement, not a bonus: _"a 'what we got wrong first' section, ≥2 real bugs, each with what caught it. Reads as mastery, not weakness. Far past our current candour."_ Six entries so far, in build order.

---

## 1. The AP2 Payment Mandate schema we guessed was substantially wrong

**What we built first.** `lib/ap2/types.ts` had a `PaymentMandateSchema` with `vct: "mandate.payment"`, `transaction_id: base64url(hash(checkout_jwt))`, inline `issuer_did` / `holder_did`, and a `cart.payees: Payee[]` array of 2–16 role-tagged recipients.

**What the real schema is.** We pulled the canonical Pydantic model from `code/sdk/python/ap2/models/mandate.py` on `google-agentic-commerce/AP2`. `PaymentMandate` carries a `payment_mandate_contents` object with exactly one `merchant_agent` identifier and one `payment_details_total`, wrapped in an SD-JWT-VC via `user_authorization`. There is no `vct` field. There is no `cart.payees` array. Multi-payee attribution is NOT an AP2 primitive — it is precisely the gap Mesh fills, which the correction *sharpens* rather than invalidates.

**What caught it.** A `gh api repos/google-agentic-commerce/AP2/contents/code/sdk/python/ap2/models/mandate.py` fetch during the Phase A schema spike (commit `42de65c`). Four web searches earlier had returned descriptive summaries that passed the eye-test; only the Pydantic source showed the real shape.

**Lesson.** For a protocol whose reference implementation is public, read the model file first and the marketing copy second. The commit message of `42de65c` carries the primary record.

---

## 2. `LayoutProps` compiles under `next dev` but not under `tsc --noEmit`

**What we built first.** `app/layout.tsx` used `LayoutProps<"/">`, straight from the create-next-app scaffold.

**What broke.** `pnpm exec tsc --noEmit` returned `error TS2304: Cannot find name 'LayoutProps'`. The scaffold's `tsconfig.json` includes `.next/types/**/*.ts`, which only exists after `next dev` or `next build` runs once to generate the route types. CI typecheck against a cold checkout would always fail.

**What caught it.** Our Phase A quality gate: `pnpm exec tsc --noEmit` before every commit.

**Fix.** Switched to an explicit prop shape `{ children: React.ReactNode }`. Committed to the pattern across any route file — never rely on scaffold-only generated types for portability.

---

## 3. `openai` 4.86 pins `zod@^3.23.8`; we installed `zod@4`

**What we built first.** `pnpm add zod` picked up `zod@4.6.5`.

**What broke.** `@paypal/agent-toolkit` → `openai` → `zod@^3` peer warning on every install.

**What caught it.** The install output itself. Not a build-time error — a quiet peer warning that would compound into subtle runtime shape mismatches when any tool-use call shuttled zod schemas between the two.

**Fix.** `pnpm add zod@^3` → pinned at `3.25.76`. Documented in [`.env.example`](../.env.example) via the dependency list, visible on `grep zod package.json`.

**Lesson.** Peer dependency warnings in LLM / payment libraries are not noise — they are future runtime bugs.

---

## 4. The scaffold's `.gitignore` masks `.env.example`

**What we built first.** `cp .env.example .env.local` + `git add -A` — and `.env.example` was invisible to git.

**What broke.** The Devpost brief requires that the submission runs from a cold clone. Without a tracked `.env.example`, a judge couldn't configure the app.

**What caught it.** `git status --short` showed only two tracked files staged where we expected six. One `check-ignore -v .env.example` revealed the mask.

**Fix.** `.gitignore` gained a `!.env.example` negated-pattern line. Committed in `8dadd8a`.

**Lesson.** Verify the `git status` output against the mental model of "what should be staged" before every commit — the diff you don't see is the one that bites.

---

## 5. `tsx` emits CJS by default, which refuses top-level `await`

**What we built first.** The adversarial scripts in `scripts/fail/*.ts` used top-level `await` for `generateKeyPair("ES256")`, `SignJWT().sign()`, and `verifyCartMandate(...)`.

**What broke.** `pnpm reproduce:fail` on three of five scripts with `ERROR: Top-level await is currently not supported with the "cjs" output format`.

**What caught it.** The runner itself (`scripts/fail/_runner.ts`) — gates in `missed` state surfaced in red, with the esbuild transform error inline.

**Fix.** Wrapped each affected script in `async function main() { ... }` with `main().catch(err => process.exit(1))`. Documented in commit `50d2c80`.

**Lesson.** The runner's exit code was the leverage; a prose README would have let the bug ship.

---

## 6. The merchant dashboard's `useEffect(() => refresh(), [])` is a React 19 anti-pattern

**What we built first.** `useEffect` on mount calling `refresh()`, which sets state.

**What broke.** `pnpm lint` under `eslint-config-next@16.3.8` returned `Error: Calling setState synchronously within an effect can trigger cascading renders (react-hooks/set-state-in-effect)`. Next.js 16 runs a stricter React 19 rule than React 18 shipped.

**What caught it.** `pnpm lint` in the Phase A quality gate.

**Fix.** `// eslint-disable-next-line react-hooks/set-state-in-effect` for the mount-fetch pattern specifically, documented as the one place we trade the rule for the pattern. Phase B swap to `use()` + a cached Promise or TanStack Query is a planned follow-up — the comment names it so a reader doesn't inherit the disable.

---

## 7 (bonus, from the Mesh substrate — carried forward honestly)

**What we got wrong on the Arbitrum substrate.** The deploy-time `KNOWN_MAINNET_IDS` set initially had chain id `4663` instead of the Robinhood testnet's `46630` — an off-by-10× that would have let a mainnet deploy slip through if we had typed the wrong chain. Caught by a `deploy.ts` pre-flight check that compared the configured chain id against the mainnet set and threw. Documented in the Arbitrum Singapore substrate's `scripts/deploy.ts`.

**Why disclose a bug from a different repo.** The first-place Keeperhub submission disclosed three defects in its own merged upstream work within two days. Honest substrate inheritance beats fictional substrate purity.

---

## How we maintain this list

Every mistake surfaced by the quality gates (`pnpm typecheck`, `pnpm lint`, `pnpm reproduce`, `pnpm reproduce:fail`, `pnpm build`) that costs more than fifteen minutes to fix lands here, in the voice above, before the fix commit. The list is additive; retracted entries get a strike-through, never deletion.
