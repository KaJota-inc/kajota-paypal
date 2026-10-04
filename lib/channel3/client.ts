import { serverEnv } from "@/lib/env";

/**
 * Minimum-viable Channel3 client. The /v1/search endpoint returns product
 * offers from across the open commerce web with optional affiliate commission
 * attribution — exactly the shape Mesh needs as a payout fan-out source.
 */

export type Channel3Offer = {
  productId: string;
  title: string;
  priceCents: number;
  currency: string;
  merchantDomain: string;
  productUrl: string;
  imageUrl?: string;
  affiliate?: {
    networkId: string;
    commissionBps: number;
    payoutAddress?: `0x${string}`;
  };
};

export type Channel3SearchResponse = {
  query: string;
  offers: Channel3Offer[];
};

export async function channel3Search(query: string, limit = 10): Promise<Channel3SearchResponse> {
  const env = serverEnv();
  const url = new URL("/v1/search", env.CHANNEL3_BASE_URL);
  url.searchParams.set("q", query);
  url.searchParams.set("limit", String(limit));

  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${env.CHANNEL3_API_KEY}`,
      Accept: "application/json",
    },
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error(
      `Channel3 search failed: ${res.status} ${await res.text()}`
    );
  }

  return (await res.json()) as Channel3SearchResponse;
}
