# AP2 Payment Mandate — decoder specification

**Status:** stub committed in Phase A scaffold; filled during Phase B (12–25 Oct 2026).

The AP2 Payment Mandate (`vct = "mandate.payment"`) is the cryptographic receipt we lift at PayPal checkout and project into a Mesh listing. See:

- Spec: https://ap2-protocol.org/ap2/payment_mandate/
- Reference implementations: Python, TypeScript, Kotlin, Go
- Spec version: `v0.2.0` (April 2026; donated to the FIDO Alliance)

## Shape

Every Payment Mandate is a W3C Verifiable Credential signed by the issuer DID. The subset Mesh consumes is defined in [`lib/ap2/types.ts`](../lib/ap2/types.ts):

| Field | Shape | Mesh use |
|---|---|---|
| `vct` | `"mandate.payment"` literal | Discriminates from Intent and Cart Mandates |
| `transaction_id` | `base64url(hash(checkout_jwt))` | Idempotency key; feeds listing id digest |
| `issuer_did` | DID string | Verifier's trust root |
| `holder_did` | DID string | Agent identity; cross-checked against `AgentIdentityBinding` |
| `issued_at` / `expires_at` | ISO 8601 timestamps | Clock-skew bounded by `AP2_VERIFY_SKEW_SECONDS` |
| `cart.items` | array of `CartItem` | Audit trail for the Mandate Inspector modal |
| `cart.payees` | array of `Payee` (2–16) | Fed into `recipients[]` and `shares[]` for `CosellRegistryV2.register` |
| `payment_request` | PayPal order id, amount, currency | Reconciled against the webhook payload |
| `signature` | algorithm + value | Verified via `jose` against the issuer DID's public key |

## Decode and verify

The server flow at `/api/ap2/verify`:

1. Decode the Mandate's JWT envelope with `jose.jwtVerify`.
2. Parse the payload with `PaymentMandateSchema.parse` from `lib/ap2/types.ts`.
3. Assert `vct === "mandate.payment"`.
4. Assert `issued_at ≤ now ≤ expires_at` within `AP2_VERIFY_SKEW_SECONDS`.
5. Assert `cart.payees.length ≥ 2`.
6. Assert `assertSharesSumToDenominator(cart.payees)` — the mirror of the on-chain invariant.
7. For every `Payee` with role `agent`, resolve `address` against `AgentIdentityBinding.bindingOf(address)` on Arbitrum Sepolia and assert `active`.
8. Return a decoded `PaymentMandate` object plus the raw envelope.

## Sandbox stubbing

If the PayPal sandbox does not yet emit AP2 Payment Mandates, we stub-sign one at `/api/ap2/stub-sign` using `AP2_ISSUER_PRIVATE_KEY`. The stub is **labelled** in the Mandate Inspector modal with a red "stub-signed" chip so no judge mistakes it for a real issuer signature.

## Open questions (Phase B)

- Does `developer.paypal.com/docsai/limited-release/agentic-commerce/quickstart` emit a signed Mandate on the Cart API `/checkout` response, or on a webhook?
- What issuer DID should we trust in sandbox? If PayPal does not publish one, we trust our own and label it.
- How does Mastercard's AP2 Payment Mandate issuer DID resolve? (Future compatibility, not required for submission.)
