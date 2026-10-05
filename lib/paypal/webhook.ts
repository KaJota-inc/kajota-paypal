import { paypalAccessToken, paypalBaseUrl } from "./client";
import { serverEnv } from "@/lib/env";

/**
 * PayPal webhook signature headers. The signature covers the raw request
 * body plus a canonical string built from these headers and the configured
 * webhook id.
 */
export type PaypalWebhookHeaders = {
  "paypal-auth-algo": string;
  "paypal-cert-url": string;
  "paypal-transmission-id": string;
  "paypal-transmission-sig": string;
  "paypal-transmission-time": string;
};

export function readPaypalWebhookHeaders(h: Headers): PaypalWebhookHeaders {
  return {
    "paypal-auth-algo": h.get("paypal-auth-algo") ?? "",
    "paypal-cert-url": h.get("paypal-cert-url") ?? "",
    "paypal-transmission-id": h.get("paypal-transmission-id") ?? "",
    "paypal-transmission-sig": h.get("paypal-transmission-sig") ?? "",
    "paypal-transmission-time": h.get("paypal-transmission-time") ?? "",
  };
}

/**
 * Verify a PayPal webhook event via PayPal's own
 * `/v1/notifications/verify-webhook-signature` endpoint.
 *
 * Easier to maintain than re-implementing the signature-string construction
 * locally, and the official pattern recommended by PayPal's developer docs.
 * Requires PAYPAL_WEBHOOK_ID to be set to the id of the webhook that
 * actually received this transmission.
 *
 * Phase A: works end-to-end against the sandbox. The Phase B swap — if we
 * want to drop the extra API call — would re-implement signature-string
 * construction + cert fetch + verify via `jose.compactVerify`.
 */
export async function verifyPaypalWebhook(
  headers: PaypalWebhookHeaders,
  rawEventBody: string,
): Promise<{ ok: boolean; reason?: string }> {
  const env = serverEnv();
  if (!env.PAYPAL_WEBHOOK_ID) {
    return {
      ok: false,
      reason: "PAYPAL_WEBHOOK_ID not configured — cannot verify signature",
    };
  }

  const token = await paypalAccessToken();
  const base = paypalBaseUrl();

  let event: unknown;
  try {
    event = JSON.parse(rawEventBody);
  } catch {
    return { ok: false, reason: "event body is not valid JSON" };
  }

  const res = await fetch(`${base}/v1/notifications/verify-webhook-signature`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      auth_algo: headers["paypal-auth-algo"],
      cert_url: headers["paypal-cert-url"],
      transmission_id: headers["paypal-transmission-id"],
      transmission_sig: headers["paypal-transmission-sig"],
      transmission_time: headers["paypal-transmission-time"],
      webhook_id: env.PAYPAL_WEBHOOK_ID,
      webhook_event: event,
    }),
  });

  if (!res.ok) {
    return {
      ok: false,
      reason: `verify-webhook-signature API returned ${res.status}: ${await res.text()}`,
    };
  }

  const payload = (await res.json()) as { verification_status?: string };
  return payload.verification_status === "SUCCESS"
    ? { ok: true }
    : {
        ok: false,
        reason: `verification_status = ${payload.verification_status ?? "<missing>"}`,
      };
}
