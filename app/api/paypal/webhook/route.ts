import { NextResponse } from "next/server";
import { z } from "zod";
import type { Address } from "viem";
import {
  readPaypalWebhookHeaders,
  verifyPaypalWebhook,
} from "@/lib/paypal/webhook";
import { settlePaypalOrder } from "@/lib/orchestrator/settle";
import { projectCartToMeshListing } from "@/lib/ap2/mesh-projection";
import {
  CartMandateSchema,
  PaymentMandateSchema,
} from "@/lib/ap2/types";
import {
  sessions,
  type Session,
  type SessionRecipient,
} from "@/lib/orchestrator/sessions";
import { cartMandateHash, paymentMandateContentsHash } from "@/lib/ap2/hash";
import { buildBeaconReceipt } from "@/lib/beacon";
import { beaconReplayStore } from "@/lib/beacon/replay-store";

export const runtime = "nodejs";

// Teach NextResponse.json how to serialize bigints. viem returns bigint for
// amounts, block numbers and gas fields in receipts; settlePaypalOrder's
// projection carries bigint grossAmount; both flow into the response body.
// Without this polyfill NextResponse throws "Do not know how to serialize a
// BigInt" AFTER the on-chain writes have already landed — the caller sees
// 500 and the session is marked `failed` even though the deposit succeeded.
if (!("toJSON" in BigInt.prototype)) {
  (BigInt.prototype as unknown as { toJSON: () => string }).toJSON = function (
    this: bigint,
  ) {
    return this.toString();
  };
}

/**
 * Phase A webhook body shape. In production the AP2 Mandate pair arrives via
 * the PayPal Cart API's custom metadata (TBD during sandbox walk); for now
 * we accept it inline so the pipeline is testable end-to-end with a stubbed
 * webhook post.
 */
const WebhookBodySchema = z.object({
  event_type: z.string(),
  resource: z
    .object({
      id: z.string(),
      custom_id: z.string().optional(),
    })
    .passthrough(),
  cart_mandate: z.unknown(),
  payment_mandate: z.unknown(),
  merchant_address: z.string().regex(/^0x[a-fA-F0-9]{40}$/),
  agent_address: z.string().regex(/^0x[a-fA-F0-9]{40}$/).optional(),
  affiliate_address: z.string().regex(/^0x[a-fA-F0-9]{40}$/).optional(),
}).passthrough();

export async function POST(req: Request) {
  const rawBody = await req.text();
  const headers = readPaypalWebhookHeaders(req.headers);

  // Signature verify — skippable during Phase A sandbox stubbing.
  let signatureVerified = false;
  let signatureSkipReason: string | undefined;
  const sigResult = await verifyPaypalWebhook(headers, rawBody);
  if (sigResult.ok) {
    signatureVerified = true;
  } else {
    signatureSkipReason = sigResult.reason;
  }

  let json: unknown;
  try {
    json = JSON.parse(rawBody);
  } catch {
    return NextResponse.json(
      { ok: false, error: "request body must be valid JSON" },
      { status: 400 },
    );
  }

  const parsed = WebhookBodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      {
        ok: false,
        error: "webhook body shape rejected",
        details: parsed.error.flatten(),
      },
      { status: 400 },
    );
  }
  const body = parsed.data;

  const cartParse = CartMandateSchema.safeParse(body.cart_mandate);
  if (!cartParse.success) {
    return NextResponse.json(
      { ok: false, step: "cart_mandate", error: cartParse.error.flatten() },
      { status: 400 },
    );
  }
  const paymentParse = PaymentMandateSchema.safeParse(body.payment_mandate);
  if (!paymentParse.success) {
    return NextResponse.json(
      { ok: false, step: "payment_mandate", error: paymentParse.error.flatten() },
      { status: 400 },
    );
  }

  const idempotencyKey =
    paymentParse.data.payment_mandate_contents.payment_mandate_id;

  const cached = await sessions.get(idempotencyKey);
  if (cached) {
    return NextResponse.json({
      ok: true,
      idempotent_replay: true,
      payment_mandate_id: idempotencyKey,
      session: cached,
    });
  }

  // Project up front so the Session has recipient rows even if the chain
  // writes throw (which they will until the PYUSD escrow pair is deployed).
  const projection = projectCartToMeshListing({
    cart: cartParse.data,
    merchant: body.merchant_address as Address,
    agent: body.agent_address as Address | undefined,
    affiliate: body.affiliate_address as Address | undefined,
  });

  const recipients: SessionRecipient[] = projection.recipients.map(
    (address, i) => {
      const role =
        i === projection.roleIndex.merchant
          ? "merchant"
          : i === projection.roleIndex.agent
            ? "agent"
            : i === projection.roleIndex.affiliate
              ? "affiliate"
              : "platform";
      return {
        role,
        address,
        shareBps: projection.shares[i] ?? 0,
        payoutMinorUnits: computeShareOffChain(
          projection.grossAmount,
          projection.shares,
          i,
        ).toString(),
      };
    },
  );

  // Mandate Beacon — compliance-replay receipt computed off the Mandate
  // pair before any chain write. The commitment is byte-identical to the
  // on-chain `MandateAnchor.mandateCommitment()` so a regulator replaying
  // this submission later gets the same leaf hash. See docs/MANDATE_BEACON.md
  // and HARD_PARTS §19–§21.
  const beaconReceipt = buildBeaconReceipt(
    {
      cartMandate: cartParse.data,
      paymentMandate: paymentParse.data,
      merchantAddress: body.merchant_address as `0x${string}`,
    },
    { seenIdempotencyKeys: beaconReplayStore },
  );

  const now = new Date().toISOString();
  const initial: Session = {
    paymentMandateId: idempotencyKey,
    paypalOrderId: body.resource.id,
    cartMandateHash: cartMandateHash(cartParse.data.contents),
    paymentMandateContentsHash: paymentMandateContentsHash(
      paymentParse.data.payment_mandate_contents,
    ),
    grossAmountMinorUnits: projection.grossAmount.toString(),
    currency: projection.currency,
    merchantName: cartParse.data.contents.merchant_name,
    recipients,
    status: "pending-register",
    beaconReceipt,
    createdAt: now,
    updatedAt: now,
  };
  await sessions.put(initial);

  try {
    const result = await settlePaypalOrder({
      cartMandate: cartParse.data,
      paymentMandate: paymentParse.data,
      merchant: body.merchant_address as Address,
      agent: body.agent_address as Address | undefined,
      affiliate: body.affiliate_address as Address | undefined,
    });

    const updated = await sessions.patch(idempotencyKey, {
      listingId: result.settlement.listingId,
      depositId: result.settlement.depositId,
      registerTxHash: result.settlement.registerTxHash,
      approveTxHash: result.settlement.approveTxHash,
      depositTxHash: result.settlement.depositTxHash,
      status: "pending-release",
    });

    return NextResponse.json({
      ok: true,
      signature_verified: signatureVerified,
      signature_skip_reason: signatureSkipReason,
      payment_mandate_id: idempotencyKey,
      paypal_resource_id: body.resource.id,
      session: updated,
      ...result,
    });
  } catch (err) {
    const errorReason = (err as Error).message;
    const updated = await sessions.patch(idempotencyKey, {
      status: "failed",
      errorReason,
    });

    return NextResponse.json(
      {
        ok: false,
        signature_verified: signatureVerified,
        signature_skip_reason: signatureSkipReason,
        payment_mandate_id: idempotencyKey,
        error: errorReason,
        session: updated,
      },
      { status: 500 },
    );
  }
}

/**
 * Off-chain mirror of CosellRegistryV2.computeSplit, used to populate the
 * session rows before any on-chain write. Last recipient absorbs the floor
 * remainder so sum(perRecipient) == grossAmount exactly, matching the
 * on-chain invariant byte-for-byte.
 */
function computeShareOffChain(
  grossAmount: bigint,
  shares: readonly number[],
  index: number,
): bigint {
  const n = shares.length;
  if (index < n - 1) {
    return (grossAmount * BigInt(shares[index] ?? 0)) / BigInt(10_000);
  }
  let running = BigInt(0);
  for (let i = 0; i < n - 1; i++) {
    running += (grossAmount * BigInt(shares[i] ?? 0)) / BigInt(10_000);
  }
  return grossAmount - running;
}

export async function GET() {
  return NextResponse.json({
    endpoint: "/api/paypal/webhook",
    accepts: "POST application/json with PayPal transmission headers",
    phase_note:
      "Signature verification works against the PayPal sandbox when PAYPAL_WEBHOOK_ID is set. The on-chain deposit path waits on a funded Arb Sepolia EOA + Paxos PYUSD faucet; everything upstream of the escrow write (schema, jose.jwtVerify, cart_hash, payment_details_id cross-ref, cart_expiry, Beacon receipt, projection) runs end-to-end regardless.",
  });
}
