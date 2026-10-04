# Demo video — beat sheet

**Status:** stub committed in Phase A scaffold; produced during Phase D (04–11 Nov 2026).

Hard constraints from the Devpost brief:

- Under three minutes. Judges are not required to watch past that.
- Uploaded to YouTube. Public visibility.
- No third-party trademarks or copyrighted music without permission.
- Must show the project functioning on the intended device.

Soft constraints we impose on ourselves:

- No speed-up tricks. Trim at 1.0× or re-shoot. [[feedback_submission_form_rules_first]]
- Owner's voice, not AI VO. Some hackathons ban synthetic voice; this one has not stated it either way, so we match the human-voice winners.
- Master at 2560 × 1440, 25 Mbps, exported to 1080p60.

## Beats (~130 seconds of narration over 165 seconds of footage)

**00:00 — 00:12 · Open on the gap.**
PayPal Agent Toolkit docs. Caret hovering over the forty-two tool names.
Caption: *forty-two tools. zero of them pay the agent.*

**00:12 — 00:30 · Enter the agent.**
Buyer chat opens. Prompt: *"Find me a leather bag under $120 that pays its reviewer."*
Agent calls Channel3. Three offers slide in. Affiliate attribution visible on each.
Agent picks one.

**00:30 — 00:55 · The Mandate.**
JSON blob floats up over the chat. `vct: "mandate.payment"`. `transaction_id`. `cart.payees` with three entries.
Caption: *the Payment Mandate names everyone. Mesh binds everyone.*

**00:55 — 01:12 · PayPal checkout.**
PayPal sandbox button, standard look. One click. Order confirms.

**01:12 — 01:35 · Webhook landing.**
Right half of the screen: merchant dashboard refreshes. New row.
Columns light up progressively: Mandate hash → listing id → register (Arbiscan link) → deposit (Arbiscan link).

**01:35 — 01:52 · The release.**
Merchant dashboard button. Release fires. Four payees fan out in one block.
Arbiscan transaction opens: merchant $84 PYUSD, agent $24, affiliate $12.

**01:52 — 02:08 · The receipt.**
Row click opens the Mandate Inspector modal. Full signed JSON. Mesh listing id highlighted.

**02:08 — 02:25 · The gap, restated.**
Caption: *no spreadsheet. no T+30. one transaction. three payees. atomic.*

**02:25 — 02:40 · The headline.**
Fade in: *The 43rd tool for the PayPal Agent Toolkit.*
Logo card. Repo URL. Hosted demo URL.

**02:40 — 02:50 · Credits + licence.**
Repository, licence, Mesh substrate credit, Channel3 credit.
Hold three seconds.

## Shot list

- `shot-01-paypal-docs-page.mp4` — Agent Toolkit page scroll with the forty-two-tool list in frame
- `shot-02-chat-input.mp4` — buyer prompt in the chat UI
- `shot-03-channel3-offers.mp4` — three offers slide in
- `shot-04-mandate-json.mp4` — JSON overlay with the Mandate schema
- `shot-05-paypal-checkout.mp4` — sandbox button, confirmation
- `shot-06-dashboard-row.mp4` — merchant dashboard refresh, column cascade
- `shot-07-release-tx.mp4` — release button, Arbiscan four-transfer screenshot
- `shot-08-mandate-modal.mp4` — modal with full signed JSON
- `shot-09-close.mp4` — logo card and URL

## Audio

- Owner's VO recorded in Logic Pro, dry; applied EQ and gentle compression.
- Background: silence or ambient at -32 dB. No music if any rights uncertainty.
- VO levelled to -16 LUFS loudness target.

## Export

`ffmpeg` composite from the shot list with `adelay`/`amix` for VO. Trim at 1.0× only. See [[feedback_demo_video_production]].

## Submission

- Upload to YouTube.
- Set to Public.
- Add captions (auto-generate + hand-correct).
- Paste link into Devpost submission form.
