import { describe, it } from "node:test";
import assert from "node:assert/strict";

import {
  concordiumReasons,
  toVerdict,
  verdict,
  verifyConcordium,
  type FetchLike,
  type RegistryCall,
} from "../../lib/concordium/verify";

/**
 * Integration test for the live-shape path: a Concordium testnet registry
 * record as the real MCP returns it (verbatim capture from
 * `agent-registry-mcp.concordium.com/mcp agent_of(993)` on 2026-11-16).
 *
 * The record's `external_reference.key.public_key_hex` is a 65-byte
 * secp256k1-uncompressed key; the derived EVM address must come out to
 * the Base-mainnet address Fizzl13 bound (SCOUT_MEMO section 1). If this
 * test flips red, the live registry's shape changed and verify.ts needs
 * a corresponding patch before the demo is submitted.
 */

// Verbatim from `agent_of(993, testnet)` on 2026-11-16.
const LIVE_RECORD = {
  network: "testnet",
  token_address: "JyP9Y8gHmf4U8QPMm1TkT",
  token_id: "993",
  token_id_u64: 993,
  owner_account: "3HFbRLEGSVUsebprTBmTvpdbTkHg4ncutEYWf4EEaQfgQae9v3",
  agent_uri: "https://ccd-facilitator.fizzl.eu/.well-known/agent-card.json",
  metadata_hash_hex:
    "2e42a59886854fc7b67c0ccc28bdf9b0487bd3ddea4610f269d6d4e54e5e47c1",
  external_reference: {
    contract_address: { index: 12801, subindex: 0 },
    kind: "Cis8",
    key: {
      namespace: "eip155:8453",
      key_type: "secp256k1-uncompressed",
      public_key_hex:
        "04fe1d7054fc08b866a3db751a91d6e1088f3f3d6c225ab13941482dc88dee3d99884078abdce48b4dba9c5671059e6165717325641ade4f57581aee80d684eab0",
    },
  },
  agent_wallet: "3HFbRLEGSVUsebprTBmTvpdbTkHg4ncutEYWf4EEaQfgQae9v3",
  status: "Active",
};

// The expected EVM address derived from the public key above.
// (keccak256(X||Y)[-20:] — the standard secp256k1 → Ethereum address.)
// Captured via viem publicKeyToAddress, then lowercased:
//   publicKeyToAddress("0x04fe1d7054…684eab0") → 0x6b0f…5f25
const EXPECTED_EVM = "0x6b0f4651ed42893ab58139938175e4a69f175f25";

const SELLER = "https://ccd-facilitator.fizzl.eu";

function stubFetch(cardJson: string, hashHex: string): FetchLike {
  const cardUrl = `${SELLER}/.well-known/agent-card.json`;
  void hashHex;
  return async (url) => {
    if (url === cardUrl) return { status: 200, text: cardJson };
    return { status: 404, text: "" };
  };
}

describe("concordium/verify — live registry shape", () => {
  it("derives the EVM address from secp256k1-uncompressed external_reference", async () => {
    // A minimal seller card that carries Fizzl13's badge.
    const cardJson = JSON.stringify({
      url: SELLER,
      capabilities: {
        extensions: [
          {
            uri: "https://docs.concordium.com/a2a-extensions/concordium-badge/v1",
            params: {
              tokenAddress: LIVE_RECORD.token_address,
              caip19: `ccd:4221332d34e1694168c2a0c0b3fd0f27/cis-2:${LIVE_RECORD.token_address}`,
              chain: "ccd:4221332d34e1694168c2a0c0b3fd0f27",
            },
          },
        ],
      },
    });
    // Make the metadata_hash_hex of the registry record match the card
    // content so card-mismatch doesn't fire. Easier to do by overriding
    // the metadata_hash_hex than by recomputing.
    const { createHash } = await import("node:crypto");
    const cardHash = createHash("sha256")
      .update(Buffer.from(cardJson, "utf8"))
      .digest("hex");
    const record = { ...LIVE_RECORD, metadata_hash_hex: cardHash };

    const safeFetch = stubFetch(cardJson, cardHash);
    const registryCall: RegistryCall = async (tool) => {
      if (tool === "agent_by_token_address") return record;
      return null;
    };

    const v = await verifyConcordium(
      [{ network: "eip155:8453", payTo: EXPECTED_EVM }],
      { url: SELLER + "/pay", safeFetch, registryCall },
    );
    assert.equal(
      v.results[0].outcome,
      "verified-external-key",
      "the derived address should match the x402 payTo",
    );
    const reasons = concordiumReasons(v, [{ network: "eip155:8453" }]);
    assert.equal(verdict(reasons), "go");

    const out = toVerdict(v, reasons);
    assert.equal(out.network, "testnet");
    assert.equal(out.code, "verified-external-key");
  });

  it("flags mismatch when payTo is not the derived address", async () => {
    const cardJson = JSON.stringify({
      url: SELLER,
      capabilities: {
        extensions: [
          {
            uri: "https://docs.concordium.com/a2a-extensions/concordium-badge/v1",
            params: {
              tokenAddress: LIVE_RECORD.token_address,
              caip19: `ccd:4221332d34e1694168c2a0c0b3fd0f27/cis-2:${LIVE_RECORD.token_address}`,
              chain: "ccd:4221332d34e1694168c2a0c0b3fd0f27",
            },
          },
        ],
      },
    });
    const { createHash } = await import("node:crypto");
    const cardHash = createHash("sha256")
      .update(Buffer.from(cardJson, "utf8"))
      .digest("hex");
    const record = { ...LIVE_RECORD, metadata_hash_hex: cardHash };

    const safeFetch = stubFetch(cardJson, cardHash);
    const registryCall: RegistryCall = async () => record;

    const v = await verifyConcordium(
      [
        {
          network: "eip155:8453",
          payTo: "0xBAD0000000000000000000000000000000000BAD",
        },
      ],
      { url: SELLER + "/pay", safeFetch, registryCall },
    );
    assert.equal(v.results[0].outcome, "mismatch");
  });
});
