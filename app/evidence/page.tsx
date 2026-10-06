"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  MESH_ARBITRUM_SEPOLIA,
  TOKENS_ARBITRUM_SEPOLIA,
} from "@/lib/mesh/addresses";
import type { Session, SettlementStatus } from "@/lib/orchestrator/sessions";

const EXPLORER = "https://sepolia.arbiscan.io";
const REFRESH_MS = 60_000;

const STATUS_STYLE: Record<SettlementStatus, string> = {
  "pending-register":
    "bg-amber-500/10 text-amber-700 ring-amber-400/40 dark:bg-amber-400/15 dark:text-amber-200",
  "pending-deposit":
    "bg-amber-500/10 text-amber-700 ring-amber-400/40 dark:bg-amber-400/15 dark:text-amber-200",
  "pending-release":
    "bg-sky-500/10 text-sky-700 ring-sky-400/40 dark:bg-sky-400/15 dark:text-sky-200",
  released:
    "bg-emerald-500/10 text-emerald-700 ring-emerald-400/40 dark:bg-emerald-400/15 dark:text-emerald-200",
  refunded:
    "bg-zinc-500/10 text-zinc-700 ring-zinc-400/40 dark:bg-zinc-400/15 dark:text-zinc-200",
  failed:
    "bg-rose-500/10 text-rose-700 ring-rose-400/40 dark:bg-rose-400/15 dark:text-rose-200",
};

export default function EvidencePage() {
  const [rows, setRows] = useState<Session[]>([]);
  const [refreshedAt, setRefreshedAt] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch("/api/orchestrator/sessions", {
        cache: "no-store",
      });
      const data = (await res.json()) as { sessions?: Session[]; error?: string };
      if (!res.ok) throw new Error(data.error ?? `HTTP ${res.status}`);
      setRows(data.sessions ?? []);
      setRefreshedAt(new Date().toISOString());
      setError(null);
    } catch (err) {
      setError((err as Error).message);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    refresh();
    const t = setInterval(refresh, REFRESH_MS);
    return () => clearInterval(t);
  }, [refresh]);

  const stats = useMemo(() => {
    const total = rows.length;
    const released = rows.filter((r) => r.status === "released").length;
    const pending = rows.filter((r) => r.status.startsWith("pending")).length;
    const failed = rows.filter((r) => r.status === "failed").length;
    const grossMinor = rows.reduce(
      (acc, r) => acc + safeBig(r.grossAmountMinorUnits),
      BigInt(0),
    );
    const recipients = rows.reduce((acc, r) => acc + r.recipients.length, 0);
    return { total, released, pending, failed, grossMinor, recipients };
  }, [rows]);

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-10 px-6 py-10 sm:px-10 sm:py-14">
      <header className="flex flex-col gap-3">
        <span className="inline-flex w-fit items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-medium uppercase tracking-wide text-emerald-700 dark:text-emerald-300">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" />
          Live · public · no login required
        </span>
        <h1 className="text-3xl font-semibold tracking-tight text-black sm:text-4xl dark:text-zinc-50">
          Evidence &mdash; the pipeline is settling, right now
        </h1>
        <p className="max-w-3xl text-base leading-7 text-zinc-600 dark:text-zinc-400">
          Every PayPal order that reaches our webhook writes a Session row. The
          merchant dashboard shows them; this page is the public version a
          judge can refresh to confirm activity from today. Auto-refreshes
          every 60 seconds; last pull at{" "}
          <span className="font-mono text-zinc-900 dark:text-zinc-100">
            {refreshedAt ? new Date(refreshedAt).toLocaleTimeString() : "…"}
          </span>
          .
        </p>
      </header>

      <section className="grid gap-3 sm:grid-cols-4">
        <StatCard label="Settlements" value={stats.total.toString()} />
        <StatCard
          label="Gross routed"
          value={formatMinor(stats.grossMinor, "USD")}
        />
        <StatCard
          label="Fanned out"
          value={`${stats.released} / ${stats.total}`}
          caption={`${stats.recipients} recipients across all rows`}
        />
        <StatCard
          label="Pending · failed"
          value={`${stats.pending} · ${stats.failed}`}
          caption="live pipeline health"
        />
      </section>

      {error ? (
        <div className="rounded-lg border border-rose-500/30 bg-rose-50 p-3 text-sm text-rose-800 dark:bg-rose-500/10 dark:text-rose-200">
          {error}
        </div>
      ) : null}

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold tracking-tight text-black dark:text-zinc-50">
          Latest settlements
        </h2>
        <div className="overflow-hidden rounded-xl border border-black/[.08] bg-white shadow-sm dark:border-white/[.1] dark:bg-zinc-950">
          {rows.length === 0 ? (
            <div className="p-8 text-center text-sm text-zinc-500">
              No settlements in this instance yet. The{" "}
              <code className="rounded bg-black/[.06] px-1 py-0.5 text-xs dark:bg-white/[.08]">
                mesh-runner
              </code>{" "}
              GitHub Action fires every six hours; the next tick will land
              here. If you&apos;re driving the demo, POST a signed Mandate
              pair to{" "}
              <code className="rounded bg-black/[.06] px-1 py-0.5 text-xs dark:bg-white/[.08]">
                /api/paypal/webhook
              </code>{" "}
              and refresh.
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-zinc-50 text-xs uppercase tracking-wide text-zinc-500 dark:bg-zinc-900/50 dark:text-zinc-400">
                <tr>
                  <th className="px-4 py-3 text-left font-medium">When</th>
                  <th className="px-4 py-3 text-left font-medium">Status</th>
                  <th className="px-4 py-3 text-left font-medium">
                    PayPal order
                  </th>
                  <th className="px-4 py-3 text-right font-medium">Gross</th>
                  <th className="px-4 py-3 text-left font-medium">Fan-out</th>
                  <th className="px-4 py-3 text-left font-medium">
                    On-chain receipts
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/[.05] dark:divide-white/[.08]">
                {rows.slice(0, 10).map((r) => (
                  <tr key={r.paymentMandateId}>
                    <td className="whitespace-nowrap px-4 py-3 text-xs text-zinc-500">
                      {new Date(r.updatedAt).toLocaleString(undefined, {
                        dateStyle: "short",
                        timeStyle: "medium",
                      })}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${STATUS_STYLE[r.status]}`}
                      >
                        {r.status}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 font-mono text-xs">
                      {r.paypalOrderId}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-right font-mono text-sm">
                      {formatMinor(safeBig(r.grossAmountMinorUnits), r.currency)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-col gap-0.5 text-xs">
                        {r.recipients.map((rec) => (
                          <div
                            key={rec.address + rec.role}
                            className="flex items-center justify-between gap-3"
                          >
                            <span className="text-zinc-500">{rec.role}</span>
                            <span className="font-mono">
                              {formatMinor(
                                safeBig(rec.payoutMinorUnits),
                                r.currency,
                              )}
                            </span>
                          </div>
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-2 text-xs">
                        <TxLink
                          label="register"
                          hash={r.registerTxHash}
                          kind="tx"
                        />
                        <TxLink
                          label="deposit"
                          hash={r.depositTxHash}
                          kind="tx"
                        />
                        <TxLink label="release" hash={r.releaseTxHash} kind="tx" />
                        <TxLink
                          label="listing"
                          hash={r.listingId}
                          kind="address"
                        />
                      </div>
                      {r.errorReason ? (
                        <p className="mt-1 text-xs text-rose-700 dark:text-rose-300">
                          {r.errorReason}
                        </p>
                      ) : null}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold tracking-tight text-black dark:text-zinc-50">
          Verify this yourself
        </h2>
        <p className="text-sm leading-6 text-zinc-600 dark:text-zinc-400">
          The pipeline is built on verified public contracts on Arbitrum
          Sepolia (chain id{" "}
          <span className="font-mono text-zinc-900 dark:text-zinc-100">
            421614
          </span>
          ). Click any address to read it on Arbiscan.
        </p>
        <div className="grid gap-2 rounded-xl border border-black/[.08] bg-white p-4 text-sm dark:border-white/[.1] dark:bg-zinc-950">
          <AddressLink label="CosellRegistryV2" address={MESH_ARBITRUM_SEPOLIA.cosellRegistryV2} />
          <AddressLink label="CosellEscrowV2 (USDC)" address={MESH_ARBITRUM_SEPOLIA.cosellEscrowV2Usdc} />
          <AddressLink label="CosellEscrowV2 (USDG)" address={MESH_ARBITRUM_SEPOLIA.cosellEscrowV2Usdg} />
          <AddressLink label="AgentIdentityBinding" address={MESH_ARBITRUM_SEPOLIA.agentIdentityBinding} />
          <AddressLink label="X402DepositFacilitator (USDC)" address={MESH_ARBITRUM_SEPOLIA.x402DepositFacilitatorUsdc} />
          <AddressLink label="X402DepositFacilitator (USDG)" address={MESH_ARBITRUM_SEPOLIA.x402DepositFacilitatorUsdg} />
          <AddressLink label="Paxos PYUSD (token)" address={TOKENS_ARBITRUM_SEPOLIA.pyusd} />
          <AddressLink label="Circle USDC (token)" address={TOKENS_ARBITRUM_SEPOLIA.usdc} />
          <AddressLink label="Paxos USDG (token)" address={TOKENS_ARBITRUM_SEPOLIA.usdg} />
        </div>
      </section>

      <footer className="flex flex-col gap-2 border-t border-black/[.08] pt-6 text-xs text-zinc-500 dark:border-white/[.08]">
        <p>
          Source and reproducers at{" "}
          <a
            href="https://github.com/KaJota-inc/kajota-paypal"
            className="font-mono text-sky-700 hover:underline dark:text-sky-300"
          >
            github.com/KaJota-inc/kajota-paypal
          </a>
          .{" "}
          <code className="rounded bg-black/[.06] px-1 py-0.5 dark:bg-white/[.08]">
            pnpm reproduce
          </code>{" "}
          runs the happy path;{" "}
          <code className="rounded bg-black/[.06] px-1 py-0.5 dark:bg-white/[.08]">
            pnpm reproduce:fail
          </code>{" "}
          fires every adversarial gate.
        </p>
      </footer>
    </div>
  );
}

function StatCard({
  label,
  value,
  caption,
}: {
  label: string;
  value: string;
  caption?: string;
}) {
  return (
    <div className="flex flex-col gap-1 rounded-xl border border-black/[.08] bg-white p-4 dark:border-white/[.1] dark:bg-zinc-950">
      <span className="text-xs font-medium uppercase tracking-wide text-zinc-500">
        {label}
      </span>
      <span className="font-mono text-xl font-semibold text-black dark:text-zinc-50">
        {value}
      </span>
      {caption ? (
        <span className="text-xs text-zinc-500">{caption}</span>
      ) : null}
    </div>
  );
}

function TxLink({
  label,
  hash,
  kind,
}: {
  label: string;
  hash: string | undefined;
  kind: "tx" | "address";
}) {
  if (!hash) {
    return (
      <span className="rounded border border-black/[.06] bg-zinc-50 px-2 py-0.5 font-mono text-xs text-zinc-400 dark:border-white/[.08] dark:bg-zinc-900 dark:text-zinc-500">
        {label}
      </span>
    );
  }
  return (
    <a
      href={`${EXPLORER}/${kind}/${hash}`}
      target="_blank"
      rel="noopener noreferrer"
      className="rounded border border-sky-500/30 bg-sky-500/5 px-2 py-0.5 font-mono text-xs text-sky-700 hover:bg-sky-500/15 dark:text-sky-300"
    >
      {label}
    </a>
  );
}

function AddressLink({ label, address }: { label: string; address: string | null }) {
  if (!address) {
    return (
      <div className="flex items-center justify-between gap-3">
        <span className="text-zinc-700 dark:text-zinc-300">{label}</span>
        <span className="rounded bg-amber-500/10 px-2 py-0.5 font-mono text-xs text-amber-700 dark:text-amber-300">
          pending deploy
        </span>
      </div>
    );
  }
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-zinc-700 dark:text-zinc-300">{label}</span>
      <a
        href={`${EXPLORER}/address/${address}`}
        target="_blank"
        rel="noopener noreferrer"
        className="font-mono text-xs text-sky-700 hover:underline dark:text-sky-300"
      >
        {address}
      </a>
    </div>
  );
}

function safeBig(v: string | undefined): bigint {
  try {
    return v ? BigInt(v) : BigInt(0);
  } catch {
    return BigInt(0);
  }
}

function formatMinor(minor: bigint, currency: string): string {
  const whole = minor / BigInt(1_000_000);
  const frac = minor % BigInt(1_000_000);
  const fracStr = frac.toString().padStart(6, "0").slice(0, 2);
  return `$${whole.toString()}.${fracStr} ${currency}`;
}
