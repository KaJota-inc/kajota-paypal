"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { AgGridReact } from "ag-grid-react";
import {
  AllCommunityModule,
  ModuleRegistry,
  themeQuartz,
  type ColDef,
  type ICellRendererParams,
  type ValueFormatterParams,
} from "ag-grid-community";
import type { Session, SessionRecipient, SettlementStatus } from "@/lib/orchestrator/sessions";

ModuleRegistry.registerModules([AllCommunityModule]);

const EXPLORER = "https://sepolia.arbiscan.io";

const STATUS_STYLE: Record<SettlementStatus, string> = {
  "pending-register":
    "bg-amber-500/10 text-amber-700 dark:bg-amber-400/15 dark:text-amber-300",
  "pending-deposit":
    "bg-amber-500/10 text-amber-700 dark:bg-amber-400/15 dark:text-amber-300",
  "pending-release":
    "bg-sky-500/10 text-sky-700 dark:bg-sky-400/15 dark:text-sky-300",
  released:
    "bg-emerald-500/10 text-emerald-700 dark:bg-emerald-400/15 dark:text-emerald-300",
  refunded:
    "bg-zinc-500/10 text-zinc-700 dark:bg-zinc-400/15 dark:text-zinc-300",
  failed:
    "bg-rose-500/10 text-rose-700 dark:bg-rose-400/15 dark:text-rose-300",
};

export default function MerchantDashboardPage() {
  const [rows, setRows] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<"seed" | "clear" | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/orchestrator/sessions", {
        cache: "no-store",
      });
      const data = (await res.json()) as { sessions?: Session[]; error?: string };
      if (!res.ok) throw new Error(data.error ?? `HTTP ${res.status}`);
      setRows(data.sessions ?? []);
      setError(null);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    refresh();
  }, [refresh]);

  const seed = useCallback(async () => {
    setBusy("seed");
    try {
      await fetch("/api/orchestrator/sessions/seed", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ count: 3 }),
      });
      await refresh();
    } finally {
      setBusy(null);
    }
  }, [refresh]);

  const clear = useCallback(async () => {
    setBusy("clear");
    try {
      await fetch("/api/orchestrator/sessions/seed", { method: "DELETE" });
      await refresh();
    } finally {
      setBusy(null);
    }
  }, [refresh]);

  const columns = useMemo<ColDef<Session>[]>(
    () => [
      {
        field: "updatedAt",
        headerName: "Updated",
        width: 170,
        sort: "desc",
        valueFormatter: (p: ValueFormatterParams<Session, string>) =>
          p.value
            ? new Date(p.value).toLocaleString(undefined, {
                dateStyle: "short",
                timeStyle: "medium",
              })
            : "",
      },
      {
        field: "paypalOrderId",
        headerName: "PayPal order",
        width: 170,
        cellClass: "font-mono text-xs",
      },
      {
        field: "status",
        headerName: "Status",
        width: 140,
        cellRenderer: (p: ICellRendererParams<Session, SettlementStatus>) => {
          const status = p.value;
          if (!status) return null;
          return (
            <span
              className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_STYLE[status]}`}
            >
              {status}
            </span>
          );
        },
      },
      {
        field: "merchantName",
        headerName: "Merchant",
        flex: 1,
        minWidth: 160,
      },
      {
        field: "grossAmountMinorUnits",
        headerName: "Gross",
        width: 110,
        valueFormatter: (p: ValueFormatterParams<Session, string>) =>
          p.value && p.data
            ? formatMinor(p.value, p.data.currency)
            : "",
      },
      {
        headerName: "Fan-out",
        width: 240,
        valueGetter: (p) => p.data?.recipients ?? [],
        cellRenderer: (p: ICellRendererParams<Session, SessionRecipient[]>) =>
          p.value ? (
            <div className="flex flex-col gap-0.5 py-1 text-xs leading-tight">
              {p.value.map((r) => (
                <div
                  key={r.address + r.role}
                  className="flex justify-between gap-2"
                >
                  <span className="text-zinc-500">{r.role}</span>
                  <span className="font-mono">
                    {formatMinor(r.payoutMinorUnits, p.data?.currency ?? "USD")}
                  </span>
                </div>
              ))}
            </div>
          ) : null,
        autoHeight: true,
      },
      {
        field: "listingId",
        headerName: "Listing",
        width: 140,
        cellRenderer: hashLink("address"),
      },
      {
        field: "registerTxHash",
        headerName: "Register",
        width: 110,
        cellRenderer: hashLink("tx"),
      },
      {
        field: "depositTxHash",
        headerName: "Deposit",
        width: 110,
        cellRenderer: hashLink("tx"),
      },
      {
        field: "releaseTxHash",
        headerName: "Release",
        width: 110,
        cellRenderer: hashLink("tx"),
      },
      {
        headerName: "Inspector",
        width: 100,
        valueGetter: (p) => p.data?.paymentMandateId,
        cellRenderer: InspectorLinkCell,
      },
      {
        field: "errorReason",
        headerName: "Error",
        flex: 1,
        minWidth: 220,
        wrapText: true,
        autoHeight: true,
        cellClass: "text-xs text-rose-700 dark:text-rose-300",
      },
    ],
    [],
  );

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-6 px-6 py-10 sm:px-10 sm:py-14">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex flex-col gap-1">
          <span className="text-xs font-medium uppercase tracking-wide text-zinc-500">
            Merchant surface
          </span>
          <h1 className="text-3xl font-semibold tracking-tight text-black dark:text-zinc-50">
            Settlement dashboard
          </h1>
          <p className="max-w-2xl text-sm leading-6 text-zinc-600 dark:text-zinc-400">
            Every PayPal order through the pipeline, with its Mandate hash,
            Mesh listing, N-way fan-out and on-chain receipts.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={seed}
            disabled={busy !== null}
            className="rounded-lg border border-black/[.1] bg-white px-3 py-1.5 text-sm font-medium transition-colors hover:bg-zinc-50 disabled:opacity-50 dark:border-white/[.12] dark:bg-zinc-900 dark:hover:bg-zinc-800"
          >
            {busy === "seed" ? "Seeding…" : "Seed demo rows"}
          </button>
          <button
            onClick={clear}
            disabled={busy !== null}
            className="rounded-lg border border-black/[.08] bg-white px-3 py-1.5 text-sm text-zinc-700 transition-colors hover:bg-zinc-50 disabled:opacity-50 dark:border-white/[.1] dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800"
          >
            {busy === "clear" ? "Clearing…" : "Clear"}
          </button>
          <button
            onClick={refresh}
            disabled={loading}
            className="rounded-lg border border-black/[.08] bg-white px-3 py-1.5 text-sm text-zinc-700 transition-colors hover:bg-zinc-50 disabled:opacity-50 dark:border-white/[.1] dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800"
          >
            {loading ? "Loading…" : "Refresh"}
          </button>
        </div>
      </header>

      {error ? (
        <div className="rounded-lg border border-rose-500/30 bg-rose-50 p-3 text-sm text-rose-800 dark:bg-rose-500/10 dark:text-rose-200">
          {error}
        </div>
      ) : null}

      <section className="h-[640px] w-full overflow-hidden rounded-xl border border-black/[.08] bg-white shadow-sm dark:border-white/[.1] dark:bg-zinc-950">
        {rows.length === 0 && !loading ? (
          <div className="flex h-full flex-col items-center justify-center gap-3 p-6 text-center text-sm text-zinc-500">
            <p>
              No settlements yet. Click <strong>Seed demo rows</strong> to populate
              with three sample fan-outs, or POST to{" "}
              <code className="rounded bg-black/[.06] px-1 py-0.5 text-xs dark:bg-white/[.08]">
                /api/paypal/webhook
              </code>{" "}
              with an AP2 Cart + Payment Mandate pair.
            </p>
          </div>
        ) : (
          <AgGridReact<Session>
            rowData={rows}
            columnDefs={columns}
            rowHeight={76}
            headerHeight={38}
            animateRows
            theme={themeQuartz}
          />
        )}
      </section>
    </div>
  );
}

function InspectorLinkCell(p: ICellRendererParams<Session, string>) {
  const id = p.value;
  if (!id) return null;
  return (
    <a
      href={`/mandate-inspector/${encodeURIComponent(id)}`}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1 rounded border border-emerald-500/30 bg-emerald-500/5 px-2 py-0.5 text-xs font-medium text-emerald-700 hover:bg-emerald-500/15 dark:text-emerald-300"
    >
      open ↗
    </a>
  );
}
InspectorLinkCell.displayName = "InspectorLinkCell";

function hashLink(kind: "tx" | "address") {
  const prefix = kind === "tx" ? "tx" : "address";
  const Renderer = (p: ICellRendererParams<Session, string>) => {
    const value = p.value;
    if (!value || typeof value !== "string") return null;
    return (
      <a
        href={`${EXPLORER}/${prefix}/${value}`}
        target="_blank"
        rel="noopener noreferrer"
        className="font-mono text-xs text-sky-700 hover:underline dark:text-sky-300"
      >
        {abbreviate(value)}
      </a>
    );
  };
  Renderer.displayName = `HashLink(${kind})`;
  return Renderer;
}

function abbreviate(value: string): string {
  if (value.length <= 12) return value;
  return `${value.slice(0, 6)}…${value.slice(-4)}`;
}

function formatMinor(minor: string, currency: string): string {
  try {
    const value = BigInt(minor);
    const whole = value / BigInt(1_000_000);
    const frac = value % BigInt(1_000_000);
    const fracStr = frac.toString().padStart(6, "0").slice(0, 2);
    return `$${whole.toString()}.${fracStr} ${currency}`;
  } catch {
    return minor;
  }
}
