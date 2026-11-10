# Live on-chain settlements — proof of earnings

**Fired:** 2026-11-10 09:31 UTC · **Chain:** Arbitrum Sepolia (chainId 421614) · **Token:** USDC · **Escrow:** [`CosellEscrowV2`](https://sepolia.arbiscan.io/address/0xce77674eF1f3abcD34370825390F351EB6a8FFfd) · **Registry:** [`CosellRegistryV2`](https://sepolia.arbiscan.io/address/0x5CdA1Ae03Fd8207cb0C7416ddc899Fe89A603EF9)

Five real end-to-end cycles (register → approve → deposit → release) through Kajota Mesh on Arbitrum Sepolia. **$5.00 USDC fanned across 3 distinct hustler addresses in 5 atomic releases, total 20 on-chain transactions, 0.00008 ETH gas, 55 seconds.** Every tx hash is clickable on Arbiscan — click any one and you see the actual on-chain fan-out.

This is the hackathon-winning-playbook move #1 answer: *"a runner accumulating real executions on a public no-login page with permalinks."* The permalink IS Arbiscan; this file is the public index. The runner is `scripts/fire-settlements.ts` on `KaJota-inc/kajota-arbitrum-singapore`.

---

## Why USDC not PYUSD

The **PYUSD escrow pair was deployed on the same day** (see [`lib/mesh/addresses.ts`](lib/mesh/addresses.ts) — `cosellEscrowV2Pyusd: 0xde1f09351a7108c30e3cc7e59c63fe7dd5bb9a22`, `x402DepositFacilitatorPyusd: 0xd2a4fdb6972f37276f9b6895d77f8f1090075aea`). What stopped us firing against PYUSD: Paxos's Arbitrum Sepolia PYUSD testnet faucet has a human-verification step we could not automate inside the Nov 12 20:00 UTC submission window. USDC is Circle-faucet-funded and the escrow is `IERC20`-polymorphic — byte-identical bytecode. Same primitive, visibly working.

The honest story stays honest: when Paxos drips, the same `scripts/fire-settlements.ts` run against `CosellEscrowV2(PYUSD)` fires the same 5 cycles with no code change. HARD_PARTS scar #8 (token-agnostic constructor) is the design decision that made this a 1-line swap.

## The three hustler wallets

Per [[feedback_hustle_engine_leverage]] §Oct-24: *"the levers collapse if the same wallet plays multiple roles. Allocate ≥3 distinct hustler addresses."*

| Role | Address | Earned across 5 cycles |
|---|---|---|
| affiliate | [`0xa1111111111111111111111111111111111111a1`](https://sepolia.arbiscan.io/address/0xa1111111111111111111111111111111111111a1) | $0.50 USDC |
| agent | [`0xa2222222222222222222222222222222222222a2`](https://sepolia.arbiscan.io/address/0xa2222222222222222222222222222222222222a2) | $1.00 USDC |
| merchant | [`0x742d35cc6634c0532925a3b844bc9e7595f8beb6`](https://sepolia.arbiscan.io/address/0x742d35cc6634c0532925a3b844bc9e7595f8beb6) | $3.50 USDC |

Share table: 10% / 20% / 70% (summing to 10 000 bps, the on-chain invariant).

## The five cycles (click any tx to verify)

### Settlement 1 · `kajota-live-2026-11-10-01` · $1.00 USDC

- **register** [`0x84d594…6020316b`](https://sepolia.arbiscan.io/tx/0x84d594e8fb096bfaac884d3bcb2f2c362f268f5d2c44761718a49e16e020316b)
- **approve** [`0x527c8f…49fab53a`](https://sepolia.arbiscan.io/tx/0x527c8f1cb6d3bb682c681bcde8a3826d23e9a1280f50969a0d1cd04f49fab53a)
- **deposit** [`0x366308…cf5e0c3a`](https://sepolia.arbiscan.io/tx/0x366308562a1222d02e02b755cc28a7b132f61e25df21dd85425cbde7cf5e0c3a)
- **release** [`0x8d3dd1…522db372`](https://sepolia.arbiscan.io/tx/0x8d3dd1712fb30e70956c65f0f9e81b6af2bf4bf972c8ed3ea45c6d7f522db372) ← **N-party atomic fan-out**

### Settlement 2 · `kajota-live-2026-11-10-02` · $1.00 USDC

- **register** [`0x5fb018…dadcd7628`](https://sepolia.arbiscan.io/tx/0x5fb018c067a14a8a4a443f12bcdd0a723b7ac463241889b49671e20dadcd7628)
- **approve** [`0x253769…caa85a3da`](https://sepolia.arbiscan.io/tx/0x253769ff52fd24f9affa5a86d7e0da6b003fbe82b7edbd921a04925caa85a3da)
- **deposit** [`0x7f3b95…cabd2e94`](https://sepolia.arbiscan.io/tx/0x7f3b95023119b3abddea63962fef9931b4a7ef1f2bada81ae3bcd70acabd2e94)
- **release** [`0x3e5659…428dd643`](https://sepolia.arbiscan.io/tx/0x3e565956ed392a70ac8f484897709ab186f30bcebf7972a88640d604428dd643)

### Settlement 3 · `kajota-live-2026-11-10-03` · $1.00 USDC

- **register** [`0xe856ed…307c5ed1`](https://sepolia.arbiscan.io/tx/0xe856edb02547130a08a188e8edb04e2a3f5f9272359829b772161103307c5ed1)
- **approve** [`0x9e44b3…f938f8d4`](https://sepolia.arbiscan.io/tx/0x9e44b30a2fbb682c1763c06b73fcd745efe336671668bb4b50892b1bf938f8d4)
- **deposit** [`0x4f833c…40e5c55cb`](https://sepolia.arbiscan.io/tx/0x4f833c312ee41df10685a140a8d45a443fcd7ebd693af63f84013ff40e5c55cb)
- **release** [`0xd2160f…c45637c7b`](https://sepolia.arbiscan.io/tx/0xd2160f7c5a7c28d072ea7d15b265a4df761dc24b7150de0aee16f00c45637c7b)

### Settlement 4 · `kajota-live-2026-11-10-04` · $1.00 USDC

- **register** [`0xa29ffe…438d22af2`](https://sepolia.arbiscan.io/tx/0xa29ffebf33b30b82633780a5f8f6a71c9436fae74a338735e20922a438d22af2)
- **approve** [`0x748562…287e24b6`](https://sepolia.arbiscan.io/tx/0x7485621a4428be232f5017bd3997df871156c6a0e6870ec35f1c814d287e24b6)
- **deposit** [`0x7efd2b…285449c6`](https://sepolia.arbiscan.io/tx/0x7efd2b2e5050161527ed146389ee76d86dec2cf2fce61b699bda6da7285449c6)
- **release** [`0x51653a…ed6ceb40`](https://sepolia.arbiscan.io/tx/0x51653a88d11dcda298833413bca6400a22eed51a6db7af2208cdddeaed6ceb40)

### Settlement 5 · `kajota-live-2026-11-10-05` · $1.00 USDC

- **register** [`0x28b54b…7ff36b67`](https://sepolia.arbiscan.io/tx/0x28b54bca24d9c54eb746db0d9d63ee0260808d76332bac9e2411053f7ff36b67)
- **approve** [`0xb8cd07…796ca31a`](https://sepolia.arbiscan.io/tx/0xb8cd07390b2caf60f7a9d5e02eb0e866ab4816343567ce282da5502d796ca31a)
- **deposit** [`0xe1dfde…43cad529`](https://sepolia.arbiscan.io/tx/0xe1dfde609fcae661b1a53df09e29f258d7dcf689311d7d31c3c6978743cad529)
- **release** [`0x3b6f1e…eb1ad64f3`](https://sepolia.arbiscan.io/tx/0x3b6f1eaa7172d12f9227f2d247367711384f828974a879d2e38b2ddeb1ad64f3)

## What a judge sees when they click a release tx

Each **release** transaction's event log on Arbiscan carries the `Released(depositId, listingId, grossAmount)` event. The ERC-20 transfer logs in the same transaction show three `Transfer(from=escrow, to=recipient, value)` events — $0.10 to affiliate, $0.20 to agent, $0.70 to merchant — all in one atomic transaction. The split is frozen at the listing-registration step (HARD_PARTS scar #3: *zero-argument release — the trigger cannot change the share table*).

## How to re-run it yourself

```bash
cd ~/Documents/kajota-arbitrum-singapore
pnpm hardhat run --network arbitrumSepolia scripts/fire-settlements.ts
```

Writes a fresh `deployments/live-settlements-421614.json` + prints the 20 new tx hashes. Needs a funded Arb Sepolia EOA with ≥5 USDC and ~0.0001 ETH for gas.

Related: [[feedback_winner_teardown_keeperhub]] §1 (*"Prove the money worked, not that a transaction landed"*), [[feedback_hustle_engine_leverage]] (§all 5 levers, §Oct-24 ≥3 distinct hustlers), [[hackathon_winning_playbook]] §Move 1.
