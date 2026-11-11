# Demo video — VO script (optional layer-on)

**Video file:** `~/Movies/kajota-paypal-demo-v1.mp4` (2:20, 1920×1080, 2.33 MB, silent)
**Built:** 2026-11-11, automated screen captures + ffmpeg stitch, silent receipt-mode cut per [[feedback_receipt_pip_video_pattern]] Format A.

The silent cut is submittable as-is. The PayPal AI Hackathon rules do not require narration — *"must show the project functioning on the device it was built for"* is the only presentation rule. Judges autoplay muted anyway.

**If you want to add a voice-over**, record at 1.0× speed (per [[feedback_submission_form_rules_first]], no atempo). Script below is timed to the existing lower-third beats — read each line during its window and the captions act as prompts. In iMovie: import the MP4, drop an audio track, record while watching, mute the original video audio (it's already silent). In DaVinci: same, plus turn on waveform-view and nudge each line to its beat's chip-appearance tick (~0.3s after the beat starts).

---

## Beat-by-beat script (140 seconds total)

### Beat 0 — title card (0:00–0:05, 5s)

> *(no VO, just the title + hackathon chip)*

### Beat 1 — hero (0:05–0:15, 10s)

> "The PayPal Agent Toolkit gives agents 42 tools. Zero of them pay an agent. Kajota Mesh is the 43rd — an N-party atomic fan-out of PayPal proceeds, AP2-bound, PYUSD-settled on Arbitrum."

(~22 words, ~9 seconds at a natural pace. Leaves ~1s margin.)

### Beat 2 — /chat intro (0:15–0:30, 15s)

> "The buyer agent asks Channel3 for a leather bag that pays its reviewer. Vintage tote at $89.99 — fifteen percent reviewer share, highest commission. Agent picks it, assembles the AP2 Cart Mandate, triggers PayPal checkout."

(~38 words, ~15 seconds.)

### Beat 3 — /chat settled (0:30–0:45, 15s)

> "The Payment Mandate SD-JWT-VC emits. Cross-ref payment details id matches cart. Webhook verifies, Mesh listing registers, PYUSD deposits, releases atomically — merchant sixty-two ninety-nine, agent seventeen ninety-nine, affiliate eight ninety-nine. One transaction, three payees. Pipeline complete."

(~44 words, slight compression but doable.)

### Beat 4 — /dashboard (0:45–0:58, 13s)

> "The merchant dashboard. AG Grid, one row per PayPal order, its Mandate hash, its Mesh listing, the N-way fan-out, Arbiscan receipts on every column."

(~26 words, ~11 seconds.)

### Beat 5 — Mandate Beacon receipt (0:58–1:13, 15s)

> "Every Mandate becomes a Beacon receipt — commitment hash byte-identical to the on-chain MandateAnchor leaf. A regulator recomputes this from the Mandate pair alone, no PII, no side channel. Reg E ten-business-day SLA. OFAC SDN pinned sanctions snapshot."

(~40 words, ~14 seconds.)

### Beat 6 — /leaderboard (1:13–1:25, 12s)

> "The Hustle Engine. Every wallet that closes an agent-mediated sale ranks here with its PYUSD earned, its role mix, its streak. Standing as a reward you don't pay out in cash."

(~30 words, ~11 seconds.)

### Beat 7 — /evidence live cycle (1:25–1:50, 25s)

> "Five real end-to-end cycles. Fired yesterday on Arbitrum Sepolia against the live USDC CosellEscrowV2. Five dollars fanned across three distinct hustler addresses in twenty on-chain transactions. Click any release hash — three ERC-20 Transfer events in one block, one per payee. The atomic split visible on-chain. The pipeline is accruing earnings, not firing transactions."

(~56 words, ~22 seconds. A touch dense — natural pause after "transactions" fills the remaining 3s.)

### Beat 8 — terminal (1:50–2:10, 20s)

> "pnpm reproduce:fail. Seven adversarial gates fire with a hash per branch. Beacon replay inside TTL, sanctions list drift, duplicate recipient, expired cart, sum not ten thousand bps, swapped mandate pair, tampered cart contents. Runnable, not prose. Twenty-one engineering scars at docs HARD underscore PARTS dot M-D."

(~45 words, ~18 seconds.)

### Beat 9 — outro (2:10–2:20, 10s)

> "Kajota Mesh × PayPal AI. The 43rd tool for the PayPal Agent Toolkit. GitHub Kajota dash inc slash kajota dash paypal. Draft PR filed at agent dash toolkit hash one twenty-six. And the one that pays agents what they just earned."

(~41 words, ~16 seconds — compress slightly or trim beat to 12s.)

---

## Recording tips (owner, not me)

- **Mic:** any decent USB mic or AirPods. Headphones recommended to avoid monitor-speaker bleed.
- **Room:** quiet, no fans, no air con. Record close to the mic (~15 cm).
- **One continuous take works best.** Read the whole script through once at pace while watching the video. Mistakes are fine — leave 1–2 seconds of silence after a flub and keep going; cut it out in the editor.
- **1.0× playback only.** Zama S4 precedent: atempo-sped videos get rejected ([[feedback_submission_form_rules_first]]). Trim content, never speed up.
- **Whisper-sync:** if the VO drifts from the beats, use the whisper-cli pipeline from [[feedback_realvoice_demo_video]] §Second Working Run step 2 to auto-detect each line's window and align. `ggml-base.en.bin` is already cached at `~/.cache/whisper-cpp/`.

## Owner action checklist

- [ ] Open `~/Movies/kajota-paypal-demo-v1.mp4` to verify it plays. QuickTime default is fine.
- [ ] Decide: ship silent OR layer VO. Silent is submittable and faster. VO is +Presentation points.
- [ ] If VO: record in GarageBand / QuickTime / iMovie; stitch with iMovie or DaVinci; export back to MP4.
- [ ] Upload to YouTube — public, "Not for kids," no copyright-strike music (we have none, there's nothing to strike).
- [ ] Grab the YouTube URL + paste into Devpost's "Video Demo URL" field tomorrow before submit.
- [ ] Verify the URL plays in incognito before submitting the Devpost form.

## If you want me to re-cut

Say what to change:
- Different beat order?
- Longer /evidence? Shorter /chat?
- Add a specific Arbiscan page as a beat?
- Burn in captions directly on the video instead of lower-thirds? (I'd need to re-render.)

Source files are at `/tmp/kajota-video/`.
