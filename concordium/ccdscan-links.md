# Concordium testnet transactions — CCDScan links

Four testnet transactions that bind Kajota's buyer agent to Concordium's
Agent Registry. Each row carries the real CCDScan testnet URL once the
transaction has been fired.

**URL pattern:**
`https://testnet.ccdscan.io/?dcount=1&dentity=transaction&dhash=<hash>`

## Status

| # | Transaction | Hash | CCDScan link | Fired at |
|---|---|---|---|---|
| 1 | Register Agent Card (Agent Registry mint) | `<TBD>` | https://testnet.ccdscan.io/?dcount=1&dentity=transaction&dhash=<TBD> | — |
| 2 | Pin Agent Card hash (metadata_hash on chain) | `<TBD>` | https://testnet.ccdscan.io/?dcount=1&dentity=transaction&dhash=<TBD> | — |
| 3 | Bind Base Sepolia key via CIS-8 | `<TBD>` | https://testnet.ccdscan.io/?dcount=1&dentity=transaction&dhash=<TBD> | — |
| 4 | x402 testnet payment with sponsored fees | `<TBD>` | https://testnet.ccdscan.io/?dcount=1&dentity=transaction&dhash=<TBD> | — |

Optional fifth (same flow as #3, different chain):

| 5 | Bind Arb Sepolia key via CIS-8 | `<TBD>` | https://testnet.ccdscan.io/?dcount=1&dentity=transaction&dhash=<TBD> | — |

## How to fire them

The four transactions are **gated on a Concordium testnet account** —
an identity-verified wallet is required by protocol. That account must
be created by the user (KYC + Concordium ID verification; cannot be
automated by this session's tools). Steps:

1. **Install the Concordium browser wallet** from
   https://wallet.concordium.software (Chrome + Firefox supported).
   Switch to testnet. Request testnet CCD from
   https://wallet-proxy.testnet.concordium.com/v0/testnetGTUDrop/<address>.
2. **Verify identity** through Notabene or another Concordium ID provider.
   This is the one step this session cannot do — it's by design, since
   the identity-verified account is the whole point of Verified by Concordium.
3. **Register the Kajota Agent Card** at
   https://testnet-agent-registry.concordium.com. Upload
   `app/.well-known/agent-card.json/route.ts`'s CARD output. Record tx #1.
4. **Pin the card hash** (same UI). Record tx #2.
5. **Bind the Base Sepolia key** via the registry's CIS-8 flow.
   Public key hex comes from the existing `MESH_ORCHESTRATION_PRIVATE_KEY`
   or `MESH_RELEASE_AUTH_PRIVATE_KEY`. Record tx #3.
6. **Fire one x402 payment** with Concordium sponsored fees. Use the
   `@x402/concordium` client; the facilitator's `extra.feePayer` covers
   gas. Record tx #4.

## What this file unblocks

Every TBD row in this file becomes a verifiable link in the README's
"Verified by Concordium" section and in the Encode Club submission form.
Until these are filled in, the Mandate Inspector panel and `/chat`
preflight render deterministic Phase-A placeholder values — clearly
labelled as such in the UI chips (`verified-external-key` with the demo
badge `4WU5…`).

## Writing hashes back

After firing a transaction, paste the raw `0x…` hash into the Hash
column. The CCDScan link column uses the same URL pattern for every row,
so a sed one-liner finishes the row:

```bash
hash="0xabc…"; sed -i.bak "s|<TBD>|$hash|" concordium/ccdscan-links.md
```
