import { NextResponse } from "next/server";
import { sessions } from "@/lib/orchestrator/sessions";

export const runtime = "nodejs";

/**
 * GET /api/mandate/receipt/[paymentMandateId]
 *
 * Serves the Beacon receipt for a settled or in-flight AP2 Payment Mandate.
 * The receipt is the compliance-replay artefact a regulator can verify
 * against the on-chain `MandateAnchor.mandateCommitment(mandateId)` view
 * once the anchor address is deployed (Phase B). Phase A returns the
 * off-chain commitment alone, deterministic from the AP2 Mandate pair.
 */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ paymentMandateId: string }> },
) {
  const { paymentMandateId } = await params;
  if (!paymentMandateId) {
    return NextResponse.json(
      { ok: false, error: "paymentMandateId path segment is required" },
      { status: 400 },
    );
  }

  const session = await sessions.get(paymentMandateId);
  if (!session) {
    return NextResponse.json(
      {
        ok: false,
        payment_mandate_id: paymentMandateId,
        error: "no session found — webhook has not posted this mandate",
      },
      { status: 404 },
    );
  }

  if (!session.beaconReceipt) {
    return NextResponse.json(
      {
        ok: false,
        payment_mandate_id: paymentMandateId,
        error:
          "session predates Beacon wiring — reposting the mandate will attach a receipt",
      },
      { status: 409 },
    );
  }

  return NextResponse.json({
    ok: true,
    payment_mandate_id: paymentMandateId,
    receipt: session.beaconReceipt,
    session_status: session.status,
    inspector_url: `/mandate-inspector/${paymentMandateId}`,
  });
}
