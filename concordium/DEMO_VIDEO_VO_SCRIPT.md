# Concordium demo video — VO script + recording checklist

**Target:** 3:00 cap (Encode Club verbatim rule, confirmed in tareq7/sellerpilot
README). Stopwatch at 2:55. One take.

**Format:** 1920×1080, screen recording of the live Vercel deploy
(`kajota-paypal.vercel.app`), with voiceover.

**Why this script works as one take.** Every surface is already live in
production (`dpl_an6GFYYRYcqFCwWAP7G5HYuxgdNR`). Every click lands on a
real URL. Nothing waits on async state longer than a reload.

---

## Pre-record checklist — do these ten minutes before you hit record

1. **Browser:** fresh Chrome/Firefox window, no extensions, zoom at 100%,
   dark mode OFF (the emerald chip reads best on light). Hide bookmarks bar.
2. **Tabs in this exact left-to-right order** (open each, let it render,
   leave it):
   - Tab 1 · `https://kajota-paypal.vercel.app/` — landing with Verified-by-Concordium chip under hero.
   - Tab 2 · `https://kajota-paypal.vercel.app/chat` — buyer SSE page, prompt pre-filled, do NOT click Run yet.
   - Tab 3 · `https://kajota-paypal.vercel.app/mandate-inspector/pm_stub_0001` — Concordium panel at top.
   - Tab 4 · `https://kajota-paypal.vercel.app/.well-known/agent-card.json` — the A2A card with the badge extension.
   - Tab 5 · Terminal, `cd <repo>`, cursor blinking at a fresh prompt.
   - Tab 6 · `https://testnet.ccdscan.io/` — ready to paste a tx hash.
   - Tab 7 · `https://github.com/KaJota-inc/kajota-paypal#verified-by-concordium` — README section.
3. **Terminal size:** 120 cols × 32 rows. Font size 16pt. One command queued, un-run:
   `node concordium/demo.mjs`
4. **Recorder:** QuickTime (macOS) `cmd-shift-5` → selection → screen area
   capturing the browser frame only (not the dock, not the menu bar).
   Or OBS → "Display Capture" + "Audio Input Capture" on the mic.
5. **Mic check:** record 5s of "testing testing" first, listen back once,
   fix level, then delete that file.
6. **Timer app:** open `https://cuckoo.team/kajota` or any 3:00 countdown
   on your phone, out of frame.
7. **One rehearsal, half-speed, no audio.** Walk the beats below with the
   mouse. Time yourself. If any beat breaks (tab didn't render, SSE hangs),
   fix it before the real take.

---

## Beat-by-beat script (180 seconds total, 2:55 target)

### Beat 0 — title card (0:00–0:05, 5s)

> *(no VO, just a title slide: "Kajota — Verified by Concordium. Concordium Trusted Agents Hackathon 2026.")*

Overlay prep: lower third `Encode Club × Concordium · Dec 9 2026`.

### Beat 1 — landing hero + Verified-by-Concordium chip (0:05–0:20, 15s)

**Tab 1.** Show the hero. Hover the emerald Verified-by-Concordium chip
so the cursor sits on it, but don't click.

> "Kajota is a PayPal buyer agent — shipped Nov 12 for the PayPal AI
> Hackathon. The Agent Card is now pinned on Concordium's testnet Agent
> Registry, the owner account is identity-verified, and the agent's
> external key is bound to Base and Arb Sepolia via CIS-8. Verified
> by Concordium."

(~43 words, ~15 seconds at natural pace. Caption chip: `Verified by Concordium`.)

### Beat 2 — /chat preflight toast (0:20–0:50, 30s)

**Tab 2.** Click **Run**. Wait ~6s for the pipeline to reach the
`verified-by-concordium` chip. Scroll so it's centred. Hover the badge
link.

> "Before the buyer agent assembles its AP2 Cart Mandate, it runs the
> Verified-by-Concordium preflight. It reads the seller's
> `/.well-known/agent-card.json`, pulls the badge, resolves it against
> Concordium's Agent Registry MCP, and matches the x402 payout address
> against the CIS-8-bound key. Verified-external-key. The pipeline
> continues."

(~55 words, ~27 seconds. Leaves 3s to let the mandate and settlement
events finish scrolling in.)

### Beat 3 — four-state taxonomy on /mandate-inspector (0:50–1:20, 30s)

**Tab 3.** Scroll to the Concordium panel at the top of the receipt.

> "The Mandate Inspector annotates every receipt with the Concordium
> verdict. Badge, owner, agent URI, CIS-8 bound keys on Base and
> Arb Sepolia, with CCDScan links. Four states that refuse:
> endpoint-unlisted, mismatch, revoked, card-mismatch — the exact
> taxonomy Fizzl13 doctor uses — plus the verified outcomes that pay.
> A merchant without a badge is unchanged."

(~57 words, ~27 seconds.)

### Beat 4 — failure modes via demo.mjs (1:20–1:50, 30s)

**Tab 5.** Run `node concordium/demo.mjs`. The terminal shows four
coloured outcomes.

> "Live proof. Four cases: Kajota's own agent pays. A copycat server
> with the same card on another host — endpoint-unlisted, refused.
> Kajota's card but the 402 asks to pay a stranger — mismatch, refused.
> A card showing the badge of a revoked agent — refused. Paid one of
> four."

(~52 words, ~27 seconds. Zoom the terminal if the colours are hard to read.)

### Beat 5 — x402 sponsored-fee + CCDScan (1:50–2:20, 30s)

**Tab 5.** Scroll to the top of the terminal. Run `node concordium/x402-pay.mjs`.
A real testnet payment fires with Concordium sponsoring the gas. A
CCDScan URL prints.

**Tab 6.** Paste the hash into CCDScan, let the tx load. Point at the
Sponsored Transaction field.

> "One x402 payment on Concordium testnet, with the facilitator
> sponsoring the gas. The buyer signs, the fee payer is Concordium's
> facilitator — the buyer never holds CCD. CCDScan confirms the
> transaction."

(~41 words, ~23 seconds. Leaves 7s for the CCDScan page to settle.)

### Beat 6 — MCP endpoint + Agent Card (2:20–2:45, 25s)

**Tab 5.** In the terminal:

```
curl -s -X POST https://kajota-paypal.vercel.app/api/mcp \
  -H 'content-type: application/json' \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/list"}' | jq
```

(Press Return. Response fills the screen.)

**Tab 4.** Flip to the Agent Card tab for the last 5s. Point at the
`concordium-badge/v1` extension block.

> "The whole flow is an MCP tool. `buyer_chat.plan` and
> `concordium.verify`, callable by any A2A agent. The Agent Card at
> `.well-known/agent-card.json` carries the badge extension so another
> agent can verify Kajota before paying."

(~43 words, ~22 seconds.)

### Beat 7 — README close (2:45–2:55, 10s)

**Tab 7.** README "Verified by Concordium" section, four CCDScan links
visible.

> "Four testnet transactions. All linked from the README. Kajota —
> Verified by Concordium."

(~15 words, ~8 seconds.)

### Fade (2:55–3:00)

Fade to the Kajota / Concordium logo pair. Stop recording at 2:58.

---

## Post-record checklist

1. **Trim** to exactly 2:55 or under. If beat 5 overran (x402 payment
   took > 30s), cut the pause between the terminal output and the
   CCDScan page open — the pause is dead time, the viewer doesn't miss it.
2. **Export** at 1920×1080, H.264, 10–15 Mbps. Target file size 60–90 MB.
3. **Upload** to YouTube unlisted. Title: `Kajota — Verified by
   Concordium (Trusted Agents Hackathon 2026)`. Description points at
   the repo + the live Vercel deploy.
4. **Paste** the unlisted URL into `concordium/encode-submission-form.md`
   where it says `<TBD — unlisted YouTube>`.
5. **Submit** on `encodeclub.com/programmes/concordium-trusted-agents-hackathon`
   with the fields in `concordium/encode-submission-form.md`.

---

## Drop triggers during the take

Don't push through; abort the take and re-record if:

- Beat 2 (`/chat`): the SSE hits the `concordium_verify` event but shows
  `no-badge` or `caution` level. Phase A should always emit
  `verified-external-key` with `info`. If it flips, the deploy isn't
  the current one — re-run `vercel --prod --yes` and wait 60s before
  re-trying.
- Beat 5 (`x402-pay`): the script exits with "skipped" (facilitator URL
  unset). Means `.env.local` isn't picking up
  `CONCORDIUM_X402_FACILITATOR_URL` on the recording machine. Export
  the two env vars inline in the terminal and re-run; the viewer won't
  see the env export.
- Beat 6 (`curl /api/mcp`): the response is HTML instead of JSON. Means
  the deploy is cached a stale build; hit `?cb=$(date +%s)` on any URL
  once, then re-curl.
- Mic drops a word or coughs over a beat. Any blemish costs more than a
  30-second re-take.
