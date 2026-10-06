/**
 * Shared Beacon fixture: a minimum-valid AP2 Mandate pair used by the
 * replay-within-ttl and sanctions-list-drift reproducers. Kept adjacent to
 * the reproducers so the fixture is one `cd scripts/fail && ls` away.
 */

import type { CartMandate, PaymentMandate } from "../../lib/ap2/types";

export function fixture() {
  const paymentDetailsId = "req_beacon_fixture_1";
  const cart: CartMandate = {
    contents: {
      id: "cart_beacon_fixture_1",
      user_cart_confirmation_required: false,
      payment_request: {
        methodData: [{ supportedMethods: "https://paypal.com/pay" }],
        details: {
          id: paymentDetailsId,
          total: {
            label: "Total",
            amount: { currency: "USD", value: "19.99" },
          },
        },
      },
      cart_expiry: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
      merchant_name: "Beacon Fixture Merchant",
    },
  };

  const payment: PaymentMandate = {
    payment_mandate_contents: {
      payment_mandate_id: "pm_beacon_fixture_1",
      payment_details_id: paymentDetailsId,
      payment_details_total: {
        label: "Total",
        amount: { currency: "USD", value: "19.99" },
      },
      payment_response: {
        requestId: paymentDetailsId,
        methodName: "https://paypal.com/pay",
        details: {},
      },
      merchant_agent: "did:web:beacon-fixture.example",
      timestamp: new Date("2026-10-06T12:00:00Z").toISOString(),
    },
  };

  const merchant = "0x742d35Cc6634C0532925a3b844Bc9e7595f8bEb6" as const;

  return { cart, payment, merchant };
}
