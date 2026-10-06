import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { generateKeyPair, SignJWT } from "jose";

import { cartMandateHash } from "../../lib/ap2/hash";
import { verifyCartMandate, verifyPaymentMandate } from "../../lib/ap2/verify";
import type { CartMandate, PaymentMandate } from "../../lib/ap2/types";

async function makeCart(
  overrides: {
    cartExpiryIso?: string;
    paymentDetailsId?: string;
    unsigned?: boolean;
  } = {},
): Promise<{
  cart: CartMandate;
  publicKey: CryptoKey;
  originalHash: string;
}> {
  const { privateKey, publicKey } = await generateKeyPair("ES256");
  const paymentDetailsId = overrides.paymentDetailsId ?? `req_${randomUUID()}`;
  const contents = {
    id: `cart_${randomUUID()}`,
    user_cart_confirmation_required: false,
    payment_request: {
      methodData: [{ supportedMethods: "https://paypal.com/pay" }],
      details: {
        id: paymentDetailsId,
        total: { label: "Total", amount: { currency: "USD", value: "19.99" } },
      },
    },
    cart_expiry:
      overrides.cartExpiryIso ??
      new Date(Date.now() + 15 * 60 * 1000).toISOString(),
    merchant_name: "Demo",
  };

  const originalHash = cartMandateHash(contents);
  const merchantAuthorization = overrides.unsigned
    ? undefined
    : await new SignJWT({ cart_hash: originalHash, jti: `jti_${randomUUID()}` })
        .setProtectedHeader({ alg: "ES256", typ: "JWT" })
        .setIssuer("did:web:demo-merchant.example")
        .setIssuedAt()
        .setExpirationTime("10m")
        .sign(privateKey);

  return {
    cart: { contents, merchant_authorization: merchantAuthorization },
    publicKey,
    originalHash,
  };
}

function makePayment(
  paymentDetailsId: string,
  overrides: { timestampMs?: number } = {},
): PaymentMandate {
  return {
    payment_mandate_contents: {
      payment_mandate_id: `pm_${randomUUID()}`,
      payment_details_id: paymentDetailsId,
      payment_details_total: {
        label: "Total",
        amount: { currency: "USD", value: "19.99" },
      },
      payment_response: {
        requestId: paymentDetailsId,
        methodName: "https://paypal.com/pay",
        details: { paypal_order_id: `PP_${randomUUID()}` },
      },
      merchant_agent: "did:web:demo-merchant.example",
      timestamp: new Date(overrides.timestampMs ?? Date.now()).toISOString(),
    },
    user_authorization: "<stub>",
  };
}

describe("verifyCartMandate", () => {
  it("accepts a signed, in-date Cart Mandate", async () => {
    const { cart, publicKey } = await makeCart();
    const result = await verifyCartMandate(cart, publicKey);
    assert.equal(result.ok, true);
  });

  it("refuses an unsigned Cart Mandate at the signature stage", async () => {
    const { cart, publicKey } = await makeCart({ unsigned: true });
    const result = await verifyCartMandate(cart, publicKey);
    assert.equal(result.ok, false);
    if (!result.ok) assert.equal(result.stage, "signature");
  });

  it("refuses a Cart Mandate past its cart_expiry (independent of JWT exp)", async () => {
    const { cart, publicKey } = await makeCart({
      cartExpiryIso: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
    });
    const result = await verifyCartMandate(cart, publicKey);
    assert.equal(result.ok, false);
    if (!result.ok) assert.equal(result.stage, "expiry");
  });

  it("refuses a Cart Mandate whose contents were tampered after signing", async () => {
    const { cart, publicKey } = await makeCart();
    // Mutate the total; the cached JWT still carries the original cart_hash.
    const tampered: CartMandate = {
      ...cart,
      contents: {
        ...cart.contents,
        payment_request: {
          ...cart.contents.payment_request,
          details: {
            ...cart.contents.payment_request.details,
            total: {
              label: "Total",
              amount: { currency: "USD", value: "0.01" },
            },
          },
        },
      },
    };
    const result = await verifyCartMandate(tampered, publicKey);
    assert.equal(result.ok, false);
    if (!result.ok) assert.equal(result.stage, "hash");
  });

  it("refuses a Cart Mandate signed by a different merchant key", async () => {
    const { cart } = await makeCart();
    const { publicKey: wrongKey } = await generateKeyPair("ES256");
    const result = await verifyCartMandate(cart, wrongKey);
    assert.equal(result.ok, false);
    if (!result.ok) assert.equal(result.stage, "signature");
  });
});

describe("verifyPaymentMandate", () => {
  it("accepts a Payment Mandate whose payment_details_id matches the Cart", async () => {
    const paymentDetailsId = `req_${randomUUID()}`;
    const { cart } = await makeCart({ paymentDetailsId });
    const payment = makePayment(paymentDetailsId);
    const result = await verifyPaymentMandate(payment, cart);
    assert.equal(result.ok, true);
  });

  it("refuses a swapped Mandate pair at the cross-ref stage", async () => {
    const { cart } = await makeCart({ paymentDetailsId: `req_A_${randomUUID()}` });
    const payment = makePayment(`req_B_${randomUUID()}`);
    const result = await verifyPaymentMandate(payment, cart);
    assert.equal(result.ok, false);
    if (!result.ok) assert.equal(result.stage, "mandate-cross-ref");
  });

  it("refuses a Payment Mandate with a non-ISO timestamp at the schema stage", async () => {
    const paymentDetailsId = `req_${randomUUID()}`;
    const { cart } = await makeCart({ paymentDetailsId });
    const payment = makePayment(paymentDetailsId);
    payment.payment_mandate_contents.timestamp = "not-a-date";
    const result = await verifyPaymentMandate(payment, cart);
    assert.equal(result.ok, false);
    if (!result.ok) assert.equal(result.stage, "schema");
  });
});
