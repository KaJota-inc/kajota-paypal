/**
 * Kajota buyer agent's A2A Agent Card.
 *
 * ERC-8004-shaped — the file a Concordium judge's agent (or x402-doctor's
 * `verifyConcordiumPayees`) fetches at `/.well-known/agent-card.json`
 * before paying this origin. The `capabilities.extensions` block carries
 * the Concordium badge (CIS-2 token address + CAIP-19 form), so the
 * Verified-by-Concordium preflight has a real card to parse.
 *
 * The badge and owner strings are placeholders until the Concordium
 * testnet wallet is funded and the Agent Card is pinned on chain —
 * see `concordium/ccdscan-links.md` for the filled-in versions.
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const CARD = {
  // A2A schema fields
  schemaVersion: "0.4",
  name: "Kajota Buyer Agent",
  description:
    "Kajota's PayPal + AP2 + Mesh buyer agent. Discovers products via Channel3, assembles AP2 Cart + Payment Mandates, pays through PayPal, and settles atomically to merchant + agent + affiliate via the on-chain Mesh escrow. Verified-by-Concordium accountability layer is wired through /api/mcp (verifyConcordium) and surfaces on /chat and /mandate-inspector/*.",
  url: "https://kajota-paypal.vercel.app",
  provider: {
    organization: "Kajota",
    url: "https://kajota-paypal.vercel.app",
  },
  supportedInterfaces: [
    { url: "https://kajota-paypal.vercel.app" },
    { url: "https://kajota-paypal.vercel.app/chat" },
    { url: "https://kajota-paypal.vercel.app/mandate-inspector" },
    { url: "https://kajota-paypal.vercel.app/evidence" },
  ],
  services: [
    {
      endpoint: "https://kajota-paypal.vercel.app/api/chat",
      type: "a2a.conversational",
    },
    {
      endpoint: "https://kajota-paypal.vercel.app/api/mandate/receipt",
      type: "a2a.receipt-lookup",
    },
    {
      endpoint: "https://kajota-paypal.vercel.app/api/mcp",
      type: "a2a.mcp",
    },
  ],
  capabilities: {
    extensions: [
      {
        // Concordium Agent Registry badge (CIS-2 token address + CAIP-19).
        // Replace `tokenAddress` + `caip19` with the live values once the
        // testnet Agent Card has been pinned — see `concordium/ccdscan-links.md`.
        uri: "https://docs.concordium.com/a2a-extensions/concordium-badge/v1",
        description:
          "Verified-by-Concordium badge. Resolved against Concordium's Agent Registry via verifyConcordium (lib/concordium/verify.ts). The Kajota buyer agent gates every x402 payment on the four-state taxonomy (verified-external-key, endpoint-unlisted, mismatch, revoked).",
        params: {
          tokenAddress: "4WU5GvYGYZibDL7SJTGVo9xTiMjSbiHfGX8",
          caip19:
            "ccd:4221332d34e1694168c2a0c0b3fd0f27/cis-2:4WU5GvYGYZibDL7SJTGVo9xTiMjSbiHfGX8",
          chain: "ccd:4221332d34e1694168c2a0c0b3fd0f27",
          network: "testnet",
          externalKeyBindings: [
            {
              caip2: "eip155:84532",
              chain: "base-sepolia",
              publicKeyHex:
                "0x000000000000000000000000000000000000000000000000000000000000000000",
              keyType: "secp256k1-compressed",
            },
            {
              caip2: "eip155:421614",
              chain: "arbitrum-sepolia",
              publicKeyHex:
                "0x000000000000000000000000000000000000000000000000000000000000000000",
              keyType: "secp256k1-compressed",
            },
          ],
        },
      },
      {
        uri: "https://x402.foundation/extensions/x402Support/v1",
        description:
          "This agent accepts x402 payment on Base Sepolia (USDC) and routes settlement through the on-chain Mesh escrow, with Concordium sponsored-fees on testnet when the facilitator.extra.feePayer is set.",
        params: {
          schemes: ["exact", "sponsored"],
          networks: ["eip155:84532", "ccd:4221332d34e1694168c2a0c0b3fd0f27"],
        },
      },
    ],
  },
};

export async function GET() {
  return new Response(JSON.stringify(CARD, null, 2), {
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "public, max-age=60, s-maxage=60",
    },
  });
}
