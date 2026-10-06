# Hard parts — constraints we hit and how we solved them

Zama-S3-shaped table of real engineering scars, each with the symptom a naive implementation would exhibit, the fix we shipped, and the file / Arbiscan link / reproducer script a reader can click. Eleven inherited from the Mesh substrate on `kajota-arbitrum-singapore@9f8fb5e`; seven on the PayPal seam; three on the Mandate Beacon compliance-receipt layer ported from `kajota-zama hackathon/bli-mandate-beacon`.

The two reproducers (`pnpm reproduce` happy path, `pnpm reproduce:fail` seven-gate adversarial table) exist precisely to prove each row is runnable, not prose.

## At a glance

| # | Scar | Symptom if we got it wrong | Fix | Verify |
|---|---|---|---|---|
| 1 | **Deactivate-only registry** | Mid-flight listing edit lets a registrant retroactively cut their coseller's share after volume lands | `CosellRegistryV2.register` has no in-place update path; only `deactivate(listingId)` flips the live flag, after which a new listing must be re-registered under a fresh digest | `contracts/CosellRegistryV2.sol:92-158` on the substrate repo |
| 2 | **Sum-to-10 000 bps invariant** | Shares like 50 / 30 / 15 silently distribute 95 % of the deposit, the remaining 5 % stranded in escrow | On-chain revert `SharesDoNotSumToDenominator`; off-chain mirror in `projectCartToMeshListing` catches it before the chain round-trip | `lib/ap2/mesh-projection.ts:91-96` and `pnpm reproduce:fail sum-not-10000-bps` |
| 3 | **Zero-argument release** | The entity that triggers settlement passes the share table in → an attacker with `releaseAuth` can reroute every penny | `CosellEscrowV2.release(bytes32 depositId)` takes only the deposit id; the split comes from the frozen listing snapshot | `contracts/CosellEscrowV2.sol:139` |
| 4 | **Zero-dust rounding** | Floor division leaves a dust remainder stuck in the escrow across millions of settlements | `computeSplit` floors every share except the last, which absorbs `grossAmount - running`, so `sum(perRecipient) ≡ grossAmount` | `contracts/CosellRegistryV2.sol:217-235`; off-chain mirror in `app/api/paypal/webhook/route.ts:computeShareOffChain` |
| 5 | **EIP-3009 replay via the token** | Rolled a per-sig nonce table locally → divergence from Circle's canonical semantics after any PYUSD contract upgrade | Delegate replay prevention to the stablecoin contract's own nonce map; our `X402DepositFacilitator` only consumes `transferWithAuthorization` | `pnpm reproduce` (end-to-end signature round-trip) |
| 6 | **Fee-on-transfer guard** | A FoT token drops bytes mid-transfer, escrow debits buyer by amount A but holds amount B — releases are then under-funded | `relayDeposit` reverts `PostRelayAssertionFailed` if `balanceAfter − balanceBefore ≠ amount`. PYUSD is not FoT today; the guard stays on | `contracts/X402DepositFacilitator.sol:147` |
| 7 | **Destination-locked refund** | Permissionless refund path lets an attacker route the refund to themselves | `_originalBuyerOf[depositId]` recorded on relay, `delete`d on first refund, enforced in `refundToOriginalBuyer` | `contracts/X402DepositFacilitator.sol:_originalBuyerOf` |
| 8 | **Token-agnostic constructor** | A hard-coded USDC address blocks reuse across stablecoins and chains | Escrow and facilitator take `IERC20` at construction; same bytecode runs against USDC (`0x75faF11…`), USDG (`0xFFC95faa…`), PYUSD (`0x637A1259…`) | `lib/mesh/addresses.ts` + deploy script in substrate repo |
| 9 | **Mainnet-chainId guardrail** | A production RPC URL in `.env` deploys an untested contract to Arbitrum One by mistake | `deploy.ts` has explicit `KNOWN_MAINNET_IDS = { 1, 42161, 8453, 5000, 4663 }` and throws before any send; the `46630` vs `4663` off-by-10× on Robinhood is the specific footgun this catches | `KNOWN_MAINNET_IDS` set in substrate `scripts/deploy.ts` |
| 10 | **ERC-8004 metadata-not-proof hop** | An on-chain "verify" that pretends to cross-chain-attest an agent id → ships a liar as a feature | `AgentIdentityBinding` records attestations only; verification is explicitly the reader's job (Chainlink Functions, indexer, light client). Contract comment: _"Mesh treats the binding as attested metadata, not proof."_ | `contracts/AgentIdentityBinding.sol` |
| 11 | **MockUSDC byte-identical EIP-3009 domain** | A mock that works in tests but fails against real USDC — the integration test earns zero signal | MockUSDC mirrors Circle's canonical EIP-712 domain and type-hash exactly; `X402DepositFacilitator.test.ts` doubles as a real-USDC smoke test | `test/X402DepositFacilitator.test.ts:L102` in the substrate repo |
| 12 | **AP2 idempotency keyed on `payment_mandate_id`** | PayPal's webhook retries up to 25 times across 72 hours → double fan-out on dropped responses | `sessions.get(paymentMandateId)` dedupes before any projection; cached replays return the stored result with `idempotent_replay: true` | `app/api/paypal/webhook/route.ts:99-108` + `lib/orchestrator/sessions.ts:put/get` |
| 13 | **Payment Mandate / Cart Mandate cross-ref** | Submission wraps Cart A with Payment Mandate for Cart B → an attacker reuses an authorised amount against a different cart | `verifyPaymentMandate` cross-refs `payment_mandate_contents.payment_details_id` against `cart.contents.payment_request.details.id`; mismatch returns `stage: "mandate-cross-ref"` | `lib/ap2/verify.ts:verifyPaymentMandate` + `pnpm reproduce:fail swapped-mandate-pair` |
| 14 | **`cart_hash` tamper detection** | Attacker flips the Cart's `total` from $19.99 to $0.01 after signing → settlement under-funds every payee | `verifyCartMandate` computes `cartMandateHash(contents)` and refuses if the JWT payload's `cart_hash` claim differs | `lib/ap2/verify.ts:verifyCartMandate` + `pnpm reproduce:fail tampered-cart-contents` prints `original_hash` and `tampered_hash` |
| 15 | **Independent `cart_expiry` gate** | JWT `exp` is still valid while the cart's own expiry has lapsed → a stale-but-signed Mandate settles after the merchant's price window closed | Dedicated expiry pass in `verifyCartMandate` returns `stage: "expiry"` when `cart.contents.cart_expiry < now` | `lib/ap2/verify.ts` + `pnpm reproduce:fail expired-cart-mandate` |
| 16 | **PYUSD approval-reset quirk** | A second approval before resetting the first reverts with the Circle-USDC-era `approve-nonzero-to-nonzero` guard | `depositPyusd` uses viem's `writeContract` against the token with explicit zero-approval wrap; the orchestrator never retries approvals without reset | `lib/mesh/escrow.ts:depositPyusd` |
| 17 | **Sandbox-vs-production chain id guardrail** | A sandbox webhook meets a production chain id and settles unfunded testnet promises against real money | `publicArbSepolia()` is hard-wired to `arbitrumSepolia` from viem/chains; `MESH_ORCHESTRATION_PRIVATE_KEY` loads only when `NEXT_PUBLIC_CHAIN_ID=421614` | `lib/mesh/clients.ts` + `lib/env/index.ts` default `NEXT_PUBLIC_CHAIN_ID=421614` |
| 18 | **Attribution policy residual check** | Policy `affiliateBps=1000 + agentBps=9500` leaves the merchant with −500 bps; the on-chain registry would revert `SharesDoNotSumToDenominator` after a wasted round-trip | `projectCartToMeshListing` asserts `residualBps > 0` locally; throws before any chain call | `lib/ap2/mesh-projection.ts:91-96` + `pnpm reproduce:fail sum-not-10000-bps` |
| 19 | **Server-authored idempotency key (replay inside TTL)** | A compromised agent, or a merchant retry-at-ambiguity, mints a fresh `payment_mandate_id` against the same cart and defeats the §12 webhook dedupe — the second attempt auto-settles inside the Reg E provisional-credit window | `idempotencyKeyFor` derives the key off `keccak256(canonicalPaymentMandateContents ‖ amount ‖ creTickBucket)` — the client cannot author it. The replay routes to `duplicate-routed` with occurrence bumped; see `MandateAnchor.sol:§replay-within-ttl` on `kajota-zama hackathon/bli-mandate-beacon` | `lib/beacon/canonical.ts:idempotencyKeyFor` + `pnpm reproduce:fail beacon-replay-within-ttl` |
| 20 | **Sanctions-list drift pinning** | A mandate re-verified three weeks later against the current OFAC SDN list reads a different answer than the one in force at ingest; the audit cannot be reproduced | `pinSanctionsSnapshot(list, publishedAt)` fixes the digest at ingest; the receipt carries the pinned version; a verifier presenting a drifted snapshot routes to `duplicate-routed` with reason `sanctions-list-drift` — regulatory anchor: 31 CFR §501 app A | `lib/beacon/sanctions.ts` + `pnpm reproduce:fail beacon-sanctions-list-drift` |
| 21 | **Cross-rail byte-identical commitment** | Two implementations of the same primitive drift subtly over time (uint widths, address casing, field order) → the BLI audit replay and the PayPal audit replay stop producing the same leaf | `mandateCommitment` wraps `encodeAbiParameters` with the exact 9-field tuple from `MandateAnchor.sol`; `getAddress()` enforces EIP-55 checksum before encoding, `BigInt(...)` casts to the uint64 range the Solidity declares, bytes32 fields pass through unchanged | `lib/beacon/canonical.ts:mandateCommitment` + `kajota-zama/contracts/beacon/MandateAnchor.sol:mandateCommitment` |

## The six load-bearing ones, in paragraph form

The scars above whose shape is most likely to be interrogated at judging get a longer treatment here. Each one has a reproducer, a file path, and a before/after sentence that a judge can quote.

### 3 — The zero-argument release

Every settlement-side mandate-binding thread we read (notably `google-agentic-commerce/AP2#255`'s eight-reply conversation) debates where the share table should be enforced. Our answer: the entity that calls `release` cannot pass a share table in. The signature is `release(bytes32 depositId)` and the body reads `l = registry.getListing(d.listingId); shares = registry.computeSplit(d.grossAmount, d.listingId)` with the deposit's own `listingId` as the only input. If the registrant wanted to steal from the coseller after the fact, they could not — the listing is deactivate-only (scar 1) and no edit path exists.

### 12 — Idempotency keyed on the Payment Mandate id

PayPal's webhook spec retries on `5xx` or network timeout with exponential back-off, up to 25 attempts across 72 hours. A naive handler fans out the proceeds for every attempt. Our handler dedupes on `payment_mandate_contents.payment_mandate_id`, caching the first result in the session store; subsequent retries return the cached response with `idempotent_replay: true` and a 200 OK. The Payment Mandate id is the right key because AP2 defines it as unique per mandate (`code/sdk/python/ap2/models/mandate.py:PaymentMandateContents.payment_mandate_id`) and the user signs over it.

### 13 — Cross-ref `payment_details_id`

An AP2 Payment Mandate authorises a specific `payment_details_id`. Without binding that to the submitted Cart Mandate's `payment_request.details.id`, an attacker could pair a user-signed Payment Mandate for order B with a merchant-signed Cart Mandate for order A, settling an amount the user never authorised for the goods they never saw. `verifyPaymentMandate` enforces this cross-reference and returns `stage: "mandate-cross-ref"` on mismatch. See `pnpm reproduce:fail swapped-mandate-pair` for the live reproducer.

### 14 — Tamper detection via `cart_hash`

The merchant signs the JWT inside `merchant_authorization` with a `cart_hash` claim computed over the canonical JSON of `CartContents`. We re-compute the hash on receipt and refuse any Cart whose `contents` do not round-trip. The reproducer prints both hashes so the branch is a visible diff:

```
original_hash = l3VGJhQB_4ktXI3mSSHv6h3LWjF5O8SXrUzIRzVNYH8
tampered_hash = kQmYbWX1pV6rD_bfXe3jHhV8rwjN_LZ8MbAD4VcfyY0
```

### 15 — `cart_expiry` is independent of JWT `exp`

The JWT envelope has its own `iat`/`exp` claims; AP2 CartContents carries a separate `cart_expiry` for the cart itself. A valid-JWT / expired-cart pairing is a real attack surface because the signer typically picks a short-lived JWT (10–15 min) but a long cart window (an hour or more). We enforce the cart-level expiry in a dedicated pass that returns `stage: "expiry"` on refusal.

### 18 — Attribution-policy residual check

The share table has to leave the merchant with a positive residual. If the attribution policy allocates more than 10 000 bps to agent + affiliate combined, our projection throws before any chain call with "attribution policy leaves the merchant with −500 bps; must be > 0." The on-chain `SharesDoNotSumToDenominator` revert would catch it eventually, but costs an Arbiscan round-trip for a defect the client can see.

## Phase B TODOs still open

- Full SD-JWT-VC signature verification + `transaction_data` hash cross-check on the Payment Mandate's `user_authorization`.
- Swap the Phase-A canonical-JSON implementation for RFC 8785 via npm `canonicalize`.
- Resolve the issuer DID via `did:web` or x5c chain.
- Verify the key-binding JWT against `cnf.jwk`.
- Register the deployed PYUSD escrow + facilitator pair against Paxos's canonical Arbitrum Sepolia PYUSD `0x637A1259C6afd7E3AdF63993cA7E58BB438aB1B1`.

Each will be an additional row in the table above the day it lands.
