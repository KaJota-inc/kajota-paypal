import { describe, it } from "node:test";
import assert from "node:assert/strict";

import {
  CBN_CPR_2019_SECONDS,
  CRE_TICK_SECONDS,
  REG_E_PROVISIONAL_CREDIT_SECONDS,
  creTickBucket,
  envelopeHashFor,
  idempotencyKeyFor,
  mandateCommitment,
  mandateIdFor,
  minorUnitsFromDecimal,
  toHex32FromBase64Url,
} from "../../lib/beacon/canonical";
import type { PaymentMandateContents } from "../../lib/ap2/types";

const SAMPLE_PAYMENT: PaymentMandateContents = {
  payment_mandate_id: "pm_test_1",
  payment_details_id: "req_test_1",
  payment_details_total: {
    label: "Total",
    amount: { currency: "USD", value: "19.99" },
  },
  payment_response: {
    requestId: "req_test_1",
    methodName: "https://paypal.com/pay",
    details: { paypal_order_id: "PP_TEST" },
  },
  merchant_agent: "did:web:demo",
  timestamp: "2026-10-06T00:00:00Z",
};

describe("SLA constants", () => {
  it("Reg E provisional credit = 10 calendar days", () => {
    assert.equal(REG_E_PROVISIONAL_CREDIT_SECONDS, 10 * 24 * 60 * 60);
  });

  it("CBN CPR 2019 = 24 hours", () => {
    assert.equal(CBN_CPR_2019_SECONDS, 24 * 60 * 60);
  });

  it("CRE tick = 5 minutes", () => {
    assert.equal(CRE_TICK_SECONDS, 5 * 60);
  });
});

describe("creTickBucket", () => {
  it("floors timestamp into 5-minute buckets by default", () => {
    assert.equal(creTickBucket(0), 0);
    assert.equal(creTickBucket(299), 0);
    assert.equal(creTickBucket(300), 1);
    assert.equal(creTickBucket(599), 1);
    assert.equal(creTickBucket(600), 2);
  });

  it("accepts a custom bucket size", () => {
    assert.equal(creTickBucket(3600, 3600), 1);
    assert.equal(creTickBucket(7199, 3600), 1);
    assert.equal(creTickBucket(7200, 3600), 2);
  });
});

describe("minorUnitsFromDecimal (beacon)", () => {
  it("round-trips the same shape as mesh-projection", () => {
    assert.equal(minorUnitsFromDecimal("19.99", 6), BigInt(19_990_000));
    assert.equal(minorUnitsFromDecimal("0", 6), BigInt(0));
    assert.equal(minorUnitsFromDecimal("100", 6), BigInt(100_000_000));
  });

  it("refuses invalid input", () => {
    assert.throws(() => minorUnitsFromDecimal("abc", 6), /invalid decimal/);
  });
});

describe("mandateIdFor", () => {
  it("is deterministic", () => {
    const a = mandateIdFor("pm_test_1");
    const b = mandateIdFor("pm_test_1");
    assert.equal(a, b);
    assert.match(a, /^0x[0-9a-f]{64}$/);
  });

  it("differs across inputs", () => {
    assert.notEqual(mandateIdFor("pm_a"), mandateIdFor("pm_b"));
  });
});

describe("envelopeHashFor", () => {
  it("is deterministic over the cart-hash string", () => {
    const h = "l3VGJhQB_4ktXI3mSSHv6h3LWjF5O8SXrUzIRzVNYH8";
    assert.equal(envelopeHashFor(h), envelopeHashFor(h));
    assert.match(envelopeHashFor(h), /^0x[0-9a-f]{64}$/);
  });
});

describe("idempotencyKeyFor", () => {
  it("collides for the same (contents, amount, bucket)", () => {
    const a = idempotencyKeyFor(SAMPLE_PAYMENT, BigInt(19_990_000), 1_700_000_000);
    const b = idempotencyKeyFor(SAMPLE_PAYMENT, BigInt(19_990_000), 1_700_000_000);
    assert.equal(a, b);
  });

  it("differs when the amount changes", () => {
    const a = idempotencyKeyFor(SAMPLE_PAYMENT, BigInt(19_990_000), 1_700_000_000);
    const b = idempotencyKeyFor(SAMPLE_PAYMENT, BigInt(29_990_000), 1_700_000_000);
    assert.notEqual(a, b);
  });

  it("stays the same within a 5-minute CRE bucket", () => {
    // Base is pinned to a bucket boundary (300-second aligned) so the +299
    // offset is guaranteed to land in the same bucket, not accidentally
    // straddle a boundary.
    const base = 1_700_000_100; // 300 * 5_666_667
    const sameBucket = idempotencyKeyFor(SAMPLE_PAYMENT, BigInt(1), base);
    const sameBucketLater = idempotencyKeyFor(SAMPLE_PAYMENT, BigInt(1), base + 299);
    assert.equal(sameBucket, sameBucketLater);
  });

  it("differs across adjacent 5-minute buckets", () => {
    const base = 1_700_000_100; // same aligned boundary
    const a = idempotencyKeyFor(SAMPLE_PAYMENT, BigInt(1), base);
    const b = idempotencyKeyFor(SAMPLE_PAYMENT, BigInt(1), base + 300);
    assert.notEqual(a, b);
  });
});

describe("mandateCommitment", () => {
  const input = {
    mandateId: mandateIdFor("pm_x"),
    merchantAddress: "0x742d35Cc6634C0532925a3b844Bc9e7595f8bEb6" as const,
    idempotencyKey: idempotencyKeyFor(SAMPLE_PAYMENT, BigInt(19_990_000), 1_700_000_000),
    amountMinorUnits: BigInt(19_990_000),
    postedAtSeconds: 1_700_000_000,
    deadlineSeconds: 1_700_000_000 + REG_E_PROVISIONAL_CREDIT_SECONDS,
    envelopeHash: envelopeHashFor("cart_hash_x"),
    sanctionsListVersion: envelopeHashFor("ofac-sdn:2026-10-02"),
    occurrence: 1,
  };

  it("is byte-reproducible", () => {
    assert.equal(mandateCommitment(input), mandateCommitment(input));
  });

  it("is sensitive to the occurrence counter", () => {
    const once = mandateCommitment(input);
    const twice = mandateCommitment({ ...input, occurrence: 2 });
    assert.notEqual(once, twice);
  });

  it("is sensitive to the amount", () => {
    const a = mandateCommitment(input);
    const b = mandateCommitment({ ...input, amountMinorUnits: BigInt(1) });
    assert.notEqual(a, b);
  });
});

describe("toHex32FromBase64Url", () => {
  it("round-trips 32 bytes of base64url to 0x-prefixed hex", () => {
    // 32 bytes of zero
    const b64url = "A".repeat(43); // sufficient length; function normalises padding
    const hex = toHex32FromBase64Url(b64url);
    assert.equal(hex.length, 2 + 64);
    assert.match(hex, /^0x[0-9a-f]{64}$/);
  });

  it("refuses non-32-byte input", () => {
    assert.throws(() => toHex32FromBase64Url("A".repeat(5)), /expected 32-byte/);
  });
});
