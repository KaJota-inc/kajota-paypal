# Vercel env-var checklist

The six UI surfaces on `https://kajota-paypal.vercel.app` already render (all 200). The API routes throw at request time without env vars — judges opening `/chat` or hitting `/api/paypal/webhook` from a sandbox webhook will see failures.

**Rule:** per [[feedback_credentials_in_chat]], **do NOT paste credential values into chat.** Run each command below locally; Vercel prompts you for the secret in its own interactive shell, and the value never traverses this conversation.

---

## Run from the worktree

```bash
cd /Users/oluwaboriola/Documents/kajota-paypal/.claude/worktrees/paypal-nov12-ship-617d19
```

The project is already `vercel link`ed to `kajotadev-1226s-projects/kajota-paypal`. Re-link is a no-op if you're in the same dir.

## The twelve env vars (in order of blast radius)

### Tier A — required for the webhook demo path to work on video

```bash
vercel env add PAYPAL_CLIENT_ID production
vercel env add PAYPAL_CLIENT_SECRET production
vercel env add PAYPAL_WEBHOOK_ID production
vercel env add PAYPAL_ENV production                 # paste: sandbox
```

| Var | Source | Required by |
|---|---|---|
| `PAYPAL_CLIENT_ID` | https://developer.paypal.com/dashboard/applications/sandbox | `/api/paypal/webhook`, `/api/paypal/checkout` |
| `PAYPAL_CLIENT_SECRET` | same page | same |
| `PAYPAL_WEBHOOK_ID` | PayPal Developer → Webhooks → your app | `/api/paypal/webhook` signature verify |
| `PAYPAL_ENV` | literal `sandbox` | `lib/env/index.ts` branch |

### Tier B — required for the AP2 verifier + Channel3 discovery on `/chat`

```bash
vercel env add AP2_ISSUER_DID production
vercel env add AP2_ISSUER_PRIVATE_KEY production
vercel env add CHANNEL3_API_KEY production
vercel env add OPENAI_API_KEY production
```

| Var | Source | Required by |
|---|---|---|
| `AP2_ISSUER_DID` | our own `did:web` or demo DID | stub-signed Mandates in the sandbox |
| `AP2_ISSUER_PRIVATE_KEY` | PEM or JWK | `lib/ap2/verify.ts` |
| `CHANNEL3_API_KEY` | https://trychannel3.com/signup — free 1,000/mo | `/chat` SSE agent discovery tool |
| `OPENAI_API_KEY` | existing user key | Vercel AI SDK on `/chat` |

### Tier C — required for the on-chain tail (PYUSD escrow release)

```bash
vercel env add MESH_RELEASE_AUTH_PRIVATE_KEY production
vercel env add MESH_ORCHESTRATION_PRIVATE_KEY production
```

| Var | Source | Required by |
|---|---|---|
| `MESH_RELEASE_AUTH_PRIVATE_KEY` | funded Arb Sepolia EOA registered as `releaseAuth` on `CosellEscrowV2` | `release(depositId)` tx |
| `MESH_ORCHESTRATION_PRIVATE_KEY` | funded Arb Sepolia EOA holding PYUSD | `deposit(listingId, grossAmount)` tx |

⚠️ Private keys only. No mainnet keys. Sandbox-chain-id guardrail (scar #17) blocks mainnet by default (`NEXT_PUBLIC_CHAIN_ID=421614`).

### Tier D — optional (overrides)

```bash
vercel env add PAYPAL_MCP_URL production            # if PayPal sandbox exposes an MCP endpoint
vercel env add OPENAI_MODEL production              # default gpt-4.1
vercel env add AP2_VERIFY_SKEW_SECONDS production   # default 300
```

## Verify after adding

```bash
cd /Users/oluwaboriola/Documents/kajota-paypal/.claude/worktrees/paypal-nov12-ship-617d19 && vercel env ls production
```

Then **redeploy** so the new env lands on a fresh build:

```bash
cd /Users/oluwaboriola/Documents/kajota-paypal/.claude/worktrees/paypal-nov12-ship-617d19 && vercel deploy --prod --yes
```

Smoke test:

```bash
curl -s -o /dev/null -w "HTTP %{http_code}\n" https://kajota-paypal.vercel.app/api/orchestrator/sessions
# Expect 200. If 500, check `vercel logs` for the first missing env var.
```

## Priority ordering for a time-boxed sitting

- **30-minute version** — Tier A only. Enables the PayPal webhook to accept sandbox orders. Judges watching the video see the handoff.
- **60-minute version** — Tier A + B. Enables the full `/chat` SSE agent trace and the Channel3 affiliate discovery leg.
- **120-minute version** — Tier A + B + C + first on-chain release. Enables one real settlement row on `/evidence` before recording.

Tier A alone is enough to ship a credible submission. Tiers B and C raise the demo-video quality but are not Devpost-required.

Related: [[feedback_credentials_in_chat]], [[project_paypal_ai_hackathon]].
