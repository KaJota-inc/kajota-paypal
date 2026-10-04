# PayPal webhook → Mesh deposit flow

**Status:** stub committed in Phase A scaffold; implemented in Phase B.

## Flow

```
PayPal checkout confirms
       │
       ▼
PayPal CHECKOUT.ORDER.APPROVED (or AGENTIC.CART.CHECKOUT.COMPLETED) webhook
       │
       ▼
POST /api/paypal/webhook  — signature verified with PayPal's public key via `jose`
       │
       ├──► persist raw payload + headers (append-only)
       │
       ▼
read `order.purchase_units[0].custom_id` → AP2 Payment Mandate (JWT)
       │
       ▼
POST /api/ap2/verify  — decode + schema-check + signature verify + binding check
       │
       ▼
registry.register(productId, recipients[], shares[], currency) ─────► Arbitrum Sepolia tx 1
       │
       ▼
pyusd.forceApprove(escrow, amount) ──────────────────────────────► Arbitrum Sepolia tx 2
       │
       ▼
escrow.deposit(listingId, amount) ───────────────────────────────► Arbitrum Sepolia tx 3
       │
       ▼
return 200 OK with { listingId, depositId, txHashes[] }
```

Release happens on a merchant action (dashboard button) or on a shipment-tracking webhook, depending on how the merchant configured the listing.

## Idempotency

- The PayPal webhook can retry up to 25 times across 72 hours.
- The Mandate's `transaction_id` is the primary idempotency key.
- Server-side, we keep a `Map<transaction_id, { listingId, depositId, txHashes[] }>` in a key-value store (Vercel KV or in-memory for the demo).
- On a retry, we return the cached response from the Map; no new on-chain writes fire.
- The listing id digest also includes `transaction_id` as a second input, so a replay against a cold cache still collides on the registry.

## Signature verification

PayPal signs webhooks via asymmetric key over `PAYPAL-TRANSMISSION-SIG` + `PAYPAL-CERT-URL` headers. We verify via the Server SDK's `WebhooksVerifyPost` method or by fetching the cert and verifying with `jose`.

The webhook id (`PAYPAL_WEBHOOK_ID`) is set once per environment via the PayPal dashboard.

## Refund path

When PayPal fires `PAYMENT.CAPTURE.REFUNDED`, we trigger `CosellEscrowV2.refundToOriginalBuyer(depositId)` on Arbitrum Sepolia. The destination is locked at relay time, so this returns the full PYUSD amount to the original buyer regardless of who the agent and affiliate were.

## Open questions (Phase B)

- Which webhook event name does the Cart API emit at checkout — `AGENTIC.CART.CHECKOUT.COMPLETED`, `CHECKOUT.ORDER.APPROVED`, or a new one? (Resolve during the sandbox walk by 15 Oct.)
- Where does PayPal embed the AP2 Payment Mandate — `custom_id`, a dedicated field, or the request response?
- Rate limits on the webhook endpoint for a demo under load.
