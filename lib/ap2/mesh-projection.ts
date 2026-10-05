import type { Address } from "viem";
import { getAddress } from "viem";
import type { CartMandate } from "./types";

/**
 * The attribution policy decides how a PayPal order's proceeds are divided
 * between the merchant, the AI agent that closed the sale, and the affiliate
 * that referred the product. Mesh enforces the share table on-chain; this
 * module turns a Cart Mandate plus side-channel attribution into that table.
 *
 * The policy is pluggable so a demo can show a merchant tuning it in the
 * dashboard. The default below is the shape used in the pitch and the
 * demo-video storyboard: 70 / 20 / 10 when all three parties are present,
 * degrading gracefully when the agent or the affiliate is absent.
 */

const BPS_DENOMINATOR = 10_000 as const;

export type AttributionPolicy = {
  /** Share for the affiliate, in basis points. Capped by 10 000 total. */
  affiliateBps: number;
  /** Share for the agent that closed the sale, in basis points. */
  agentBps: number;
};

export const DEFAULT_ATTRIBUTION_POLICY: AttributionPolicy = {
  affiliateBps: 1_000,
  agentBps: 2_000,
};

export type ProjectionInput = {
  cart: CartMandate;
  merchant: Address;
  agent?: Address;
  affiliate?: Address;
  policy?: AttributionPolicy;
};

export type MeshListingTuple = {
  productId: string;
  recipients: readonly Address[];
  shares: readonly number[];
  currency: string;
  grossAmount: bigint;
  roleIndex: {
    merchant: number;
    agent?: number;
    affiliate?: number;
  };
};

/**
 * Project an AP2 Cart Mandate into the exact tuple
 * `CosellRegistryV2.register(productId, recipients[], shares[], currency)`
 * will accept.
 *
 * The function enforces the sum-to-10-000-bps invariant client-side to catch
 * attribution-policy mistakes before they hit the chain — the registry's own
 * revert is correct but costs a round-trip, so the mirror check is useful.
 * Policy shares are applied in the order [affiliate, agent, merchant-residual];
 * the merchant always absorbs whatever is left.
 */
export function projectCartToMeshListing(input: ProjectionInput): MeshListingTuple {
  const policy = input.policy ?? DEFAULT_ATTRIBUTION_POLICY;
  const details = input.cart.contents.payment_request.details;
  const currency = details.total.amount.currency;
  const grossAmount = decimalToMinorUnits(details.total.amount.value, 6);

  const recipients: Address[] = [];
  const shares: number[] = [];
  const roleIndex: MeshListingTuple["roleIndex"] = { merchant: -1 };

  // Policy order: affiliate first, then agent, then merchant mops up the
  // residual. The merchant must always be present and must receive > 0 bps.
  let residualBps = BPS_DENOMINATOR;

  if (input.affiliate && policy.affiliateBps > 0) {
    recipients.push(getAddress(input.affiliate));
    shares.push(policy.affiliateBps);
    roleIndex.affiliate = recipients.length - 1;
    residualBps -= policy.affiliateBps;
  }

  if (input.agent && policy.agentBps > 0) {
    recipients.push(getAddress(input.agent));
    shares.push(policy.agentBps);
    roleIndex.agent = recipients.length - 1;
    residualBps -= policy.agentBps;
  }

  if (residualBps <= 0) {
    throw new Error(
      `attribution policy leaves the merchant with ${residualBps} bps; must be > 0`,
    );
  }
  recipients.push(getAddress(input.merchant));
  shares.push(residualBps);
  roleIndex.merchant = recipients.length - 1;

  if (recipients.length < 2) {
    throw new Error(
      "Mesh requires at least two recipients; a single-payee order should go straight to PayPal without Mesh",
    );
  }

  const total = shares.reduce((acc, s) => acc + s, 0);
  if (total !== BPS_DENOMINATOR) {
    throw new Error(
      `shares must sum to ${BPS_DENOMINATOR} bps; got ${total}`,
    );
  }

  return {
    productId: input.cart.contents.id,
    recipients,
    shares,
    currency,
    grossAmount,
    roleIndex,
  };
}

/**
 * Parse a W3C PaymentCurrencyAmount decimal string into minor units of the
 * target token.
 *
 * `"19.99"` + `6` → `19_990_000n` (PYUSD, USDG, USDC all use 6 decimals on
 * Arbitrum Sepolia).
 */
export function decimalToMinorUnits(value: string, decimals: number): bigint {
  if (!/^\d+(\.\d+)?$/.test(value)) {
    throw new Error(`invalid decimal value: ${value}`);
  }
  const [intPart, fracPart = ""] = value.split(".");
  const padded = (fracPart + "0".repeat(decimals)).slice(0, decimals);
  const combined = (intPart + padded).replace(/^0+(?=\d)/, "") || "0";
  return BigInt(combined);
}
