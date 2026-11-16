# Encode Club submission form — field-by-field draft

Paste-ready fields for the Concordium Trusted Agents Hackathon submission
on `encodeclub.com/programmes/concordium-trusted-agents-hackathon`.
Checkpoint 1 is project-creation only (no form). Final submission is
step 2 and takes the fields below.

> Replace every `<TBD>` with the live value from
> [`concordium/ccdscan-links.md`](ccdscan-links.md) before submitting.

---

## Project name

```
Kajota Trusted Agent — PayPal substrate with Concordium verification
```

## Team

```
Solo (one-person team)
```

## Short description (120-char guess)

```
PayPal x402 buyer agent, now Verified by Concordium — Agent Card pinned, CIS-8 key bound to Base, testnet payments with sponsored fees.
```

## Qualifying integration goals (tick all four)

- [x] **Verified by Concordium badge** — `/mandate-inspector/:id` annotation + `/chat` preflight chip.
- [x] **ERC-8004 Agent Card in Concordium Registry** — Agent Card pinned via CIS-8 key binding to the existing Base + Arb-Sepolia keys.
- [x] **x402 testnet with sponsored fees** — `concordium/x402-pay.mjs`.
- [x] **MCP integration** — `/api/mcp` with `tools/list`, `buyer_chat.plan`, `concordium.verify`.

## Repository URL

```
https://github.com/KaJota-inc/kajota-paypal
```

(Same repo as the PayPal AI entry — dual-use allowed per
`tareq7/sellerpilot-concordium-trusted-agents-2026` precedent.)

## Live demo URL

```
https://kajota-paypal.vercel.app
```

Direct paths a judge can click:

- `/` — landing, carries the *Verified by Concordium* chip.
- `/chat` — buyer agent SSE with the preflight toast.
- `/mandate-inspector/pm_stub_0001` — the Concordium annotation panel on a stub mandate.
- `/.well-known/agent-card.json` — the A2A Agent Card with `concordium-badge/v1` extension.
- `/api/mcp` (GET) — MCP tool list; POST `{jsonrpc, method: "tools/call"}` to invoke.

## Video URL

```
<TBD — unlisted YouTube, 3:00 cap, storyboard in DRY_RUN_DEMO.md Surface 1>
```

## CCDExplorer link (primary)

Fill the one the judge will click first — the x402 payment with sponsored
fees. The remaining three live in the README section.

```
https://testnet.ccdscan.io/?dcount=1&dentity=transaction&dhash=<TBD>
```

## "Credible path to production" one-liner

```
Already a shipped PayPal substrate with six live Vercel surfaces, PR #126 (PayPal Agent Toolkit) opened as the 43rd tool, Mandate Beacon anchoring commits on Arb Sepolia. Concordium adds the accountability layer merchants need to transact with it in production, with zero rework of the existing surfaces (bolt-on only).
```

## Blocking-submission-requirements acknowledgement

Per `tareq7/sellerpilot-concordium-trusted-agents-2026`'s verbatim list:

- [x] *"Implement and demonstrate a functioning flow on Concordium testnet using at least one qualifying component"* — all four covered.
- [x] *"Record a new event-specific video up to 3 minutes with a real testnet workflow."* — `<link TBD>`
- [x] *"Provide a CCDExplorer link to the testnet agent/contract/transactions."* — see above.
- [x] *"Verify human accountability and privacy controls without storing or exposing sensitive personal information."* — the Concordium Agent Card carries only the badge (CIS-2 token addr) and owner account; no PII. The Mandate Beacon's canonical hash is a `keccak256` leaf, also PII-free. The identity-verified Concordium account is the privacy primitive — ZK-ID on Concordium's protocol.
- [x] *"Document provenance: this application is an existing Meta-era foundation, not a new agent written entirely during the event."* — README.md top section already states the substrate was shipped Nov 12 for PayPal AI; Concordium is the bolt-on.
- [x] *"Publish accurate source, setup instructions and a credible testnet-to-mainnet plan."* — README "Verified by Concordium" + "Path to production" sections.

## Licence

```
MIT (LICENSE in repo root)
```

Encode has accepted strong copyleft (Fizzl13/x402-doctor is AGPL-3.0),
so MIT is safe.
