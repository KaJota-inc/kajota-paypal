import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";

import {
  decimalToMinorUnits,
  DEFAULT_ATTRIBUTION_POLICY,
  projectCartToMeshListing,
} from "../../lib/ap2/mesh-projection";
import type { CartMandate } from "../../lib/ap2/types";

const MERCHANT = "0x742d35Cc6634C0532925a3b844Bc9e7595f8bEb6";
const AGENT = "0x1234567890abcdef1234567890abcdef12345678";
const AFFILIATE = "0xabcdefabcdefabcdefabcdefabcdefabcdefabcd";

function cart(
  value: string,
  currency: string = "USD",
): CartMandate {
  return {
    contents: {
      id: `cart_${randomUUID()}`,
      user_cart_confirmation_required: false,
      payment_request: {
        methodData: [{ supportedMethods: "https://paypal.com/pay" }],
        details: {
          id: `req_${randomUUID()}`,
          total: { label: "Total", amount: { currency, value } },
        },
      },
      cart_expiry: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
      merchant_name: "Demo",
    },
  };
}

describe("decimalToMinorUnits", () => {
  it("parses whole dollars", () => {
    assert.equal(decimalToMinorUnits("100", 6), BigInt(100_000_000));
  });

  it("parses two decimals", () => {
    assert.equal(decimalToMinorUnits("19.99", 6), BigInt(19_990_000));
  });

  it("truncates sub-minor-unit precision silently", () => {
    assert.equal(decimalToMinorUnits("0.1234567", 6), BigInt(123_456));
  });

  it("handles zero", () => {
    assert.equal(decimalToMinorUnits("0", 6), BigInt(0));
    assert.equal(decimalToMinorUnits("0.0", 6), BigInt(0));
  });

  it("refuses non-decimal input", () => {
    assert.throws(() => decimalToMinorUnits("abc", 6), /invalid decimal/);
    assert.throws(() => decimalToMinorUnits("", 6), /invalid decimal/);
    assert.throws(() => decimalToMinorUnits("-5", 6), /invalid decimal/);
  });
});

describe("projectCartToMeshListing", () => {
  it("default 10/20/70 bps when all three parties present", () => {
    const projection = projectCartToMeshListing({
      cart: cart("100"),
      merchant: MERCHANT,
      agent: AGENT,
      affiliate: AFFILIATE,
    });
    const total = projection.shares.reduce((a, b) => a + b, 0);
    assert.equal(total, 10_000);
    assert.equal(projection.shares[projection.roleIndex.merchant], 7_000);
    assert.equal(projection.shares[projection.roleIndex.agent!], 2_000);
    assert.equal(projection.shares[projection.roleIndex.affiliate!], 1_000);
  });

  it("merchant takes the full residual when agent is omitted", () => {
    const projection = projectCartToMeshListing({
      cart: cart("100"),
      merchant: MERCHANT,
      affiliate: AFFILIATE,
    });
    assert.equal(projection.shares.reduce((a, b) => a + b, 0), 10_000);
    assert.equal(projection.recipients.length, 2);
    assert.equal(projection.shares[projection.roleIndex.merchant], 9_000);
    assert.equal(projection.shares[projection.roleIndex.affiliate!], 1_000);
    assert.equal(projection.roleIndex.agent, undefined);
  });

  it("refuses to produce a single-recipient listing (merchant-only)", () => {
    assert.throws(
      () =>
        projectCartToMeshListing({
          cart: cart("100"),
          merchant: MERCHANT,
        }),
      /at least two recipients/,
    );
  });

  it("refuses an attribution policy that leaves the merchant with ≤ 0 bps", () => {
    assert.throws(
      () =>
        projectCartToMeshListing({
          cart: cart("100"),
          merchant: MERCHANT,
          agent: AGENT,
          affiliate: AFFILIATE,
          policy: { affiliateBps: 1_000, agentBps: 9_500 },
        }),
      /merchant with/,
    );
  });

  it("converts the cart's decimal total into PYUSD minor units", () => {
    const projection = projectCartToMeshListing({
      cart: cart("19.99"),
      merchant: MERCHANT,
      agent: AGENT,
    });
    assert.equal(projection.grossAmount, BigInt(19_990_000));
    assert.equal(projection.currency, "USD");
  });

  it("preserves the Cart's currency label in the projection", () => {
    const projection = projectCartToMeshListing({
      cart: cart("100", "EUR"),
      merchant: MERCHANT,
      agent: AGENT,
    });
    assert.equal(projection.currency, "EUR");
  });

  it("default policy matches DEFAULT_ATTRIBUTION_POLICY constants", () => {
    assert.equal(DEFAULT_ATTRIBUTION_POLICY.affiliateBps, 1_000);
    assert.equal(DEFAULT_ATTRIBUTION_POLICY.agentBps, 2_000);
  });
});
