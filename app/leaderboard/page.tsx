"use client";

import { useCallback, useEffect, useState } from "react";

type Role = "merchant" | "agent" | "affiliate" | "platform" | "referrer";

type Row = {
  address: string;
  primaryRole: Role;
  roles: Record<Role, number>;
  earnedMinorUnits: string;
  settlementCount: number;
  lastSettledAt: string | null;
  streakDays: number;
};

type Response = {
  ok: boolean;
  window: string;
  count: number;
  computedAt: string;
  rows: Row[];
};

const EXPLORER = "https://sepolia.arbiscan.io";

const WINDOWS: { key: string; label: string }[] = [
  { key: "24h", label: "24 hours" },
  { key: "7d", label: "7 days" },
  { key: "30d", label: "30 days" },
  { key: "all", label: "all time" },
];

const ROLE_STYLE: Record<Role, string> = {
  agent:
    "bg-sky-500/10 text-sky-700 ring-sky-400/40 dark:bg-sky-400/15 dark:text-sky-200",
  affiliate:
    "bg-emerald-500/10 text-emerald-700 ring-emerald-400/40 dark:bg-emerald-400/15 dark:text-emerald-200",
  merchant:
    "bg-amber-500/10 text-amber-700 ring-amber-400/40 dark:bg-amber-400/15 dark:text-amber-200",
  platform:
    "bg-zinc-500/10 text-zinc-700 ring-zinc-400/40 dark:bg-zinc-400/15 dark:text-zinc-200",
  referrer:
    "bg-violet-500/10 text-violet-700 ring-violet-400/40 dark:bg-violet-400/15 dark:text-violet-200",
};

export default function LeaderboardPage() {
  const [windowKey, setWindowKey] = useState("all");
  const [data, setData] = useState<Response | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async (w: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/leaderboard?window=${w}`, {
        cache: "no-store",
      });
      setData((await res.json()) as Response);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    refresh(windowKey);
  }, [windowKey, refresh]);

  const top = data?.rows[0];
  const totalEarned = (data?.rows ?? []).reduce(
    (acc, r) => acc + safeBig(r.earnedMinorUnits),
    BigInt(0),
  );

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-10 px-6 py-10 sm:px-10 sm:py-14">
      <header className="flex flex-col gap-3">
        <span className="inline-flex w-fit items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-xs font-medium uppercase tracking-wide text-amber-700 dark:text-amber-200">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-amber-500" />
          Agent sell-side
        </span>
        <h1 className="text-3xl font-semibold tracking-tight text-black sm:text-4xl dark:text-zinc-50">
          Who&apos;s hustling on Mesh?
        </h1>
        <p className="max-w-3xl text-base leading-7 text-zinc-600 dark:text-zinc-400">
          Standing is a reward you don&apos;t have to pay out in cash. Every
          wallet that closes an agent-mediated sale shows up here with the
          PYUSD it earned, the role it played, and the days-in-a-row streak
          that proves it is coming back. Payout arrives in the same block as
          the merchant&apos;s — no T+30, no spreadsheet.
        </p>
      </header>

      <section className="grid gap-3 sm:grid-cols-3">
        <StatCard label="Hustlers" value={(data?.count ?? 0).toString()} />
        <StatCard
          label="PYUSD routed to agents + affiliates"
          value={formatMinor(
            (data?.rows ?? [])
              .filter((r) => r.primaryRole !== "merchant")
              .reduce((acc, r) => acc + safeBig(r.earnedMinorUnits), BigInt(0)),
          )}
        />
        <StatCard
          label="Total PYUSD across all payees"
          value={formatMinor(totalEarned)}
          caption={`${data?.window ?? "all"} · ${data?.rows.length ?? 0} rows`}
        />
      </section>

      <section className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-1 rounded-lg border border-black/[.08] bg-white p-1 dark:border-white/[.12] dark:bg-zinc-950">
          {WINDOWS.map((w) => (
            <button
              key={w.key}
              onClick={() => setWindowKey(w.key)}
              disabled={loading}
              className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                windowKey === w.key
                  ? "bg-amber-500 text-white"
                  : "text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-900"
              }`}
            >
              {w.label}
            </button>
          ))}
        </div>
        <span className="text-xs text-zinc-500">
          {loading ? "loading…" : data?.computedAt
            ? `last pull ${new Date(data.computedAt).toLocaleTimeString()}`
            : ""}
        </span>
      </section>

      {top ? (
        <section className="rounded-2xl border border-amber-500/40 bg-amber-50 p-6 dark:border-amber-500/30 dark:bg-amber-500/10">
          <div className="flex items-start justify-between gap-6">
            <div className="flex flex-col gap-1">
              <span className="text-xs font-medium uppercase tracking-wide text-amber-700 dark:text-amber-300">
                #1 this {WINDOWS.find((w) => w.key === windowKey)?.label}
              </span>
              <a
                href={`${EXPLORER}/address/${top.address}`}
                target="_blank"
                rel="noopener noreferrer"
                className="font-mono text-xl text-black hover:underline dark:text-zinc-50"
              >
                {abbreviate(top.address)}
              </a>
              <div className="mt-1 flex items-center gap-2 text-xs">
                <span
                  className={`inline-flex items-center rounded-full px-2 py-0.5 font-medium ring-1 ring-inset ${ROLE_STYLE[top.primaryRole]}`}
                >
                  {top.primaryRole}
                </span>
                <span className="text-zinc-600 dark:text-zinc-400">
                  {top.settlementCount} settlements · streak {top.streakDays} d
                </span>
              </div>
            </div>
            <div className="flex flex-col items-end gap-1">
              <span className="text-xs uppercase tracking-wide text-amber-700 dark:text-amber-300">
                Earned
              </span>
              <span className="font-mono text-2xl font-semibold text-black dark:text-zinc-50">
                {formatMinor(safeBig(top.earnedMinorUnits))}
              </span>
            </div>
          </div>
        </section>
      ) : null}

      <section className="overflow-hidden rounded-xl border border-black/[.08] bg-white shadow-sm dark:border-white/[.1] dark:bg-zinc-950">
        {data && data.rows.length === 0 ? (
          <div className="p-8 text-center text-sm text-zinc-500">
            No settlements in this window yet. Seed demo rows via{" "}
            <code className="rounded bg-black/[.06] px-1 py-0.5 text-xs dark:bg-white/[.08]">
              /dashboard
            </code>{" "}
            or wait for the next <code className="text-xs">mesh-runner</code>{" "}
            tick.
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-zinc-50 text-xs uppercase tracking-wide text-zinc-500 dark:bg-zinc-900/50 dark:text-zinc-400">
              <tr>
                <th className="px-4 py-3 text-left font-medium">#</th>
                <th className="px-4 py-3 text-left font-medium">Address</th>
                <th className="px-4 py-3 text-left font-medium">Role mix</th>
                <th className="px-4 py-3 text-right font-medium">Earned</th>
                <th className="px-4 py-3 text-right font-medium">Settlements</th>
                <th className="px-4 py-3 text-right font-medium">Streak</th>
                <th className="px-4 py-3 text-right font-medium">Last</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/[.05] dark:divide-white/[.08]">
              {data?.rows.map((row, i) => (
                <tr key={row.address}>
                  <td className="px-4 py-3 text-zinc-500">{i + 1}</td>
                  <td className="whitespace-nowrap px-4 py-3">
                    <a
                      href={`${EXPLORER}/address/${row.address}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-mono text-xs text-sky-700 hover:underline dark:text-sky-300"
                    >
                      {abbreviate(row.address)}
                    </a>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {(Object.entries(row.roles) as [Role, number][])
                        .filter(([, count]) => count > 0)
                        .map(([role, count]) => (
                          <span
                            key={role}
                            className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium ring-1 ring-inset ${ROLE_STYLE[role]}`}
                          >
                            {role}
                            <span className="opacity-70">× {count}</span>
                          </span>
                        ))}
                    </div>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-right font-mono text-sm">
                    {formatMinor(safeBig(row.earnedMinorUnits))}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {row.settlementCount}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {row.streakDays > 0 ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2 py-0.5 text-xs font-medium text-amber-700 dark:bg-amber-400/15 dark:text-amber-200">
                        {row.streakDays} d
                      </span>
                    ) : (
                      <span className="text-xs text-zinc-400">—</span>
                    )}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-right text-xs text-zinc-500">
                    {row.lastSettledAt
                      ? new Date(row.lastSettledAt).toLocaleString(undefined, {
                          dateStyle: "short",
                          timeStyle: "short",
                        })
                      : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
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

function abbreviate(value: string): string {
  if (value.length <= 14) return value;
  return `${value.slice(0, 8)}…${value.slice(-6)}`;
}

function safeBig(value: string): bigint {
  try {
    return value ? BigInt(value) : BigInt(0);
  } catch {
    return BigInt(0);
  }
}

function formatMinor(minor: bigint): string {
  const whole = minor / BigInt(1_000_000);
  const frac = minor % BigInt(1_000_000);
  const fracStr = frac.toString().padStart(6, "0").slice(0, 2);
  return `$${whole.toString()}.${fracStr}`;
}
