import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import type { Hex } from "viem";

import { buildBeaconReceipt } from "../../lib/beacon/receipt";
import {
  CBN_CPR_2019_SECONDS,
  REG_E_PROVISIONAL_CREDIT_SECONDS,
} from "../../lib/beacon/canonical";
import { pinSanctionsSnapshot } from "../../lib/beacon/sanctions";
import type { CartMandate, PaymentMandate } from "../../lib/ap2/types";

const MERCHANT: Hex = "0x742d35Cc6634C0532925a3b844Bc9e7595f8bEb6";
const POSTED_AT_ISO = "2026-10-06T12:00:00Z";

function makePair(value = "19.99"): {
  cartMandate: CartMandate;
  paymentMandate: PaymentMandate;
} {
  const paymentDetailsId = `req_${randomUUID()}`;
  const cartMandate: CartMandate = {
    contents: {
      id: `cart_${randomUUID()}`,
      user_cart_confirmation_required: false,
      payment_request: {
        methodData: [{ supportedMethods: "https://paypal.com/pay" }],
        details: {
          id: paymentDetailsId,
          total: { label: "Total", amount: { currency: "USD", value } },
        },
      },
      cart_expiry: "2026-10-07T00:00:00Z",
      merchant_name: "Demo",
    },
  };
  const paymentMandate: PaymentMandate = {
    payment_mandate_contents: {
      payment_mandate_id: `pm_${randomUUID()}`,
      payment_details_id: paymentDetailsId,
      payment_details_total: {
        label: "Total",
        amount: { currency: "USD", value },
      },
      payment_response: {
        requestId: paymentDetailsId,
        methodName: "https://paypal.com/pay",
        details: { paypal_order_id: `PP_${randomUUID()}` },
      },
      merchant_agent: "did:web:demo",
      timestamp: POSTED_AT_ISO,
    },
  };
  return { cartMandate, paymentMandate };
}

describe("buildBeaconReceipt — happy path", () => {
  it("first post of a mandate returns status 'posted' at occurrence 1", () => {
    const { cartMandate, paymentMandate } = makePair();
    const receipt = buildBeaconReceipt({
      cartMandate,
      paymentMandate,
      merchantAddress: MERCHANT,
    });
    assert.equal(receipt.status, "posted");
    assert.equal(receipt.occurrence, 1);
    assert.equal(receipt.statusReason, undefined);
  });

  it("amount derives from the Payment Mandate total.value", () => {
    const { cartMandate, paymentMandate } = makePair("50.25");
    const receipt = buildBeaconReceipt({
      cartMandate,
      paymentMandate,
      merchantAddress: MERCHANT,
    });
    assert.equal(receipt.amountMinorUnits, BigInt(50_250_000).toString());
    assert.equal(receipt.currency, "USD");
  });

  it("deadline = postedAt + Reg E window by default", () => {
    const { cartMandate, paymentMandate } = makePair();
    const receipt = buildBeaconReceipt({
      cartMandate,
      paymentMandate,
      merchantAddress: MERCHANT,
    });
    assert.equal(
      receipt.deadline - receipt.postedAt,
      REG_E_PROVISIONAL_CREDIT_SECONDS,
    );
    assert.equal(receipt.slaRegime, "reg-e-10bd");
  });

  it("deadline shrinks to the CBN 24-hour window on override", () => {
    const { cartMandate, paymentMandate } = makePair();
    const receipt = buildBeaconReceipt({
      cartMandate,
      paymentMandate,
      merchantAddress: MERCHANT,
      slaWindowSeconds: CBN_CPR_2019_SECONDS,
      slaRegime: "cbn-cpr-24h",
    });
    assert.equal(receipt.slaWindowSeconds, CBN_CPR_2019_SECONDS);
    assert.equal(receipt.slaRegime, "cbn-cpr-24h");
  });

  it("commitment is byte-reproducible across two builds of the same mandate", () => {
    const { cartMandate, paymentMandate } = makePair();
    const seen = new Map<Hex, number>();
    const a = buildBeaconReceipt(
      { cartMandate, paymentMandate, merchantAddress: MERCHANT },
      { seenIdempotencyKeys: new Map() }, // fresh — no replay
    );
    const b = buildBeaconReceipt(
      { cartMandate, paymentMandate, merchantAddress: MERCHANT },
      { seenIdempotencyKeys: new Map() },
    );
    assert.equal(a.commitment, b.commitment);
    assert.equal(a.idempotencyKey, b.idempotencyKey);
    assert.equal(seen.size, 0);
  });
});

describe("buildBeaconReceipt — replay-safety", () => {
  it("second post inside the same CRE bucket flips to 'duplicate-routed'", () => {
    const { cartMandate, paymentMandate } = makePair();
    const seen = new Map<Hex, number>();
    const first = buildBeaconReceipt(
      { cartMandate, paymentMandate, merchantAddress: MERCHANT },
      { seenIdempotencyKeys: seen },
    );
    const second = buildBeaconReceipt(
      { cartMandate, paymentMandate, merchantAddress: MERCHANT },
      { seenIdempotencyKeys: seen },
    );
    assert.equal(first.status, "posted");
    assert.equal(first.occurrence, 1);
    assert.equal(second.status, "duplicate-routed");
    assert.equal(second.occurrence, 2);
    assert.match(second.statusReason ?? "", /replay-within-ttl/);
  });

  it("the commitment of the second post differs from the first (occurrence enters it)", () => {
    const { cartMandate, paymentMandate } = makePair();
    const seen = new Map<Hex, number>();
    const first = buildBeaconReceipt(
      { cartMandate, paymentMandate, merchantAddress: MERCHANT },
      { seenIdempotencyKeys: seen },
    );
    const second = buildBeaconReceipt(
      { cartMandate, paymentMandate, merchantAddress: MERCHANT },
      { seenIdempotencyKeys: seen },
    );
    assert.notEqual(first.commitment, second.commitment);
  });
});

describe("buildBeaconReceipt — sanctions drift", () => {
  it("ingest vs verifier snapshot mismatch flips status", () => {
    const { cartMandate, paymentMandate } = makePair();
    const ingest = pinSanctionsSnapshot("ofac-sdn", "2026-10-02");
    const verifier = pinSanctionsSnapshot("ofac-sdn", "2026-10-09"); // one week later
    const receipt = buildBeaconReceipt(
      {
        cartMandate,
        paymentMandate,
        merchantAddress: MERCHANT,
        sanctionsSnapshot: ingest,
      },
      { verifierSnapshot: verifier },
    );
    assert.equal(receipt.status, "duplicate-routed");
    assert.match(receipt.statusReason ?? "", /sanctions-list-drift/);
  });

  it("ingest == verifier snapshot stays 'posted'", () => {
    const { cartMandate, paymentMandate } = makePair();
    const snap = pinSanctionsSnapshot("ofac-sdn", "2026-10-02");
    const receipt = buildBeaconReceipt(
      {
        cartMandate,
        paymentMandate,
        merchantAddress: MERCHANT,
        sanctionsSnapshot: snap,
      },
      { verifierSnapshot: snap },
    );
    assert.equal(receipt.status, "posted");
  });
});
