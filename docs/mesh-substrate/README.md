# Mesh substrate — Arbitrum Singapore submission

The on-chain primitive this submission builds on was shipped on 04 Oct 2026 as the Arbitrum Open House Singapore entry.

## Source

- Repository: `KaJota-inc/kajota-arbitrum-singapore`
- Submission HEAD: `9f8fb5e`
- Local clone (development): `~/Documents/kajota-arbitrum-singapore`
- Hosted demo: https://kajota-mesh.vercel.app
- HackQuest project page: `arbitrum-singapore.hackquest.io/projects/Kajota-Mesh`

## What is reused as-is

- `CosellRegistryV2` — the deactivate-only, 2-to-16-recipient listing registry with a sum-to-10000-bps invariant.
- `CosellEscrowV2` — the token-agnostic escrow with the zero-argument `release()`, destination-locked refunds, and zero-dust rounding.
- `AgentIdentityBinding` — the ERC-8004 cross-chain metadata hop that lets a judge correlate an operator EOA to its home-chain attestation.
- `X402DepositFacilitator` — the EIP-3009 gasless pay-in pattern (reused as-is for the PYUSD pair).
- `MockUSDC` with a byte-identical EIP-3009 domain — smoke test and failover payment token.

## What ships new in this repo

- A PYUSD escrow + facilitator pair against Paxos's canonical Arbitrum Sepolia PYUSD at `0x637A1259C6afd7E3AdF63993cA7E58BB438aB1B1` (constructor-level redeploy; no Solidity change needed).
- The PayPal webhook listener that decodes an AP2 Payment Mandate and calls `CosellRegistryV2.register(...)` plus `CosellEscrowV2.deposit(...)` in one atomic server-side flow.
- The Mandate inspector modal (merchant dashboard) that surfaces the raw signed JSON for a judge.

## Verified addresses

See [`lib/mesh/addresses.ts`](../../lib/mesh/addresses.ts) in this repo. Every address was lifted from `deployments/421614.json` in the substrate repo and will be re-verified against Arbiscan during Phase B.

## Deployment plan

Phase A day four:

```bash
# in the substrate repo
pnpm deploy:extensions:arbitrum-sepolia  # redeploys the v2 pair with the PYUSD address
# writes deployments/421614.json with the new entries
```

Then copy the new addresses into `lib/mesh/addresses.ts` here.
