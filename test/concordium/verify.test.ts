import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";

import {
  concordiumReasons,
  crossDayDiff,
  toVerdict,
  verdict,
  verifyConcordium,
  type FetchLike,
  type PaymentOption,
  type RegistryCall,
} from "../../lib/concordium/verify";

// Test fixture: the Kajota seller's x402 origin, its agent-card.json, and
// the Concordium testnet registry record that card's badge resolves to.
const SELLER = "https://seller.example";
const CARD_URL = `${SELLER}/.well-known/agent-card.json`;
const AGENT_URI_HOST = "https://card.kajota.example";
const BADGE = "4WU5GvYGYZibDL7SJTGVo9xTiMjSbiHfGX8"; // a plausible CIS-2 token addr
const OWNER = "4owner000000000000000000000000000000000000000000AB";
const BOUND_EVM = "0xagent0000000000000000000000000000000000AB";
const UNRELATED_EVM = "0xBAD0000000000000000000000000000000000BAD";

function sellerCard(url = SELLER) {
  return JSON.stringify({
    url,
    capabilities: {
      extensions: [
        {
          uri: "https://docs.concordium.com/a2a-extensions/concordium-badge/v1",
          params: {
            tokenAddress: BADGE,
            caip19: `ccd:4221332d34e1694168c2a0c0b3fd0f27/cis-2:${BADGE}`,
            chain: "ccd:4221332d34e1694168c2a0c0b3fd0f27",
          },
        },
      ],
    },
  });
}

function anchoredCardHashHex(body: string) {
  return createHash("sha256").update(Buffer.from(body, "utf8")).digest("hex");
}

/** Build a fetchLike + registryCall pair around a scripted scenario. */
function world({
  cardAtSellerOrigin,
  cardAtAgentUri,
  status = "Active",
  externalKey = {
    chainFamily: "eip155" as const,
    address: BOUND_EVM,
  },
  agentWallet = null as string | null,
}: {
  cardAtSellerOrigin: string | null;
  cardAtAgentUri: string | null;
  status?: string;
  externalKey?: { chainFamily?: "eip155" | "solana"; address?: string } | null;
  agentWallet?: string | null;
}) {
  const safeFetch: FetchLike = async (url) => {
    if (url === CARD_URL && cardAtSellerOrigin !== null)
      return { status: 200, text: cardAtSellerOrigin };
    if (url.startsWith(AGENT_URI_HOST) && cardAtAgentUri !== null)
      return { status: 200, text: cardAtAgentUri };
    return { status: 404, text: "" };
  };
  const registryCall: RegistryCall = async (tool, args) => {
    assert.equal(tool, "agent_by_token_address");
    assert.equal((args as { token_address: string }).token_address, BADGE);
    return {
      token_id: 42,
      owner_account: OWNER,
      agent_wallet: agentWallet,
      status,
      agent_uri: `${AGENT_URI_HOST}/kajota-card.json`,
      metadata_hash_hex:
        cardAtAgentUri !== null ? anchoredCardHashHex(cardAtAgentUri) : "",
      external_reference: externalKey ? { key: externalKey } : {},
    };
  };
  return { safeFetch, registryCall };
}

describe("concordium/verify — four-state taxonomy", () => {
  it("verified-external-key: payTo matches the CIS-8 bound EVM key → go", async () => {
    // The anchored card must list the seller origin, otherwise it's
    // endpoint-unlisted.
    const anchored = JSON.stringify({ url: SELLER });
    const { safeFetch, registryCall } = world({
      cardAtSellerOrigin: sellerCard(),
      cardAtAgentUri: anchored,
    });
    const options: PaymentOption[] = [
      { network: "eip155:8453", payTo: BOUND_EVM },
    ];
    const v = await verifyConcordium(options, {
      url: `${SELLER}/pay`,
      safeFetch,
      registryCall,
    });
    assert.equal(v.results.length, 1);
    assert.equal(v.results[0].outcome, "verified-external-key");
    const reasons = concordiumReasons(v, options);
    assert.equal(verdict(reasons), "go");
    assert.deepEqual(
      reasons.map((r) => r.code),
      ["concordium_verified"],
    );
    const out = toVerdict(v, reasons);
    assert.equal(out.code, "verified-external-key");
    assert.equal(out.level, "info");
    assert.equal(out.tokenAddress, BADGE);
    assert.equal(out.network, "testnet");
  });

  it("mismatch: payTo is not the CIS-8 bound key → caution concordium_payto_mismatch", async () => {
    const anchored = JSON.stringify({ url: SELLER });
    const { safeFetch, registryCall } = world({
      cardAtSellerOrigin: sellerCard(),
      cardAtAgentUri: anchored,
    });
    const options: PaymentOption[] = [
      { network: "eip155:8453", payTo: UNRELATED_EVM },
    ];
    const v = await verifyConcordium(options, {
      url: `${SELLER}/pay`,
      safeFetch,
      registryCall,
    });
    assert.equal(v.results[0].outcome, "mismatch");
    const reasons = concordiumReasons(v, options);
    assert.equal(verdict(reasons), "caution");
    assert.ok(reasons.some((r) => r.code === "concordium_payto_mismatch"));
  });

  it("endpoint-unlisted: anchored card doesn't list this origin → caution", async () => {
    // The anchored card only lists card.kajota.example as its url — the
    // seller's own origin is nowhere in the card. A copycat would hit this.
    const anchored = JSON.stringify({ url: AGENT_URI_HOST });
    const { safeFetch, registryCall } = world({
      cardAtSellerOrigin: sellerCard(),
      cardAtAgentUri: anchored,
    });
    const options: PaymentOption[] = [
      { network: "eip155:8453", payTo: BOUND_EVM },
    ];
    const v = await verifyConcordium(options, {
      url: `${SELLER}/pay`,
      safeFetch,
      registryCall,
    });
    assert.equal(v.results[0].outcome, "endpoint-unlisted");
    const reasons = concordiumReasons(v, options);
    assert.equal(verdict(reasons), "caution");
    assert.equal(reasons[0].code, "concordium_endpoint_unlisted");
  });

  it("revoked: registry status is not Active → caution concordium_revoked", async () => {
    const anchored = JSON.stringify({ url: SELLER });
    const { safeFetch, registryCall } = world({
      cardAtSellerOrigin: sellerCard(),
      cardAtAgentUri: anchored,
      status: "Revoked",
    });
    const options: PaymentOption[] = [
      { network: "eip155:8453", payTo: BOUND_EVM },
    ];
    const v = await verifyConcordium(options, {
      url: `${SELLER}/pay`,
      safeFetch,
      registryCall,
    });
    assert.equal(v.results[0].outcome, "revoked");
    const reasons = concordiumReasons(v, options);
    assert.equal(verdict(reasons), "caution");
    assert.equal(reasons[0].code, "concordium_revoked");
  });

  it("no badge on seller card → agent=null, buyer flow unaffected", async () => {
    const { safeFetch, registryCall } = world({
      cardAtSellerOrigin: JSON.stringify({ url: SELLER }),
      cardAtAgentUri: null,
    });
    const v = await verifyConcordium(
      [{ network: "eip155:8453", payTo: BOUND_EVM }],
      { url: `${SELLER}/pay`, safeFetch, registryCall },
    );
    assert.equal(v.agent, null);
    assert.equal(v.results.length, 0);
    assert.equal(toVerdict(v, []).code, "no-badge");
  });
});

describe("concordium/verify — cross-day diff", () => {
  it("payto_changed_bound (info) when the new payTo is itself CIS-8-bound", () => {
    const prior = [
      {
        network: "eip155:8453",
        payTo: "0xFIRST",
        outcome: "verified-external-key" as const,
      },
    ];
    const current = [
      {
        network: "eip155:8453",
        payTo: "0xSECOND",
        outcome: "verified-external-key" as const,
      },
    ];
    const diffs = crossDayDiff(prior, current);
    assert.equal(diffs.length, 1);
    assert.equal(diffs[0].code, "concordium_payto_changed_bound");
    assert.equal(diffs[0].level, "info");
  });

  it("payto_changed (caution) when the new payTo is unbound", () => {
    const prior = [
      {
        network: "eip155:8453",
        payTo: "0xFIRST",
        outcome: "verified-external-key" as const,
      },
    ];
    const current = [
      {
        network: "eip155:8453",
        payTo: "0xSECOND",
        outcome: "mismatch" as const,
      },
    ];
    const diffs = crossDayDiff(prior, current);
    assert.equal(diffs.length, 1);
    assert.equal(diffs[0].code, "concordium_payto_changed");
    assert.equal(diffs[0].level, "caution");
  });
});
