import { Client, Environment } from "@paypal/paypal-server-sdk";
import { serverEnv } from "@/lib/env";

/**
 * PayPal Server SDK client, scoped to the PAYPAL_ENV setting.
 * Covers Orders v2, Payouts, Invoices and refund surfaces.
 */
export function paypalClient() {
  const env = serverEnv();
  return new Client({
    clientCredentialsAuthCredentials: {
      oAuthClientId: env.PAYPAL_CLIENT_ID,
      oAuthClientSecret: env.PAYPAL_CLIENT_SECRET,
    },
    environment:
      env.PAYPAL_ENV === "live" ? Environment.Production : Environment.Sandbox,
  });
}

/**
 * The Cart API (Agentic Commerce) is in limited release and not yet exposed
 * through the Server SDK. Hit it directly via REST with a client-credentials
 * token until the SDK ships the endpoints.
 */
export async function paypalAccessToken(): Promise<string> {
  const env = serverEnv();
  const base =
    env.PAYPAL_ENV === "live"
      ? "https://api-m.paypal.com"
      : "https://api-m.sandbox.paypal.com";
  const credentials = Buffer.from(
    `${env.PAYPAL_CLIENT_ID}:${env.PAYPAL_CLIENT_SECRET}`
  ).toString("base64");
  const res = await fetch(`${base}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${credentials}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
    cache: "no-store",
  });
  if (!res.ok) {
    throw new Error(
      `PayPal token request failed: ${res.status} ${await res.text()}`
    );
  }
  const data = (await res.json()) as { access_token: string };
  return data.access_token;
}

export function paypalBaseUrl(): string {
  const env = serverEnv();
  return env.PAYPAL_ENV === "live"
    ? "https://api-m.paypal.com"
    : "https://api-m.sandbox.paypal.com";
}
