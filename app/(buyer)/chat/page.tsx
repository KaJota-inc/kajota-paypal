"use client";

import { useCallback, useRef, useState } from "react";

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

type Row = ChatEvent & { stamp: number };

const EXPLORER = "https://sepolia.arbiscan.io";
const DEFAULT_PROMPT = "A leather bag under $120 that pays its reviewer";

export default function BuyerChatPage() {
  const [prompt, setPrompt] = useState(DEFAULT_PROMPT);
  const [rows, setRows] = useState<Row[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const run = useCallback(async () => {
    if (busy) return;
    setError(null);
    setRows([]);
    setBusy(true);
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
        signal: ctrl.signal,
      });
      if (!res.ok || !res.body) {
        throw new Error(`agent stream failed: ${res.status}`);
      }
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const chunks = buffer.split("\n\n");
        buffer = chunks.pop() ?? "";
        for (const chunk of chunks) {
          const line = chunk.trim();
          if (!line.startsWith("data:")) continue;
          const payload = line.slice(5).trim();
          if (!payload) continue;
          try {
            const ev = JSON.parse(payload) as ChatEvent;
            setRows((prev) => [...prev, { ...ev, stamp: Date.now() }]);
            if (ev.type === "done") {
              setBusy(false);
            }
          } catch {
            // ignore malformed chunk
          }
        }
      }
    } catch (err) {
      if ((err as { name?: string }).name !== "AbortError") {
        setError((err as Error).message);
      }
    } finally {
      setBusy(false);
    }
  }, [prompt, busy]);

  const stop = useCallback(() => {
    abortRef.current?.abort();
    setBusy(false);
  }, []);

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-6 px-6 py-10 sm:px-10 sm:py-14">
      <header className="flex flex-col gap-2">
        <span className="text-xs font-medium uppercase tracking-wide text-zinc-500">
          Buyer surface
        </span>
        <h1 className="text-3xl font-semibold tracking-tight text-black dark:text-zinc-50">
          Agent chat
        </h1>
        <p className="max-w-2xl text-sm leading-6 text-zinc-600 dark:text-zinc-400">
          Prompt the agent. It calls Channel3 for discovery, assembles an AP2
          Cart Mandate, triggers PayPal checkout, and settles the fan-out
          through Mesh. The trace streams a deterministic eight-stage
          pipeline so the surface is legible even without live keys; drop
          in Vercel AI SDK + OpenAI + a real Channel3 token and the same
          event schema carries real tool calls.
        </p>
      </header>

      <section className="flex flex-col gap-3 rounded-xl border border-black/[.08] bg-white p-4 dark:border-white/[.12] dark:bg-zinc-950">
        <label className="flex flex-col gap-1">
          <span className="text-xs font-medium uppercase tracking-wide text-zinc-500">
            Prompt
          </span>
          <input
            type="text"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            disabled={busy}
            className="rounded-lg border border-black/[.08] bg-white px-3 py-2 text-sm font-medium text-black placeholder:text-zinc-400 focus:border-black/[.3] focus:outline-none disabled:opacity-50 dark:border-white/[.12] dark:bg-zinc-900 dark:text-zinc-50"
          />
        </label>
        <div className="flex gap-2">
          <button
            onClick={run}
            disabled={busy || prompt.trim().length === 0}
            className="rounded-lg bg-emerald-600 px-4 py-1.5 text-sm font-medium text-white transition-colors hover:bg-emerald-700 disabled:opacity-50"
          >
            {busy ? "Running…" : "Run"}
          </button>
          {busy ? (
            <button
              onClick={stop}
              className="rounded-lg border border-black/[.08] bg-white px-3 py-1.5 text-sm text-zinc-700 hover:bg-zinc-50 dark:border-white/[.12] dark:bg-zinc-900 dark:text-zinc-300"
            >
              Stop
            </button>
          ) : null}
        </div>
      </section>

      {error ? (
        <div className="rounded-lg border border-rose-500/30 bg-rose-50 p-3 text-sm text-rose-800 dark:bg-rose-500/10 dark:text-rose-200">
          {error}
        </div>
      ) : null}

      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-medium uppercase tracking-wide text-zinc-500">
          Agent trace
        </h2>
        <div className="flex flex-col gap-2 rounded-xl border border-black/[.08] bg-white p-4 dark:border-white/[.12] dark:bg-zinc-950">
          {rows.length === 0 ? (
            <p className="text-sm text-zinc-500">
              Click <strong>Run</strong> to stream the eight-stage pipeline.
            </p>
          ) : (
            rows.map((row, i) => <EventRow key={i} ev={row} />)
          )}
        </div>
      </section>
    </div>
  );
}

function EventRow({ ev }: { ev: Row }) {
  switch (ev.type) {
    case "thought":
      return (
        <Row dot="bg-zinc-400" label="thinking">
          {ev.text}
        </Row>
      );
    case "tool_call":
      return (
        <Row dot="bg-sky-500" label={`call · ${ev.tool}`}>
          <code className="font-mono text-xs text-zinc-600 dark:text-zinc-400">
            {JSON.stringify(ev.args)}
          </code>
        </Row>
      );
    case "tool_result":
      if (ev.tool === "channel3.search" && Array.isArray(ev.result)) {
        return (
          <Row dot="bg-sky-400" label={`result · ${ev.tool}`}>
            <div className="grid gap-2 sm:grid-cols-3">
              {(ev.result as Channel3Offer[]).map((offer) => (
                <OfferCard key={offer.productId} offer={offer} />
              ))}
            </div>
          </Row>
        );
      }
      return (
        <Row dot="bg-sky-400" label={`result · ${ev.tool}`}>
          <details className="text-xs">
            <summary className="cursor-pointer text-zinc-500">
              {Array.isArray(ev.result)
                ? `${ev.result.length} items returned`
                : "ok"}
            </summary>
            <pre className="mt-1 overflow-x-auto rounded bg-zinc-50 p-2 text-[11px] dark:bg-zinc-900">
              {JSON.stringify(ev.result, null, 2)}
            </pre>
          </details>
        </Row>
      );
    case "mandate":
      return (
        <Row dot="bg-amber-500" label={`${ev.kind} mandate · ${ev.id}`}>
          {ev.summary}
        </Row>
      );
    case "settlement":
      return (
        <Row
          dot={
            ev.status === "released"
              ? "bg-emerald-500"
              : ev.status === "failed"
                ? "bg-rose-500"
                : "bg-sky-500"
          }
          label={`settlement · ${ev.status}`}
        >
          <p>{ev.summary}</p>
          {ev.txHashes ? (
            <div className="mt-1 flex flex-wrap gap-2">
              {Object.entries(ev.txHashes).map(([label, hash]) => (
                <a
                  key={label}
                  href={`${EXPLORER}/tx/${hash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded border border-sky-500/30 bg-sky-500/5 px-2 py-0.5 font-mono text-[11px] text-sky-700 hover:bg-sky-500/15 dark:text-sky-300"
                >
                  {label} · {hash.slice(0, 10)}…
                </a>
              ))}
            </div>
          ) : null}
        </Row>
      );
    case "done":
      return (
        <Row dot="bg-zinc-500" label="done">
          Pipeline complete.
        </Row>
      );
  }
}

type Channel3Offer = {
  productId: string;
  title: string;
  priceCents: number;
  merchantDomain: string;
  affiliate?: { commissionBps?: number };
};

function OfferCard({ offer }: { offer: Channel3Offer }) {
  const bps = offer.affiliate?.commissionBps ?? 0;
  const reshareCents = Math.round((offer.priceCents * bps) / 10_000);
  return (
    <div className="flex flex-col gap-1.5 rounded-lg border border-black/[.08] bg-zinc-50 p-3 dark:border-white/[.1] dark:bg-zinc-900/70">
      <span className="text-[11px] uppercase tracking-wide text-zinc-500">
        {offer.merchantDomain}
      </span>
      <span className="font-medium text-zinc-900 dark:text-zinc-50">
        {offer.title}
      </span>
      <span className="font-mono text-sm text-zinc-700 dark:text-zinc-300">
        {formatCents(offer.priceCents)}
      </span>
      {bps > 0 ? (
        <div className="mt-1 inline-flex w-fit items-center gap-1 rounded-full bg-amber-500/15 px-2 py-0.5 text-[11px] font-medium text-amber-800 ring-1 ring-inset ring-amber-500/30 dark:bg-amber-400/15 dark:text-amber-200">
          <span>↻ Reshare → agent earns</span>
          <span className="font-mono">{formatCents(reshareCents)}</span>
          <span className="opacity-70">({(bps / 100).toFixed(1)}%)</span>
        </div>
      ) : null}
    </div>
  );
}

function formatCents(cents: number): string {
  const whole = Math.floor(cents / 100);
  const frac = (cents % 100).toString().padStart(2, "0");
  return `$${whole}.${frac}`;
}

function Row({
  dot,
  label,
  children,
}: {
  dot: string;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex gap-3 border-b border-black/[.04] pb-2 last:border-b-0 last:pb-0 dark:border-white/[.06]">
      <span className={`mt-1.5 h-2 w-2 flex-shrink-0 rounded-full ${dot}`} />
      <div className="flex flex-1 flex-col gap-0.5">
        <span className="text-[11px] font-medium uppercase tracking-wide text-zinc-500">
          {label}
        </span>
        <div className="text-sm leading-6 text-zinc-800 dark:text-zinc-200">
          {children}
        </div>
      </div>
    </div>
  );
}
