# Demo video — beat sheet

**Status:** production plan locked for Phase D (04–11 Nov 2026). Shoot order and shot list reflect the three live surfaces (`/chat`, `/dashboard`, `/evidence`) and the Mandate Beacon overlay committed to `main` through 06 Oct.

Hard constraints from the Devpost brief:

- Under three minutes. Judges are not required to watch past that.
- Uploaded to YouTube. Public visibility.
- No third-party trademarks or copyrighted music without permission.
- Must show the project functioning on the intended device.

Soft constraints we impose on ourselves per the memory corpus:

- No speed-up tricks. Trim at 1.0× or re-shoot. [[feedback_submission_form_rules_first]] (Zama S4 almost caught a sped-up-video DQ at submit time.)
- Owner's voice via whisper.cpp sync, not AI VO. [[feedback_realvoice_demo_video]] — some hackathons ban synthetic voice.
- Master at 2560 × 1440, 25 Mbps, exported to 1080p60. [[feedback_demo_video_production]].
- First 10 s must land the pitch — judges snap-judge in 30 s per the playbook.

## Beats (~135 seconds of narration over 170 seconds of footage)

### 00:00 — 00:10 · The hook

Full-screen title card over a slow pan of the PayPal Agent Toolkit tool list on `developer.paypal.com`. Caret hovers on `create_invoice`, `create_order`, `capture_order`, scrolling.

> _"PayPal's Agent Toolkit gives AI agents forty-two tools. Zero of them pay the agent."_

### 00:10 — 00:35 · Enter the agent

Cut to `/chat` on the deployed `kajota-paypal.vercel.app`. Prompt field pre-filled with the demo query. Click **Run**. SSE events stream in — role-coded dots, Channel3 tool call, three product offers slide in with the affiliate commission chips visible.

> _"The agent discovers products through Channel3. Each offer carries affiliate commission data a human never sees."_

### 00:35 — 00:55 · The Mandate

Highlight the Cart Mandate row in the trace. Keep the stream running — the Payment Mandate row lands next with its `payment_details_id` cross-reference. Cut to a half-screen overlay of the actual `PaymentMandateContents` JSON (not AP2's `vct` — AP2 uses `payment_mandate_id`).

> _"The AP2 Payment Mandate names one `merchant_agent`. The agent and the affiliate are not on it. That is the gap."_

### 00:55 — 01:15 · Checkout + webhook

Hard cut to `/dashboard`. Click **Seed demo rows** to pre-populate (or in a live sandbox run, show the PayPal sandbox confirm page then flip to the dashboard). A new row paints in from the right — status chip `pending-register` → `pending-release` → `released`.

> _"PayPal fires the webhook. Our verifier cross-refs the Mandate pair, projects the Cart's items into recipients and shares, registers the listing on Arbitrum, deposits PYUSD."_

### 01:15 — 01:35 · The release — atomic fan-out

Click the **release** button on the row. Four Arbiscan tx chips light up in sequence (register, approve, deposit, release). Open the release tx in a new tab for one beat — show three ERC-20 transfers inside one transaction.

> _"One transaction, three payees. Merchant $62.99 PYUSD. Agent $17.99. Affiliate $8.99. Same block. The releaser cannot change the share table — it was fixed at listing time."_

### 01:35 — 01:55 · The compliance exhibit

Click any row's listing id to open the Mandate Inspector (via `/mandate-inspector/[id]`). Show the Beacon commitment hash alongside the AP2 cart/payment hashes. Note the Reg E 10-day and CBN CPR 2019 24-hour SLA constants.

> _"The Beacon receipt is byte-identical to the on-chain commitment MandateAnchor would emit. The same primitive anchors U.S. Reg E and Nigerian CPR 2019 — one hash, two rails."_

### 01:55 — 02:15 · Public evidence

Cut to `/evidence`. Stat cards: total settlements, PYUSD routed, N recipients. Scroll to the latest-10 table. Click any Arbiscan link. End on the "verify this yourself" contract-address block — hover one, show the Arbiscan tooltip.

> _"No login. Public. Refreshes every sixty seconds. A judge sees today's activity, not a demo tx from a week ago."_

### 02:15 — 02:30 · The gap, restated

Static card with three lines:

- _no T+30 reconciliation_
- _no quarterly spreadsheet_
- _one transaction. N payees. atomic._

### 02:30 — 02:50 · The headline

Fade: **The 43rd tool for the PayPal Agent Toolkit.**

Second card: `kajota-paypal.vercel.app` · `github.com/KaJota-inc/kajota-paypal` · _"pnpm reproduce:fail — 7/7 gates fire"_.

### 02:50 — 03:00 · Credits + licence

Repository link, MIT licence, Mesh substrate credit (`KaJota-inc/kajota-arbitrum-singapore`), Mandate Beacon credit (`kajota-zama`), Channel3 credit. Hold five seconds.

## Shot list

Source clips to capture, each as `shot-NN-<slug>.mp4` under `~/Movies/kajota-paypal/raw/`:

- `shot-01-paypal-docs-pan` — Agent Toolkit tool list, slow scroll
- `shot-02-chat-run` — buyer /chat page, type prompt, click Run, SSE events stream
- `shot-03-channel3-offers` — zoom on the three result items with affiliate chips
- `shot-04-mandate-overlay` — PaymentMandateContents JSON overlay (hand-authored to spec)
- `shot-05-dashboard-row` — merchant /dashboard row cascade with status chip progression
- `shot-06-release-click` — click release button; Arbiscan tx chips light
- `shot-07-arbiscan-tx` — the actual release tx on sepolia.arbiscan.io showing three ERC-20 transfers in one tx
- `shot-08-mandate-inspector` — Mandate Inspector modal with Beacon commitment hash
- `shot-09-evidence-page` — /evidence stat cards, latest-10 table, verify-yourself list
- `shot-10-evidence-arbiscan-click` — click a contract address from /evidence; land on Arbiscan
- `shot-11-close-cards` — three closing cards (gap-restated, headline, credits)

## Capture environment

- Browser: Chrome on 1920×1080 at 100% zoom.
- Screen recorder: QuickTime or OBS. OBS gives better bitrate control; QuickTime is simpler.
- Terminal cuts (reproducer runs): `vhs` per [[feedback_terminal_recording_vhs]].
- Mandate Inspector modal: the deployed Vercel URL, not localhost, so the Arbiscan links in-video are live.

## Audio

- Owner's VO recorded in Logic Pro, dry; apply EQ (high-pass 80 Hz, de-ess 7 kHz) + gentle compression (3:1, −14 dB threshold).
- Background: silence or room tone at −32 dB. No music if any rights uncertainty.
- VO levelled to −16 LUFS loudness target.
- Sync via whisper.cpp per [[feedback_realvoice_demo_video]] — line up each shot's visible event with the corresponding spoken beat.

## Export

`ffmpeg` composite from the shot list with `adelay`/`amix` for VO. **Trim at 1.0× only.** [[feedback_submission_form_rules_first]].

```bash
# per-clip concatenation + VO overlay (sketch — not the final ffmpeg)
ffmpeg -i chat-stream.mp4 -i vo-chat.wav -c:v copy \
  -c:a aac -map 0:v:0 -map 1:a:0 -shortest out/01-chat.mp4
# then concat all 11 shots via -f concat
```

## Submission

- Upload to YouTube.
- Set to Public, not Unlisted — some hackathon forms refuse Unlisted.
- Mark "Not for Kids."
- Add captions (auto-generate + hand-correct — the spoken numbers and tx hashes must read correctly).
- Paste link into Devpost submission form.
- Walk the form once more (see [[feedback_submission_form_rules_first]]).

## Rehearsal cadence

- 04 Nov · dry-run the full 3-min flow against the deployed URL. Time each beat. Shoot nothing yet.
- 05 Nov · record VO track in one pass; cut takes.
- 06 Nov · shoot every clip in order; re-shoot anything the VO sync misses.
- 07 Nov · ffmpeg composite + QC pass. Upload to YouTube unlisted for review.
- 08 Nov · flip to Public once the Devpost form is confirmed walked.

Any beat that cannot be shot at 1.0× by 07 Nov gets re-scripted shorter, not sped up.
