# Hard parts

The engineering scars this submission names, with the specific defence written up for each. Eleven are inherited from the Mesh substrate; seven are new on the PayPal seam. Each row expands into a paragraph in Phase C.

## Mesh substrate (inherited, verified in `kajota-arbitrum-singapore`)

1. **Deactivate-only registry.** Listings cannot be edited after `register()`; only the registrant can deactivate. Changing terms mid-flight would break in-flight payments and trust.
2. **Sum-to-10000-bps invariant.** Enforced in `CosellRegistryV2.register` (`SharesDoNotSumToDenominator`) and re-asserted in `computeSplit`. No "roughly 100%".
3. **Zero-argument release.** `release(depositId)` takes only the deposit id; the split is fully determined by the registry snapshot recorded at deposit time. The releaser cannot influence recipients.
4. **Zero-dust rounding.** Last recipient absorbs the floor remainder; `sum(perRecipient) ≡ gross`. The escrow retains nothing.
5. **EIP-3009 replay prevention via the token.** Delegated to the USDC / USDG / PYUSD contract's own per-signer nonce map; no local re-implementation to drift from the canonical semantics.
6. **Fee-on-transfer guard.** `PostRelayAssertionFailed` reverts the entire deposit if `balanceAfter - balanceBefore ≠ amount`. PYUSD is not FoT today; the guard stays on.
7. **Destination-locked refund.** `_originalBuyerOf[depositId]` recorded on relay, deleted on first refund, enforced by `refundToOriginalBuyer`. An attacker triggering the refund can only route funds to the recorded buyer.
8. **Token-agnostic constructor.** Escrow and facilitator take `IERC20` at construction; same bytecode runs against Circle USDC, Paxos USDG and Paxos PYUSD.
9. **Mainnet-chainId guardrail.** Explicit `KNOWN_MAINNET_IDS` set in `deploy.ts`; catches the 46630-vs-4663 off-by-10× footgun on Robinhood and the "did we deploy to mainnet by accident" class of errors.
10. **ERC-8004 metadata-not-proof hop.** `AgentIdentityBinding` records attestations only; cross-chain verification is explicitly the reader's job (Chainlink Functions, indexer, light client).
11. **MockUSDC byte-identical EIP-3009 domain.** The test MockUSDC mirrors Circle's canonical EIP-712 domain and type hash exactly, so the facilitator's end-to-end test doubles as a real-USDC smoke test.

## PayPal seam (new to this submission)

12. **PayPal order id → Mesh listing id idempotency keyed on AP2 `transaction_id`.** Webhook retries from PayPal are expected; the Mandate's `transaction_id` (`base64url(hash(checkout_jwt))`) is the second input to the listing id digest, so a retry collides on the registry and no double fan-out occurs. *(Phase B)*
13. **AP2 Payment Mandate signature verification before any on-chain write.** The signature is verified against the issuer DID at the edge; only mandates that pass become listings. *(Phase B)*
14. **AP2 `agent_id` ↔ ERC-8004 `agentCardHash` binding at Mandate decode.** The Payment Mandate names the agent; we assert the agent EOA has an active binding in `AgentIdentityBinding` before accepting it as a payee. *(Phase B)*
15. **PYUSD approval reset quirk.** PYUSD, like Circle USDC, requires the allowance to be zeroed before setting a new value — handled via `forceApprove`. *(Phase A)*
16. **Refund flow — destination-locked.** PayPal refund webhook triggers `refundToOriginalBuyer`. Because the destination is locked at relay time, the agent cannot keep its share after the buyer is refunded. *(Phase B)*
17. **Sandbox-vs-production chainId guardrail.** PayPal sandbox binds strictly to Arbitrum Sepolia; live PayPal binds to Arbitrum One. A sandbox webhook that lands on a live chain id refuses to deposit. *(Phase B)*
18. **Webhook replay guard.** The Mandate `transaction_id` is a durable idempotency key across PayPal's retry schedule; stored in a lightweight server-side map keyed by `transaction_id` with the Mesh deposit id as its value. *(Phase B)*

Each row ships with a failing-first test under `test/` by the time the submission closes. The row then reads as a before/after that any judge can run with `pnpm test`.
