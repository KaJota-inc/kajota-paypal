import { NextResponse } from "next/server";
import { sessions } from "@/lib/orchestrator/sessions";

export const runtime = "nodejs";

/**
 * List every settled or in-flight PayPal order on the merchant dashboard.
 * Rows come back newest-first so the dashboard's AG Grid shows the latest
 * activity at the top without client-side sorting.
 */
export async function GET() {
  const rows = await sessions.list();
  return NextResponse.json({
    ok: true,
    count: rows.length,
    sessions: rows,
  });
}
