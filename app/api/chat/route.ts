import { randomUUID } from "node:crypto";

import type { Verdict } from "@/lib/concordium/verify";
import { ccdScanAccountUrl } from "@/lib/concordium/verify";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Scripted buyer-chat SSE stream. Phase A has no live LLM — we emit a
 * deterministic sequence of events that mirrors the eight-stage pipeline
 * (DISCOVER → VERIFY-BY-CONCORDIUM → MANDATE → CHECKOUT → VERIFY → PROJECT
 * → REGISTER → DEPOSIT → RELEASE), so the demo video and the judge-visible
 * /chat page work before OPENAI_API_KEY lands.
 *
 * Phase B swap: replace the generator below with a Vercel AI SDK streamText
 * call that drives real tool invocations (Channel3 /v1/search, PayPal Cart
 * API, our /api/paypal/webhook) and calls `verifyConcordium` with the real
 * seller origin + x402 options. The SSE event schema stays the same so the
 * frontend does not change when the mock drops.
 */

type ChatEvent =
  | { type: "thought"; text: string }
  | {
      type: "tool_call";
      tool: string;
      args: Record<string, unknown>;
      id: string;
    }
  | { type: "tool_result"; tool: string; id: string; result: unknown }
  | {
      type: "concordium_verify";
      verdict: Verdict;
      ownerExplorerUrl: string | null;
      agentExplorerUrl: string | null;
    }
  | {
      type: "mandate";
      kind: "cart" | "payment";
      id: string;
      summary: string;
    }
  | {
      type: "settlement";
      status: "pending" | "released" | "failed";
      summary: string;
      txHashes?: Record<string, string>;
    }
  | { type: "done" };

const STEP_MS = 650;

export async function POST(req: Request) {
  const { prompt } = (await req.json().catch(() => ({ prompt: "" }))) as {
    prompt?: string;
  };
  const query = (prompt?.trim() || "A leather bag under $120 that pays its reviewer").slice(0, 240);

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const push = (ev: ChatEvent) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(ev)}\n\n`));
      };
      const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

      await sleep(STEP_MS);
      push({
        type: "thought",
        text: `Working on: "${query}". Starting with product discovery via Channel3.`,
      });

      const searchId = `tc_${randomUUID().slice(0, 8)}`;
      await sleep(STEP_MS);
      push({
        type: "tool_call",
        tool: "channel3.search",
        id: searchId,
        args: { q: query, limit: 3 },
      });

      await sleep(STEP_MS * 1.2);
      push({
        type: "tool_result",
        tool: "channel3.search",
        id: searchId,
        result: [
          {
            productId: "ch3_tote_vintage",
            title: "Vintage leather tote",
            priceCents: 8999,
            merchantDomain: "artisanleather.example",
            affiliate: { commissionBps: 1500 },
          },
          {
            productId: "ch3_messenger_classic",
            title: "Classic messenger",
            priceCents: 10900,
            merchantDomain: "cityhaul.example",
            affiliate: { commissionBps: 800 },
          },
          {
            productId: "ch3_crossbody_min",
            title: "Minimalist crossbody",
            priceCents: 6550,
            merchantDomain: "quietgoods.example",
            affiliate: { commissionBps: 500 },
          },
        ],
      });

      await sleep(STEP_MS);
      push({
        type: "thought",
        text: "Picking the vintage tote at $89.99 — highest reviewer-share (15% commission) and under budget.",
      });

      // Verified by Concordium — preflight gate before the Cart Mandate.
      // In Phase A we emit a deterministic verdict that matches the
      // registered demo card (Kajota's own Concordium Trusted Agent
      // record, agent #KAJOTA-DEMO on testnet). The real `verifyConcordium`
      // call is wired via the MCP wrapper (POST /api/mcp) so the demo
      // script can prove the live-registry path; the /chat SSE emits the
      // cached outcome.
      await sleep(STEP_MS);
      push({
        type: "thought",
        text: "Running Verified-by-Concordium preflight on artisanleather.example before assembling the Cart Mandate.",
      });
      await sleep(STEP_MS * 0.7);
      const demoAgentToken = "4WU5GvYGYZibDL7SJTGVo9xTiMjSbiHfGX8";
      const demoOwner = "4owner0DEMO000000000000000000000000000000000000AB";
      const demoVerdict: Verdict = {
        code: "verified-external-key",
        level: "info",
        tokenAddress: demoAgentToken,
        owner: demoOwner,
        agentUri: "https://kajota-paypal.vercel.app/.well-known/agent-card.json",
        network: "testnet",
        reasons: [
          {
            level: "info",
            code: "concordium_verified",
            message:
              "Verified by Concordium: the payout address on Base Sepolia belongs to Concordium agent #KAJOTA-DEMO, whose owner is an identity-verified account.",
          },
        ],
      };
      push({
        type: "concordium_verify",
        verdict: demoVerdict,
        ownerExplorerUrl: ccdScanAccountUrl(demoOwner, "testnet"),
        agentExplorerUrl: ccdScanAccountUrl(demoAgentToken, "testnet"),
      });

      const cartMandateId = `cm_${randomUUID()}`;
      await sleep(STEP_MS);
      push({
        type: "mandate",
        kind: "cart",
        id: cartMandateId,
        summary: "Cart Mandate assembled. Merchant: artisanleather.example. Total: $89.99 USD.",
      });

      await sleep(STEP_MS);
      push({
        type: "tool_call",
        tool: "paypal.cart.checkout",
        id: `tc_${randomUUID().slice(0, 8)}`,
        args: { cartId: cartMandateId, paymentMethod: "paypal_wallet" },
      });

      await sleep(STEP_MS);
      const paypalOrderId = `DEMO_${randomUUID().replace(/-/g, "").slice(0, 12).toUpperCase()}`;
      push({
        type: "tool_result",
        tool: "paypal.cart.checkout",
        id: cartMandateId,
        result: { paypal_order_id: paypalOrderId, status: "APPROVED" },
      });

      const paymentMandateId = `pm_${randomUUID()}`;
      await sleep(STEP_MS);
      push({
        type: "mandate",
        kind: "payment",
        id: paymentMandateId,
        summary:
          "Payment Mandate emitted (SD-JWT-VC). Cross-ref: payment_details_id matches cart. Fan-out: merchant 70% / agent 20% / affiliate 10%.",
      });

      await sleep(STEP_MS);
      push({
        type: "settlement",
        status: "pending",
        summary:
          "Webhook received. Verifier passed. Mesh listing registered. PYUSD deposit in flight.",
      });

      await sleep(STEP_MS * 1.4);
      push({
        type: "settlement",
        status: "released",
        summary:
          "Released atomically. Merchant received $62.99 PYUSD; agent $17.99; affiliate $8.99. One transaction, three payees.",
        txHashes: {
          register: "0x" + randomUUID().replace(/-/g, "").padEnd(64, "0").slice(0, 64),
          deposit: "0x" + randomUUID().replace(/-/g, "").padEnd(64, "0").slice(0, 64),
          release: "0x" + randomUUID().replace(/-/g, "").padEnd(64, "0").slice(0, 64),
        },
      });

      await sleep(STEP_MS);
      push({ type: "done" });
      controller.close();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}

export async function GET() {
  return Response.json({
    endpoint: "/api/chat",
    accepts: "POST application/json { prompt?: string }",
    streams: "text/event-stream; data: { ChatEvent }",
    phase_note:
      "Deterministic eight-stage trace — scripted so the surface is legible without live keys. Drop in Vercel AI SDK streamText + OpenAI + a real Channel3 token and the same ChatEvent schema carries real tool calls.",
  });
}
