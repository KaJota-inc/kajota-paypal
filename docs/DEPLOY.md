# Deployment — Vercel

Target domain: `kajota-paypal.vercel.app`. The deploy unlocks three WIN_PLAN items at once: the public demo URL that goes into the Devpost submission form (Rule 1 form-factor match), the GitHub Actions runner's `MESH_WEBHOOK_URL` target (playbook move #1), and the `/evidence` page a judge clicks instead of cloning (H0 lesson 4). One-time setup; subsequent deploys are a git push.

## Prerequisites

- The GitHub repo exists at `KaJota-inc/kajota-paypal` (push the local branch first via the commands in the project README).
- A Vercel account for the KaJota-inc organisation (free Hobby tier is sufficient for Phase A).
- An OpenAI API key for the buyer-chat harness. Phase A does not strictly need it; `/chat` renders a placeholder when it is absent.
- A Channel3 API key for product discovery.
- Two Arbitrum Sepolia private keys (orchestration + release-auth) with testnet ETH + PYUSD balances.
- A PayPal Developer Sandbox application for client credentials.

## One-time setup

### 1. Link the GitHub repo to Vercel

```bash
# From the repo root
cd ~/Documents/kajota-paypal
vercel link --project kajota-paypal --yes
```

Or, in the Vercel dashboard: **New Project → Import `KaJota-inc/kajota-paypal` → Framework preset: Next.js → Project name: `kajota-paypal`**.

### 2. Set environment variables

Vercel pulls `.env.example` as a template; fill each value in the dashboard **Settings → Environment Variables** for all three environments (Production / Preview / Development):

| Variable | Scope | Source |
|---|---|---|
| `PAYPAL_CLIENT_ID` | all | PayPal Developer Sandbox app |
| `PAYPAL_CLIENT_SECRET` | all | PayPal Developer Sandbox app |
| `PAYPAL_ENV` | all | `sandbox` for Phase A |
| `PAYPAL_WEBHOOK_ID` | prod, preview | set after creating a webhook via the sandbox dashboard |
| `OPENAI_API_KEY` | all | OpenAI dashboard |
| `OPENAI_MODEL` | all | `gpt-4.1` (or whichever model your account has) |
| `CHANNEL3_API_KEY` | all | trychannel3.com dashboard |
| `ARBITRUM_SEPOLIA_RPC_URL` | all | default public RPC is fine; swap for Alchemy / Infura for higher throughput |
| `MESH_ORCHESTRATION_PRIVATE_KEY` | prod | funded Arb Sepolia EOA |
| `MESH_RELEASE_AUTH_PRIVATE_KEY` | prod | release-auth EOA (must be registered via `CosellEscrowV2.setReleaseAuth`) |
| `NEXT_PUBLIC_APP_URL` | prod | `https://kajota-paypal.vercel.app` |
| `NEXT_PUBLIC_CHAIN_ID` | all | `421614` |
| `NEXT_PUBLIC_EXPLORER_URL` | all | `https://sepolia.arbiscan.io` |

Public (browser-shipped) env vars must stay prefixed `NEXT_PUBLIC_`; private keys and tokens must NOT.

### 3. Deploy

```bash
# First production deploy — triggers a build on Vercel's infra
vercel deploy --prod
```

Or push to `main` on GitHub — Vercel auto-deploys every push to the project's production branch.

### 4. Configure the PayPal webhook

In the PayPal Developer dashboard, create a webhook pointed at `https://kajota-paypal.vercel.app/api/paypal/webhook`. Subscribe to `CHECKOUT.ORDER.APPROVED` and `PAYMENT.CAPTURE.REFUNDED` events. Copy the `WEBHOOK_ID` back into Vercel env.

### 5. Wire the GitHub Actions runner

```bash
# From the repo root
gh secret set MESH_WEBHOOK_URL --body "https://kajota-paypal.vercel.app/api/paypal/webhook"
# optional Phase B shared secret
gh secret set MESH_RUNNER_TOKEN --body "$(openssl rand -hex 32)"
```

The `mesh-runner` workflow then starts firing one real end-to-end execution every six hours. Each run's commit SHA + mandate id lands in the GitHub Actions job summary and (once Phase C ships) in `/evidence`.

### 6. Smoke-test

```bash
# From anywhere
curl -i https://kajota-paypal.vercel.app/api/orchestrator/sessions
# → {"ok":true,"count":0,"sessions":[]}

curl -i -X POST https://kajota-paypal.vercel.app/api/orchestrator/sessions/seed \
  -H "Content-Type: application/json" \
  -d '{"count":3}'
# → {"ok":true,"seeded":3,...}

open https://kajota-paypal.vercel.app/dashboard
# → three stub rows render
```

## Project settings

Vercel reads sensible defaults from `package.json`. The `next.config.ts` already uses the App Router. No `vercel.json` is required for Phase A, but a minimal one locks the Node runtime for the API routes:

```json
{
  "framework": "nextjs",
  "regions": ["iad1"],
  "functions": {
    "app/api/paypal/webhook/route.ts": { "runtime": "nodejs20.x", "maxDuration": 30 },
    "app/api/orchestrator/sessions/route.ts": { "runtime": "nodejs20.x" },
    "app/api/orchestrator/sessions/seed/route.ts": { "runtime": "nodejs20.x" },
    "app/api/ap2/verify/route.ts": { "runtime": "nodejs20.x", "maxDuration": 30 }
  }
}
```

Added to the repo root in a follow-up commit when the first deploy lands.

## Known Phase A limits

- The in-memory session store does not survive cold starts. Phase B swap: Vercel KV (`@vercel/kv` npm package) behind the same `SessionStore` interface in `lib/orchestrator/sessions.ts`.
- The webhook signature verification path calls PayPal's own `/v1/notifications/verify-webhook-signature` endpoint on every request; cold-start overhead adds ~500 ms. Phase B optimisation: cache the OAuth token for its 8-hour lifetime instead of fetching per webhook.
- `/dashboard` on a cold invocation briefly renders the empty state while fetching sessions. React 19 `use()` + a cached Promise is the planned fix, flagged in [`WHAT_WE_GOT_WRONG_FIRST.md`](WHAT_WE_GOT_WRONG_FIRST.md) entry 6.

## Rollback

Vercel keeps every deploy as an immutable Preview URL. To roll back:

```bash
vercel ls kajota-paypal                       # list recent deploys
vercel alias set <previous-deploy-url> \
  kajota-paypal.vercel.app                    # point the alias at the last known good
```

Or, in the dashboard: **Deployments → previous deploy → ⋯ → Promote to Production**.
