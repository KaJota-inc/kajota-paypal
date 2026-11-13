#!/usr/bin/env node
// Concordium x402 testnet payment — one real payment with sponsored fees.
//
// Fires one x402 PAYMENT against a Concordium testnet facilitator so the
// Kajota buyer agent can show a real CCDScan transaction link on the
// Agent Registry's sponsored-fee path. Required for hackathon submission
// requirement (b): *"Provide a CCDExplorer link to the testnet
// agent/contract/transactions."*
//
//   node concordium/x402-pay.mjs
//
// Prerequisites (set in .env.local, see .env.example):
//   CONCORDIUM_REGISTRY_MCP            testnet registry MCP endpoint
//   CONCORDIUM_X402_FACILITATOR_URL    testnet facilitator /settle endpoint
//   CONCORDIUM_X402_FEE_PAYER          the account sponsoring gas
//   CONCORDIUM_AGENT_TOKEN_ADDRESS     Kajota's registered badge
//
// Drop-trigger behaviour (DRY_RUN_DEMO.md Hour 9): when the facilitator
// URL is unset, the script exits 0 with a clear message rather than
// attempting a payment. The CI mesh-runner uses the same pattern
// (see commit a23fb9a).

import { readFile, writeFile } from "node:fs/promises";

const TIMEOUT_MS = 15000;

async function loadDotenv() {
  try {
    const text = await readFile(".env.local", "utf8");
    for (const raw of text.split("\n")) {
      const line = raw.trim();
      if (!line || line.startsWith("#")) continue;
      const i = line.indexOf("=");
      if (i < 0) continue;
      const k = line.slice(0, i).trim();
      const v = line.slice(i + 1).trim().replace(/^"|"$/g, "");
      if (!process.env[k]) process.env[k] = v;
    }
  } catch {
    // .env.local not present — fall back to the ambient environment
  }
}

await loadDotenv();

const FACILITATOR = process.env.CONCORDIUM_X402_FACILITATOR_URL;
const FEE_PAYER = process.env.CONCORDIUM_X402_FEE_PAYER;
const BADGE = process.env.CONCORDIUM_AGENT_TOKEN_ADDRESS;
const NETWORK = process.env.CONCORDIUM_NETWORK || "testnet";

if (!FACILITATOR || !FEE_PAYER) {
  console.log(
    "concordium/x402-pay.mjs — skipped: CONCORDIUM_X402_FACILITATOR_URL or CONCORDIUM_X402_FEE_PAYER is unset.",
  );
  console.log(
    "Set both in .env.local to fire one testnet payment with sponsored fees.",
  );
  process.exit(0);
}

// A placeholder x402 PAYMENT payload the Kajota buyer agent would sign.
// Phase B: this is signed with the Concordium testnet account's private
// key via @concordium/web-sdk. Phase A here uses a deterministic stub so
// the facilitator's response shape can be inspected before live keys land.
const payment = {
  x402Version: 1,
  scheme: "sponsored",
  network: "ccd:4221332d34e1694168c2a0c0b3fd0f27",
  payload: {
    badge: BADGE,
    feePayer: FEE_PAYER,
    purpose: "kajota-buyer-agent-demo",
    nonce: Buffer.from(crypto.getRandomValues(new Uint8Array(16))).toString("hex"),
  },
};

console.log("Firing x402 payment against", FACILITATOR);
console.log("Fee payer:", FEE_PAYER);
console.log("Badge:    ", BADGE);

const res = await fetch(`${FACILITATOR.replace(/\/+$/, "")}/settle`, {
  method: "POST",
  headers: { "content-type": "application/json" },
  body: JSON.stringify(payment),
  signal: AbortSignal.timeout(TIMEOUT_MS),
});

const text = await res.text();
let body;
try {
  body = JSON.parse(text);
} catch {
  body = { raw: text };
}

if (!res.ok) {
  console.error(`Facilitator responded ${res.status}:`, body);
  process.exit(2);
}

const txHash =
  body?.transaction?.hash || body?.txHash || body?.tx_hash || body?.hash || null;
if (!txHash) {
  console.log("Response (no tx hash extracted):", JSON.stringify(body, null, 2));
  process.exit(3);
}

const scanHost =
  NETWORK === "mainnet" ? "ccdscan.io" : "testnet.ccdscan.io";
console.log("\nPaid ✓");
console.log("CCDScan:", `https://${scanHost}/?dcount=1&dentity=transaction&dhash=${txHash}`);

// Write to concordium/ccdscan-links.md row #4
try {
  const path = "concordium/ccdscan-links.md";
  const current = await readFile(path, "utf8");
  const next = current.replace(
    /\| 4 \| x402 testnet payment with sponsored fees \| `<TBD>` \| https:\/\/testnet\.ccdscan\.io\/\?dcount=1&dentity=transaction&dhash=<TBD> \| —/,
    `| 4 | x402 testnet payment with sponsored fees | \`${txHash}\` | https://${scanHost}/?dcount=1&dentity=transaction&dhash=${txHash} | ${new Date().toISOString()}`,
  );
  if (next !== current) {
    await writeFile(path, next);
    console.log("Wrote tx #4 hash back to", path);
  }
} catch (err) {
  console.warn(
    "Could not rewrite concordium/ccdscan-links.md:",
    err?.message || err,
  );
}
