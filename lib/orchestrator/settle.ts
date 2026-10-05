import type { Address, Hex } from "viem";
import { verifyCartMandate, verifyPaymentMandate } from "@/lib/ap2/verify";
import { projectCartToMeshListing } from "@/lib/ap2/mesh-projection";
import type {
  AttributionPolicy,
  MeshListingTuple,
} from "@/lib/ap2/mesh-projection";
import { registerListing } from "@/lib/mesh/registry";
import { depositPyusd } from "@/lib/mesh/escrow";
import type { CartMandate, PaymentMandate } from "@/lib/ap2/types";

export type SettleInput = {
  cartMandate: CartMandate;
  paymentMandate: PaymentMandate;
  merchant: Address;
  agent?: Address;
  affiliate?: Address;
  policy?: AttributionPolicy;
  /**
   * When supplied, the Cart Mandate's `merchant_authorization` JWT is
   * verified against this public key (SPKI PEM, ES256). Omit during Phase A
   * sandbox stubbing — the response flags the gap in `verification` below.
   */
  merchantPublicKey?: CryptoKey | Uint8Array;
};

export type SettleResult = {
  verification: {
    cartMandateSignatureVerified: boolean;
    paymentMandateStructurallyVerified: boolean;
    sdJwtVcSignatureVerified: false;
  };
  projection: MeshListingTuple;
  settlement: {
    listingId: Hex;
    depositId: Hex;
    registerTxHash: Hex;
    approveTxHash: Hex;
    depositTxHash: Hex;
  };
};

/**
 * Compose the end-to-end settle pipeline:
 *
 *   verify Cart Mandate (optional in Phase A)
 *   → verify Payment Mandate (schema + cross-ref)
 *   → project Cart into a Mesh listing tuple
 *   → register the listing on CosellRegistryV2
 *   → approve PYUSD + deposit on CosellEscrowV2(PYUSD)
 *
 * The release step is deliberately not here — a merchant triggers release
 * from the dashboard (`POST /api/mesh/release`) once shipment is confirmed,
 * or an operator from the admin surface.
 *
 * Idempotency note: the Payment Mandate's `payment_mandate_id` is the
 * durable idempotency key across PayPal webhook retries. Callers (the
 * webhook route in particular) are responsible for the dedupe check before
 * invoking this function. In Phase B that check lives in Vercel KV.
 */
export async function settlePaypalOrder(
  input: SettleInput,
): Promise<SettleResult> {
  let cartMandateSignatureVerified = false;
  if (input.merchantPublicKey) {
    const cartResult = await verifyCartMandate(
      input.cartMandate,
      input.merchantPublicKey,
    );
    if (!cartResult.ok) {
      throw new Error(
        `Cart Mandate verification failed at ${cartResult.stage}: ${cartResult.reason}`,
      );
    }
    cartMandateSignatureVerified = true;
  }

  const paymentResult = await verifyPaymentMandate(
    input.paymentMandate,
    input.cartMandate,
  );
  if (!paymentResult.ok) {
    throw new Error(
      `Payment Mandate verification failed at ${paymentResult.stage}: ${paymentResult.reason}`,
    );
  }

  const projection = projectCartToMeshListing({
    cart: input.cartMandate,
    merchant: input.merchant,
    agent: input.agent,
    affiliate: input.affiliate,
    policy: input.policy,
  });

  const { listingId, txHash: registerTxHash } = await registerListing({
    productId: projection.productId,
    recipients: projection.recipients,
    shares: projection.shares,
    currency: projection.currency,
  });

  const { depositId, approveTxHash, depositTxHash } = await depositPyusd({
    listingId,
    grossAmount: projection.grossAmount,
  });

  return {
    verification: {
      cartMandateSignatureVerified,
      paymentMandateStructurallyVerified: true,
      sdJwtVcSignatureVerified: false,
    },
    projection,
    settlement: {
      listingId,
      depositId,
      registerTxHash,
      approveTxHash,
      depositTxHash,
    },
  };
}
