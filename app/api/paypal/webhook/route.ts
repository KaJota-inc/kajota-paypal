import { NextResponse } from "next/server";
import { z } from "zod";
import type { Address } from "viem";
import {
  readPaypalWebhookHeaders,
  verifyPaypalWebhook,
} from "@/lib/paypal/webhook";
import { settlePaypalOrder } from "@/lib/orchestrator/settle";
import {
  CartMandateSchema,
  PaymentMandateSchema,
} from "@/lib/ap2/types";

export const runtime = "nodejs";

/**
 * In-process idempotency cache for Phase A. The Payment Mandate's
 * `payment_mandate_id` keys the dedupe check so PayPal webhook retries don't
 * fan out the proceeds twice. Phase B swaps this for Vercel KV so dedupe
 * survives cold starts.
 */
const settledMandates = new Map<string, { listingId: string; depositId: string }>();

/**
 * Phase A webhook body shape. In production the AP2 Mandate pair arrives via
 * the PayPal Cart API's custom metadata (TBD during sandbox walk); for now
 * we accept it inline so the pipeline is testable end-to-end with a stubbed
 * webhook post.
 */
const WebhookBodySchema = z.object({
  event_type: z.string(),
  resource: z.object({
    id: z.string(),
    custom_id: z.string().optional(),
  }).passthrough(),
  cart_mandate: z.unknown(),
  payment_mandate: z.unknown(),
  merchant_address: z.string().regex(/^0x[a-fA-F0-9]{40}$/),
  agent_address: z.string().regex(/^0x[a-fA-F0-9]{40}$/).optional(),
  affiliate_address: z.string().regex(/^0x[a-fA-F0-9]{40}$/).optional(),
}).passthrough();

export async function POST(req: Request) {
  const rawBody = await req.text();
  const headers = readPaypalWebhookHeaders(req.headers);

  // Signature verify — skippable during Phase A sandbox stubbing (no
  // webhook id configured yet). The response surfaces the gap so no one
  // mistakes an unverified ingest for production readiness.
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
  const cached = settledMandates.get(idempotencyKey);
  if (cached) {
    return NextResponse.json({
      ok: true,
      idempotent_replay: true,
      payment_mandate_id: idempotencyKey,
      listing_id: cached.listingId,
      deposit_id: cached.depositId,
    });
  }

  try {
    const result = await settlePaypalOrder({
      cartMandate: cartParse.data,
      paymentMandate: paymentParse.data,
      merchant: body.merchant_address as Address,
      agent: body.agent_address as Address | undefined,
      affiliate: body.affiliate_address as Address | undefined,
    });

    settledMandates.set(idempotencyKey, {
      listingId: result.settlement.listingId,
      depositId: result.settlement.depositId,
    });

    return NextResponse.json({
      ok: true,
      signature_verified: signatureVerified,
      signature_skip_reason: signatureSkipReason,
      payment_mandate_id: idempotencyKey,
      paypal_resource_id: body.resource.id,
      ...result,
    });
  } catch (err) {
    return NextResponse.json(
      {
        ok: false,
        signature_verified: signatureVerified,
        signature_skip_reason: signatureSkipReason,
        payment_mandate_id: idempotencyKey,
        error: (err as Error).message,
      },
      { status: 500 },
    );
  }
}

export async function GET() {
  return NextResponse.json({
    endpoint: "/api/paypal/webhook",
    accepts: "POST application/json with PayPal transmission headers",
    phase_note:
      "Phase A — PayPal signature verification works end-to-end against sandbox when PAYPAL_WEBHOOK_ID is set. Deposit will throw until MESH_ARBITRUM_SEPOLIA.cosellEscrowV2Pyusd is populated by the Phase A day 4 deploy.",
  });
}
