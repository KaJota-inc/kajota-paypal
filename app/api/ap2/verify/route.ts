import { NextResponse } from "next/server";
import { importSPKI } from "jose";
import { z } from "zod";
import { verifyCartMandate, verifyPaymentMandate } from "@/lib/ap2/verify";

export const runtime = "nodejs";

const RequestSchema = z.object({
  cart_mandate: z.unknown(),
  payment_mandate: z.unknown(),
  /**
   * Merchant verifier key in PEM form (ES256 / ECDSA P-256). If omitted, the
   * Cart Mandate's JWT signature is not checked — useful during Phase A when
   * the sandbox has no stable merchant key, but the response will clearly
   * flag the gap. In production this field is required.
   */
  merchant_public_key_pem: z.string().optional(),
});

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { ok: false, error: "request body must be valid JSON" },
      { status: 400 },
    );
  }

  const parsed = RequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const { cart_mandate, payment_mandate, merchant_public_key_pem } = parsed.data;

  let cartVerified = false;
  let cartReason: string | undefined;
  if (merchant_public_key_pem) {
    const key = await importSPKI(merchant_public_key_pem, "ES256");
    const cartResult = await verifyCartMandate(cart_mandate, key);
    if (!cartResult.ok) {
      return NextResponse.json(
        {
          ok: false,
          step: "cart",
          stage: cartResult.stage,
          error: cartResult.reason,
        },
        { status: 422 },
      );
    }
    cartVerified = true;
  } else {
    cartReason =
      "merchant_public_key_pem not supplied; Cart Mandate signature NOT verified (Phase A)";
  }

  const paymentResult = await verifyPaymentMandate(payment_mandate, cart_mandate);
  if (!paymentResult.ok) {
    return NextResponse.json(
      {
        ok: false,
        step: "payment",
        stage: paymentResult.stage,
        error: paymentResult.reason,
      },
      { status: 422 },
    );
  }

  return NextResponse.json({
    ok: true,
    cart_mandate_signature_verified: cartVerified,
    cart_mandate_unsigned_reason: cartReason,
    payment_mandate_structurally_verified: true,
    sd_jwt_vc_signature_verified: false,
    phase_note:
      "Phase A — structural + cross-reference checks only. SD-JWT-VC signature verification and transaction_data hash cross-check land in Phase B.",
  });
}

export async function GET() {
  return NextResponse.json({
    endpoint: "/api/ap2/verify",
    accepts: "POST application/json",
    body_shape: {
      cart_mandate: "AP2 CartMandate object",
      payment_mandate: "AP2 PaymentMandate object",
      merchant_public_key_pem: "SPKI PEM (ES256), optional during Phase A",
    },
    spec: "https://ap2-protocol.org/ap2/",
  });
}
