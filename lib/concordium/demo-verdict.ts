/**
 * Phase A verdict helper. Same deterministic output as the /chat SSE
 * stream, so the Mandate Inspector annotation row matches the toast a
 * judge sees on /chat. Phase B swaps this for a cached call to
 * `verifyConcordium` against the real merchant origin.
 */

import { ccdScanAccountUrl, type Verdict } from "@/lib/concordium/verify";

const DEMO_TOKEN = "4WU5GvYGYZibDL7SJTGVo9xTiMjSbiHfGX8";
const DEMO_OWNER = "4owner0DEMO000000000000000000000000000000000000AB";

export type DemoVerdict = Verdict & {
  ownerExplorerUrl: string | null;
  agentExplorerUrl: string | null;
  boundKeys: { chain: string; address: string }[];
};

export function demoVerdictForMerchant(merchant: string): DemoVerdict {
  // The three fan-out recipients Kajota demos — all three resolve to the
  // same Verified-by-Concordium record because the agent is Kajota's buyer
  // agent, not the merchant storefront.
  void merchant;
  return {
    code: "verified-external-key",
    level: "info",
    tokenAddress: DEMO_TOKEN,
    owner: DEMO_OWNER,
    agentUri:
      "https://kajota-paypal.vercel.app/.well-known/agent-card.json",
    network: "testnet",
    reasons: [
      {
        level: "info",
        code: "concordium_verified",
        message:
          "Verified by Concordium: the payout address on Base Sepolia belongs to Concordium agent #KAJOTA-DEMO, whose owner is an identity-verified account.",
      },
    ],
    ownerExplorerUrl: ccdScanAccountUrl(DEMO_OWNER, "testnet"),
    agentExplorerUrl: ccdScanAccountUrl(DEMO_TOKEN, "testnet"),
    boundKeys: [
      {
        chain: "Base Sepolia",
        address: "0xagent0000000000000000000000000000000000AB",
      },
      {
        chain: "Arb Sepolia",
        address: "0xagent0000000000000000000000000000000000AB",
      },
    ],
  };
}
