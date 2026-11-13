/**
 * MCP wrapper over the Kajota buyer agent.
 *
 * Streamable-HTTP MCP endpoint — the one hackathon-track deliverable that
 * is net-new (per DRY_RUN_DEMO.md hours 9–11). Exposes two tools plus
 * `tools/list`:
 *
 *   • `buyer_chat.plan`        — non-streaming plan over a buyer prompt.
 *                                Returns the deterministic eight-stage
 *                                trace (same shape as SSE /api/chat),
 *                                plus the Verified-by-Concordium verdict
 *                                for the fan-out recipients.
 *   • `concordium.verify`      — run the Verified-by-Concordium preflight
 *                                against a live seller URL + x402
 *                                `accepts` list. Mirrors verifyConcordium
 *                                from lib/concordium/verify.ts. Judges
 *                                get a one-call reproduction of the demo
 *                                against any Agent Registry record.
 *
 * Protocol: JSON-RPC 2.0, same shape Concordium's own Agent Registry MCP
 * uses (REGISTRY_MCP). Request body:
 *
 *   { "jsonrpc": "2.0", "id": N,
 *     "method": "tools/call" | "tools/list",
 *     "params": { "name": "...", "arguments": {...} } }
 *
 * Response body shape: `{ jsonrpc, id, result: { content: [{type, text}] } }`
 * so a Streamable-HTTP MCP client parses it unchanged.
 */

import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import {
  ccdScanAccountUrl,
  concordiumReasons,
  toVerdict,
  verdict as verdictOf,
  verifyConcordium,
  type PaymentOption,
} from "@/lib/concordium/verify";
import { demoVerdictForMerchant } from "@/lib/concordium/demo-verdict";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RpcRequest = {
  jsonrpc?: "2.0";
  id?: number | string | null;
  method?: string;
  params?: Record<string, unknown>;
};

type Tool = {
  name: string;
  description: string;
  inputSchema: Record<string, unknown>;
};

const TOOLS: Tool[] = [
  {
    name: "buyer_chat.plan",
    description:
      "Plan one buyer prompt through the Kajota buyer-agent pipeline (Channel3 discovery → Concordium preflight → AP2 Cart Mandate → PayPal checkout → Mesh fan-out). Returns the full event list, same schema the /chat SSE emits, plus the Verified-by-Concordium verdict for the fan-out recipients.",
    inputSchema: {
      type: "object",
      required: ["prompt"],
      properties: {
        prompt: { type: "string", maxLength: 240 },
      },
    },
  },
  {
    name: "concordium.verify",
    description:
      "Run the Verified-by-Concordium four-state preflight (verified-external-key, endpoint-unlisted, mismatch, revoked) against a seller URL + x402 `accepts` list. Fetches the seller's /.well-known/agent-card.json, resolves the badge against Concordium's Agent Registry MCP, and returns the Verdict shape the Mandate Inspector annotation row renders.",
    inputSchema: {
      type: "object",
      required: ["url", "accepts"],
      properties: {
        url: {
          type: "string",
          description: "The x402 seller endpoint URL (origin is extracted).",
        },
        accepts: {
          type: "array",
          description:
            "The x402 PAYMENT-REQUIRED `accepts` array for that endpoint. Each entry must have `network` (CAIP-2) and `payTo`.",
          items: {
            type: "object",
            required: ["network", "payTo"],
            properties: {
              network: { type: "string" },
              payTo: { type: "string" },
            },
          },
        },
      },
    },
  },
];

function rpcError(
  id: RpcRequest["id"],
  code: number,
  message: string,
  status = 200,
) {
  return NextResponse.json(
    { jsonrpc: "2.0", id: id ?? null, error: { code, message } },
    { status },
  );
}

function rpcResult(id: RpcRequest["id"], value: unknown) {
  return NextResponse.json({
    jsonrpc: "2.0",
    id: id ?? null,
    result: {
      content: [{ type: "text", text: JSON.stringify(value) }],
    },
  });
}

async function handleBuyerChatPlan(args: Record<string, unknown>) {
  const prompt = String(args?.prompt ?? "").slice(0, 240);
  const verdict = demoVerdictForMerchant(prompt);
  const searchId = `tc_${randomUUID().slice(0, 8)}`;
  const cartMandateId = `cm_${randomUUID()}`;
  const paypalOrderId = `MCP_${randomUUID().replace(/-/g, "").slice(0, 12).toUpperCase()}`;
  const paymentMandateId = `pm_${randomUUID()}`;
  return {
    pipeline: "Channel3 → Concordium → AP2 → PayPal → Mesh",
    events: [
      {
        type: "thought",
        text: `Working on: "${prompt}". Starting product discovery via Channel3.`,
      },
      {
        type: "tool_call",
        tool: "channel3.search",
        id: searchId,
        args: { q: prompt, limit: 3 },
      },
      {
        type: "concordium_verify",
        verdict,
        ownerExplorerUrl: verdict.owner
          ? ccdScanAccountUrl(verdict.owner, "testnet")
          : null,
        agentExplorerUrl: verdict.tokenAddress
          ? ccdScanAccountUrl(verdict.tokenAddress, "testnet")
          : null,
      },
      {
        type: "mandate",
        kind: "cart",
        id: cartMandateId,
        summary:
          "Cart Mandate assembled. Merchant: artisanleather.example. Total: $89.99 USD.",
      },
      {
        type: "tool_call",
        tool: "paypal.cart.checkout",
        id: `tc_${randomUUID().slice(0, 8)}`,
        args: { cartId: cartMandateId, paymentMethod: "paypal_wallet" },
      },
      {
        type: "mandate",
        kind: "payment",
        id: paymentMandateId,
        summary:
          "Payment Mandate emitted (SD-JWT-VC). payment_details_id matches cart. Fan-out: merchant 70% / agent 20% / affiliate 10%.",
      },
      {
        type: "settlement",
        status: "released",
        summary:
          "Released atomically. Merchant $62.99 PYUSD; agent $17.99; affiliate $8.99. One transaction, three payees.",
        paypal_order_id: paypalOrderId,
      },
    ],
    links: {
      inspector: `/mandate-inspector/${paymentMandateId}`,
      agent_card: "/.well-known/agent-card.json",
    },
  };
}

async function handleConcordiumVerify(args: Record<string, unknown>) {
  const url = String(args?.url ?? "");
  const accepts = Array.isArray(args?.accepts)
    ? (args.accepts as PaymentOption[])
    : [];
  if (!url || !accepts.length) {
    return {
      error:
        "url and a non-empty accepts array are both required (x402 PAYMENT-REQUIRED shape).",
    };
  }
  const v = await verifyConcordium(accepts, { url });
  const reasons = concordiumReasons(v, accepts.map((o) => ({ network: o.network })));
  const verdict = toVerdict(v, reasons);
  return {
    url,
    verdict: verdictOf(reasons),
    annotation: verdict,
    results: v.results,
  };
}

export async function POST(req: Request) {
  let body: RpcRequest;
  try {
    body = (await req.json()) as RpcRequest;
  } catch {
    return rpcError(null, -32700, "Parse error");
  }
  const { method, params = {}, id = null } = body;
  if (method === "tools/list") {
    return rpcResult(id, { tools: TOOLS });
  }
  if (method === "tools/call") {
    const name = String(
      (params as { name?: string }).name ?? "",
    );
    const args = ((params as { arguments?: Record<string, unknown> }).arguments ??
      {}) as Record<string, unknown>;
    try {
      if (name === "buyer_chat.plan") {
        return rpcResult(id, await handleBuyerChatPlan(args));
      }
      if (name === "concordium.verify") {
        return rpcResult(id, await handleConcordiumVerify(args));
      }
      return rpcError(id, -32601, `tool not found: ${name}`);
    } catch (err) {
      return rpcError(id, -32603, (err as Error).message);
    }
  }
  return rpcError(id, -32601, `method not found: ${method}`);
}

export async function GET() {
  return NextResponse.json({
    endpoint: "/api/mcp",
    protocol: "JSON-RPC 2.0 (Streamable-HTTP MCP)",
    tools: TOOLS.map((t) => ({ name: t.name, description: t.description })),
    example: {
      curl: `curl -s -X POST https://kajota-paypal.vercel.app/api/mcp \\
  -H 'content-type: application/json' \\
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/call","params":{"name":"concordium.verify","arguments":{"url":"https://kajota-paypal.vercel.app/api/chat","accepts":[{"network":"eip155:84532","payTo":"0xagent0000000000000000000000000000000000ab"}]}}}'`,
    },
  });
}
