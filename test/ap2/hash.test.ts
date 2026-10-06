import { describe, it } from "node:test";
import assert from "node:assert/strict";

import {
  canonicalJson,
  cartMandateHash,
  paymentMandateContentsHash,
  sha256Base64Url,
} from "../../lib/ap2/hash";

describe("canonicalJson", () => {
  it("sorts object keys lexicographically", () => {
    const a = canonicalJson({ b: 2, a: 1 });
    const b = canonicalJson({ a: 1, b: 2 });
    assert.equal(a, b);
    assert.equal(a, '{"a":1,"b":2}');
  });

  it("recurses into nested objects", () => {
    const a = canonicalJson({ x: { b: 2, a: 1 }, y: 3 });
    const b = canonicalJson({ y: 3, x: { a: 1, b: 2 } });
    assert.equal(a, b);
  });

  it("preserves array order", () => {
    const a = canonicalJson([3, 1, 2]);
    assert.equal(a, "[3,1,2]");
  });

  it("round-trips primitives", () => {
    assert.equal(canonicalJson(null), "null");
    assert.equal(canonicalJson(0), "0");
    assert.equal(canonicalJson(""), '""');
    assert.equal(canonicalJson(true), "true");
  });

  it("escapes strings per JSON.stringify", () => {
    assert.equal(canonicalJson("a\nb"), '"a\\nb"');
    assert.equal(canonicalJson('"'), '"\\""');
  });
});

describe("sha256Base64Url", () => {
  it("produces 43 base64url characters (no padding) for sha256 output", () => {
    const digest = sha256Base64Url("hello");
    assert.equal(digest.length, 43);
    assert.doesNotMatch(digest, /=/);
    assert.doesNotMatch(digest, /\+/);
    assert.doesNotMatch(digest, /\//);
  });

  it("is deterministic", () => {
    assert.equal(sha256Base64Url("hello"), sha256Base64Url("hello"));
  });

  it("differs across inputs", () => {
    assert.notEqual(sha256Base64Url("hello"), sha256Base64Url("world"));
  });
});

describe("cartMandateHash / paymentMandateContentsHash", () => {
  it("cart hashes agree across key order", () => {
    const a = cartMandateHash({ id: "x", merchant_name: "M" });
    const b = cartMandateHash({ merchant_name: "M", id: "x" });
    assert.equal(a, b);
  });

  it("payment contents hash is sensitive to amount changes", () => {
    const base = {
      payment_mandate_id: "pm_1",
      payment_details_id: "req_1",
      payment_details_total: {
        label: "Total",
        amount: { currency: "USD", value: "19.99" },
      },
      merchant_agent: "did:web:demo",
      timestamp: "2026-10-06T00:00:00Z",
    };
    const same = { ...base };
    const bigger = {
      ...base,
      payment_details_total: {
        label: "Total",
        amount: { currency: "USD", value: "20.00" },
      },
    };
    assert.equal(
      paymentMandateContentsHash(base),
      paymentMandateContentsHash(same),
    );
    assert.notEqual(
      paymentMandateContentsHash(base),
      paymentMandateContentsHash(bigger),
    );
  });
});
