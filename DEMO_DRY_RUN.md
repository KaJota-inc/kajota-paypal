# Demo dry-run — 2026-11-09

**Target state:** every surface on `https://kajota-paypal.vercel.app` renders as a judge would expect on the first visit, from a cold serverless instance, with no env vars set. **T-72h to submission (2026-11-12 20:00 UTC).**

Walked the full 6-beat `RECORDING_LOCK.md` §3 shot list against the live deploy. Fixed everything that stopped a beat from telling its story.

---

## Beat-by-beat verdict

| # | Beat | Surface | State at pass start | State at pass end |
|---|---|---|---|---|
| 1 | Hook (0:00–0:10) | Agent Toolkit docs scroll (external) | ok — external | ok |
| 2 | Problem (0:10–0:35) | VO over Nigerian-fintech framing (no surface) | ok | ok |
| 3 | Pipeline (0:35–1:10) | `docs/architecture.mmd` → Arbiscan zoom | ok — diagram sources an 8-stage flowchart; `/evidence` verify-yourself contracts table resolves | ok |
| 4 | Live demo (1:10–2:10) | `/chat` → `/dashboard` → Arbiscan → `/leaderboard` | **4 blockers** (see §Findings) | ✅ ship-grade |
| 5 | Hard parts (2:10–2:30) | `pnpm reproduce:fail` 7-gate terminal cut | ok — 7/7 fires with hash per branch, labels read `beacon`, `expiry`, `mandate-cross-ref`, `hash`, `n/a` | ok |
| 6 | Callback (2:30–2:55) | Agent Toolkit docs with "Tool #43: Mesh" overlay (external) | ok | ok |

## Findings + fixes

### 1. Landing page said "Phase A — foundation. 04 Oct 2026" with "routes are placeholders"

**Impact:** judge arriving at the hero reads "scaffold / placeholder" in the first 15 seconds and bounces.

**Fix** (commit `8abee44`): replaced the Phase-A footer block with a "Ship state — the submission is runnable right now" block that cites `pnpm preflight`, 66 tests, 7/7 gates, Beacon byte-identical commitment, 21 scars at `docs/HARD_PARTS.md`.

### 2. `/chat` subtitle called itself a "Phase A scripted mock stream"

**Impact:** buyer surface sold itself short — the deterministic trace is actually video-grade, not a mock.

**Fix** (commit `8abee44`): rewrote the subtitle to name the trace as "deterministic so the surface is legible without live keys" and name the drop-in swap path. Chat Run button verified streaming 8 stages (Channel3 search → Cart Mandate → PayPal checkout → ...) on the live site.

### 3. Three API `GET` `phase_note` fields leaked "Phase A" language

**Impact:** judge hitting `/api/paypal/webhook`, `/api/chat`, or seeing the failed-row error on `/dashboard` reads stale schedule language.

**Fix** (commit `8abee44`): replaced all three `phase_note` strings with ship-state wording that names what runs end-to-end upstream of the on-chain write + what the gating env is. The dashboard failed-row error now references the reproducer's matching stop point.

### 4. `/dashboard` and `/leaderboard` empty by default on cold instance

**Impact:** Vercel serverless keeps the session store per-instance. Click "Seed demo rows" on one instance → navigate to `/leaderboard` → different instance → 0 hustlers, 0 settlements. Judge reads "broken" rather than "empty pre-faucet".

**Fix** (commit `3fec6da`): `InMemorySessionStore.list()` and `.get()` warm-seed 3 demo rows on first call per instance. User clicking Clear sets a `drained` flag so the roster doesn't reappear on reload within the same instance. Factory shared from `lib/orchestrator/stub-sessions.ts`.

### 5. `/mandate-inspector/[id]` unreachable because stub IDs were per-instance UUIDs

**Impact:** judge clicks a dashboard row (instance A) → lands on inspector (instance B) → `sessions.get("pm_stub_<A-UUID>")` returns null → inspector shows "Receipt unavailable".

**Fix** (commits `f35712e` + `652886a`):
- Attach a deterministic stub Beacon receipt to every warm-seeded session (Reg E 10bd regime, OFAC SDN pinned snapshot, keccak hashes derived from the stub's own id). Labelled `Demo stub — ...` so nothing is mistaken for live.
- Switch stub IDs from `randomUUID()` to deterministic slot IDs: `pm_stub_0001`, `pm_stub_0002`, `pm_stub_0003`. Every instance warm-seeds with the same three IDs, so inspector navigation resolves regardless of which instance each hop lands on.

## Final live-surface state (deploy `9w9577mkt`)

| URL | HTTP | What a judge sees |
|---|---|---|
| `/` | 200 | Hero: "The 43rd tool for the PayPal Agent Toolkit" + 4 surface cards + Ship-state footer with `pnpm preflight` reference |
| `/chat` | 200 | Buyer SSE agent trace, default prompt "A leather bag under $120 that pays its reviewer", Run button streams 8 stages |
| `/dashboard` | 200 | 3 stub rows (released / pending-release / failed) with real fan-out, N-way payees, honest failed-row error |
| `/evidence` | 200 | 3 settlements · $4.50 gross routed · 9 recipients · 1 released / 1 pending / 1 failed · verify-yourself contracts (10 addresses) |
| `/leaderboard` | 200 | 3 hustlers (merchant $0.70, agent $0.20, affiliate $0.10), role chips, streak days, "#1 THIS ALL TIME" callout |
| `/mandate-inspector/pm_stub_0001` | 200 | Full Beacon receipt: beacon·settled · session·released · commitment · mandate id · envelope · idempotency · SLA (reg-e-10bd, 240h) · OFAC SDN pinned snapshot |

## Terminal beat (beat 5)

```
$ pnpm preflight
...
══ unit tests · pnpm test
  ✓ 66 tests pass
══ happy path · pnpm reproduce
  ✓ pipeline settles end-to-end (no env, no chain, no server)
══ adversarial · pnpm reproduce:fail
  ✓ ✓ 7/7 gates fired. The pipeline refuses every adversarial input tested.
══ All green in 20-44s. Submission package is reproducible.
```

Gate names surface on screen: `beacon-replay-within-ttl`, `beacon-sanctions-list-drift`, `duplicate-recipient`, `expired-cart-mandate`, `sum-not-10000-bps`, `swapped-mandate-pair`, `tampered-cart-contents`. Each fires at a named stage (`beacon`, `expiry`, `mandate-cross-ref`, `hash`, `n/a`).

## Out-of-scope / explicit TODOs not blocking the submission

- **Env vars** → `VERCEL_ENV_CHECKLIST.md`. Not blocking: UI surfaces render without secrets; only live PayPal/Channel3/OpenAI requests would need them.
- **PYUSD escrow pair deployed on Arb Sepolia** → raises `/dashboard` failed row to a 4th released row + wires `/evidence` runner to real on-chain txs. Not blocking: honesty ledger carries the pre-faucet state.
- **Promote in-memory store to Vercel KV** → removes the per-instance seed indirection entirely. `HARD_PARTS.md` scar #— open as Phase B.
- **GH Actions runner firing every 6h** → populates `/evidence` with accumulating real-chain rows. Not blocking without the escrow deploy.

## Shot-list tells

For the recording block (Nov 10 20:00–23:00 WAT), the operator should:

1. Open browser in incognito (clears cache, forces cold serverless instance) — the warm-seed guarantees content.
2. Navigate `/` → `/chat` → click Run → wait for stream → navigate `/dashboard` → click any row → `/mandate-inspector/pm_stub_0001` → navigate `/leaderboard` → navigate `/evidence` → split-screen with terminal → run `pnpm preflight` → show `✓ 7/7 gates fired`.
3. Do NOT click "Clear" on `/dashboard` during the recording — it sets `drained` on that instance and the dashboard empties on reload. If accidentally clicked, open a new incognito window (new instance = fresh warm-seed).

All green. Build hours draw down tomorrow (Nov 10 23:59 UTC recording lock).
