# AP2 Payment Mandate — decoder specification

**Status:** Phase A schema spike landed 04 Oct 2026. Structural verifier and typed library in place; SD-JWT-VC signature verification deferred to Phase B.

## Source of truth

The schema this submission consumes is the canonical [`google-agentic-commerce/AP2`](https://github.com/google-agentic-commerce/AP2) Pydantic model at `code/sdk/python/ap2/models/mandate.py` (Apache 2.0). The protocol itself is specified at [ap2-protocol.org](https://ap2-protocol.org/). Primary reference implementations ship in Python and Kotlin; a TypeScript SDK does not yet exist at the time of writing, so [`lib/ap2/types.ts`](../lib/ap2/types.ts) mirrors the Pydantic model field-for-field.

## The three mandates

AP2 wraps each agentic purchase in a chain of three signed objects.

| Mandate | Signed by | Envelope | Purpose |
|---|---|---|---|
| Intent Mandate | user | — | Authorises a shopping agent to transact subject to merchant / SKU / refundability constraints and an expiry. |
| Cart Mandate | merchant | plain base64url-encoded JWT | Pins the cart contents as a W3C `PaymentRequest`, with a `cart_hash` claim over the canonical JSON. |
| Payment Mandate | user | SD-JWT-VC with holder key binding | Authorises the payment and is bound to the Cart Mandate and `PaymentMandateContents` via a `transaction_data` array of their canonical hashes. |

The Cart Mandate's JWT payload carries `iss / sub / aud / iat / exp / jti / cart_hash`. The Payment Mandate's `user_authorization` carries an issuer-signed VC whose `cnf.jwk` names the holder's public key, plus a key-binding JWT with `aud / nonce / sd_hash / transaction_data`.

## Load-bearing observation for Mesh

A Payment Mandate names exactly one `merchant_agent` and carries exactly one `payment_details_total`. AP2 does **not** express multi-payee fan-out natively — the agent that closed the sale and any affiliate are never named as co-recipients of the authorised payment. That is the gap Mesh fills on the settlement side.

The projection function (planned in `lib/ap2/mesh-projection.ts` for Phase B) will:

1. Read the Cart Mandate's `payment_request.details.displayItems`.
2. Resolve any Channel3 affiliate attribution carried in the Cart's `methodData` or an out-of-band tag.
3. Map the single AP2 payee + optional agent + optional affiliate into a `recipients[]` and `shares[]` tuple that sums to 10 000 bps.
4. Register that tuple as a Mesh listing and deposit the equivalent PYUSD amount for the Cart's `details.total`.

## Phase A verifier flow

Entry point: [`app/api/ap2/verify/route.ts`](../app/api/ap2/verify/route.ts).

```
POST /api/ap2/verify
Content-Type: application/json
{
  "cart_mandate":    { ... CartMandate ... },
  "payment_mandate": { ... PaymentMandate ... },
  "merchant_public_key_pem": "-----BEGIN PUBLIC KEY-----\n...\n-----END PUBLIC KEY-----"
}
```

Steps performed:

1. **Schema parse.** Zod schemas in `lib/ap2/types.ts` enforce the Pydantic-equivalent shape.
2. **Cart signature.** `jose.jwtVerify` over `merchant_authorization` with the supplied merchant key. If omitted, the response flags the gap but continues.
3. **Cart hash.** `cart_hash` claim must equal `sha256Base64Url(canonicalJson(contents))`.
4. **Payment cross-reference.** `payment_mandate.payment_mandate_contents.payment_details_id` must equal `cart_mandate.contents.payment_request.details.id` so a mandate pair cannot be swapped post hoc.
5. **Timestamp sanity.** `payment_mandate_contents.timestamp` must parse as ISO 8601.

Everything beyond this — SD-JWT-VC envelope parsing, issuer-key resolution, holder key-binding, and the `transaction_data` hash cross-check — is Phase B.

## Phase B TODO list

- Add the [`sd-jwt-vc`](https://www.npmjs.com/package/sd-jwt-vc) npm dependency (or vendor the subset of the W3C-VC SD-JWT draft we need).
- Verify the issuer-signed VC against the issuer DID's public key (via `did:web` or x5c chain).
- Verify the key-binding JWT against `cnf.jwk`.
- Assert `transaction_data[0] === cartMandateHash(cartMandate.contents)` and `transaction_data[1] === paymentMandateContentsHash(contents)`.
- Swap the `canonicalJson` helper in [`lib/ap2/hash.ts`](../lib/ap2/hash.ts) for an audited RFC 8785 implementation (npm `canonicalize`).
- Add clock-skew-tolerant checks on `iat / exp / cart_expiry`.

## Sandbox stubbing

If the PayPal sandbox does not emit AP2 Payment Mandates on `POST /merchant-cart/{id}/checkout`, we stub-sign one locally with `AP2_ISSUER_PRIVATE_KEY`. The Mandate Inspector modal on the merchant dashboard surfaces a visible "stub-signed" chip so no judge mistakes a dev-signed Mandate for a merchant / issuer signature.

## Open questions resolved during the Phase A spike

- **Does the Payment Mandate carry affiliate / agent / platform splits natively?** No. Native AP2 is single-payee. Multi-party attribution is derived from the Cart Mandate's `displayItems` and whatever side-channel the shopping agent used (Channel3 affiliate attribution in our demo).
- **Is `vct` the right discriminator?** No — the Pydantic model does not use `vct` at all. The envelope type is implicit in the field name (`merchant_authorization` is a JWT, `user_authorization` is an SD-JWT-VC).
- **Is there a TypeScript reference SDK?** Not yet (as of 04 Oct 2026). Our `lib/ap2/` is the local implementation.

## Open questions remaining (Phase B)

- Does `developer.paypal.com/docsai/limited-release/agentic-commerce/quickstart` emit a signed Mandate on the Cart API `/checkout` response, or on a webhook?
- What issuer DID should we trust in sandbox? If PayPal does not publish one, we trust our own and label it.
- How does Mastercard's AP2 Payment Mandate issuer DID resolve? (Future compatibility, not required for submission.)
