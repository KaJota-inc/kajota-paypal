"use client";

import { use, useCallback, useEffect, useState } from "react";
import type { BeaconReceipt, BeaconStatus } from "@/lib/beacon/types";
import type { SettlementStatus } from "@/lib/orchestrator/sessions";

const EXPLORER = "https://sepolia.arbiscan.io";

const BEACON_STATUS_STYLE: Record<BeaconStatus, string> = {
  posted:
    "bg-sky-500/10 text-sky-700 ring-sky-400/40 dark:bg-sky-400/15 dark:text-sky-200",
  "duplicate-routed":
    "bg-amber-500/10 text-amber-700 ring-amber-400/40 dark:bg-amber-400/15 dark:text-amber-200",
  settled:
    "bg-emerald-500/10 text-emerald-700 ring-emerald-400/40 dark:bg-emerald-400/15 dark:text-emerald-200",
  "sla-breached":
    "bg-rose-500/10 text-rose-700 ring-rose-400/40 dark:bg-rose-400/15 dark:text-rose-200",
};

type ReceiptResponse =
  | {
      ok: true;
      payment_mandate_id: string;
      receipt: BeaconReceipt;
      session_status: SettlementStatus;
      inspector_url: string;
    }
  | { ok: false; payment_mandate_id?: string; error: string };

export default function MandateInspectorPage({
  params,
}: {
  params: Promise<{ paymentMandateId: string }>;
}) {
  const { paymentMandateId } = use(params);
  const [data, setData] = useState<ReceiptResponse | null>(null);
  const [fetchedAtMs, setFetchedAtMs] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/mandate/receipt/${encodeURIComponent(paymentMandateId)}`,
        { cache: "no-store" },
      );
      setData((await res.json()) as ReceiptResponse);
      setFetchedAtMs(Date.now());
    } catch (err) {
      setData({
        ok: false,
        payment_mandate_id: paymentMandateId,
        error: (err as Error).message,
      });
      setFetchedAtMs(Date.now());
    } finally {
      setLoading(false);
    }
  }, [paymentMandateId]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    refresh();
  }, [refresh]);

  if (loading && !data) {
    return (
      <div className="mx-auto flex w-full max-w-4xl flex-1 flex-col items-center justify-center px-6 py-16 text-sm text-zinc-500">
        Loading receipt for{" "}
        <code className="ml-1 font-mono text-xs">{paymentMandateId}</code>…
      </div>
    );
  }

  if (!data) return null;

  if (!data.ok) {
    return (
      <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-4 px-6 py-16">
        <h1 className="text-2xl font-semibold tracking-tight text-black dark:text-zinc-50">
          Mandate Inspector
        </h1>
        <div className="rounded-xl border border-rose-500/30 bg-rose-50 p-5 text-sm dark:bg-rose-500/10">
          <p className="font-semibold text-rose-900 dark:text-rose-100">
            Receipt unavailable for{" "}
            <code className="font-mono text-xs">
              {data.payment_mandate_id ?? paymentMandateId}
            </code>
          </p>
          <p className="mt-1 text-rose-800 dark:text-rose-200">{data.error}</p>
          <p className="mt-3 text-zinc-700 dark:text-zinc-300">
            POST a Mandate pair to{" "}
            <code className="rounded bg-black/[.06] px-1 py-0.5 text-xs dark:bg-white/[.08]">
              /api/paypal/webhook
            </code>{" "}
            or seed demo rows at{" "}
            <code className="rounded bg-black/[.06] px-1 py-0.5 text-xs dark:bg-white/[.08]">
              /api/orchestrator/sessions/seed
            </code>
            , then refresh.
          </p>
        </div>
      </div>
    );
  }

  const r = data.receipt;
  const posted = new Date(r.postedAt * 1000);
  const deadline = new Date(r.deadline * 1000);
  // Remaining is "as of when the receipt was fetched" — the inspector is
  // not a live counter. Refresh the page to re-sample.
  const remainingHours = Math.max(
    0,
    Math.round((deadline.getTime() - fetchedAtMs) / (3600 * 1000)),
  );

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 px-6 py-10 sm:px-10 sm:py-14">
      <header className="flex flex-col gap-2">
        <span className="text-xs font-medium uppercase tracking-wide text-zinc-500">
          Mandate Inspector
        </span>
        <div className="flex flex-wrap items-end justify-between gap-4">
          <h1 className="text-3xl font-semibold tracking-tight text-black dark:text-zinc-50">
            {data.payment_mandate_id}
          </h1>
          <div className="flex items-center gap-2">
            <span
              className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset ${BEACON_STATUS_STYLE[r.status]}`}
            >
              beacon · {r.status}
            </span>
            <span className="inline-flex items-center rounded-full border border-black/[.08] bg-white px-2.5 py-1 text-xs font-medium text-zinc-700 dark:border-white/[.12] dark:bg-zinc-900 dark:text-zinc-300">
              session · {data.session_status}
            </span>
            <span className="inline-flex items-center rounded-full border border-black/[.08] bg-white px-2.5 py-1 text-xs font-medium text-zinc-700 dark:border-white/[.12] dark:bg-zinc-900 dark:text-zinc-300">
              occurrence #{r.occurrence}
            </span>
          </div>
        </div>
        {r.statusReason ? (
          <p className="text-sm text-rose-700 dark:text-rose-300">
            {r.statusReason}
          </p>
        ) : null}
      </header>

      <section className="grid gap-4 lg:grid-cols-2">
        <Panel
          title="Audit lineage (on-chain shape)"
          caption="Byte-identical to MandateAnchor.mandateCommitment(). A regulator recomputes this from the Mandate pair alone — no PII, no side channel."
        >
          <HashRow label="Commitment" value={r.commitment} />
          <HashRow label="Mandate id" value={r.mandateId} />
          <HashRow label="Envelope hash" value={r.envelopeHash} />
          <HashRow label="Idempotency key" value={r.idempotencyKey} />
        </Panel>

        <Panel
          title="AP2 Mandate hashes"
          caption="Base64url of sha256 over canonical JSON of the AP2 Mandate pair."
        >
          <HashRow
            label="PaymentMandateContents hash"
            value={r.paymentMandateContentsHash}
          />
          <HashRow
            label="CartMandate hash"
            value={r.cartMandateHashBase64Url}
          />
        </Panel>

        <Panel
          title="Amount + merchant"
          caption={`Payment Mandate total in ${r.currency} minor units.`}
        >
          <KeyRow
            label="Amount"
            value={`${formatMinor(r.amountMinorUnits)} ${r.currency}`}
            mono
          />
          <KeyRow
            label="Merchant"
            value={r.merchantAddress}
            mono
            href={`${EXPLORER}/address/${r.merchantAddress}`}
          />
        </Panel>

        <Panel
          title="SLA window"
          caption={`${r.slaRegime} — ${(r.slaWindowSeconds / 3600).toFixed(0)} hour window from the AP2 timestamp.`}
        >
          <KeyRow
            label="Posted"
            value={posted.toLocaleString(undefined, {
              dateStyle: "medium",
              timeStyle: "short",
            })}
          />
          <KeyRow
            label="Deadline"
            value={deadline.toLocaleString(undefined, {
              dateStyle: "medium",
              timeStyle: "short",
            })}
          />
          <KeyRow
            label="Remaining"
            value={remainingHours > 0 ? `${remainingHours} h` : "elapsed"}
            tone={
              remainingHours === 0
                ? "rose"
                : remainingHours < 4
                  ? "amber"
                  : undefined
            }
          />
        </Panel>

        <Panel
          title="Sanctions snapshot (pinned)"
          caption="A pinned snapshot is the only way an audit can be reproduced; the Beacon never follows 'current'."
        >
          <KeyRow label="List" value={r.sanctionsSnapshot.list} mono />
          <KeyRow
            label="Published"
            value={r.sanctionsSnapshot.publishedAt}
          />
          <HashRow
            label="Digest"
            value={r.sanctionsSnapshot.digest}
          />
        </Panel>

        <Panel
          title="On-chain anchor"
          caption={
            r.anchorTxHash
              ? "Receipt committed on-chain."
              : "Phase B — not anchored yet. Receipt is deterministic from the Mandate pair."
          }
        >
          {r.anchorTxHash ? (
            <>
              <KeyRow
                label="Tx"
                value={r.anchorTxHash}
                mono
                href={`${EXPLORER}/tx/${r.anchorTxHash}`}
              />
              <KeyRow
                label="Chain id"
                value={r.anchorChainId?.toString() ?? "—"}
                mono
              />
            </>
          ) : (
            <p className="text-sm text-zinc-500">
              The commitment above is what{" "}
              <code className="font-mono text-xs">
                MandateAnchor.mandateCommitment(mandateId)
              </code>{" "}
              will return once{" "}
              <code className="font-mono text-xs">
                MANDATE_BEACON_ADDRESS
              </code>{" "}
              is deployed.
            </p>
          )}
        </Panel>
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="text-sm font-medium uppercase tracking-wide text-zinc-500">
          Raw receipt
        </h2>
        <details className="rounded-xl border border-black/[.08] bg-white p-4 dark:border-white/[.12] dark:bg-zinc-950">
          <summary className="cursor-pointer text-sm font-medium text-black dark:text-zinc-100">
            View signed JSON
          </summary>
          <pre className="mt-3 overflow-x-auto text-xs text-zinc-700 dark:text-zinc-300">
            {JSON.stringify(r, null, 2)}
          </pre>
        </details>
      </section>
    </div>
  );
}

function Panel({
  title,
  caption,
  children,
}: {
  title: string;
  caption?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-2 rounded-xl border border-black/[.08] bg-white p-4 dark:border-white/[.12] dark:bg-zinc-950">
      <h3 className="text-sm font-semibold text-black dark:text-zinc-100">
        {title}
      </h3>
      {caption ? (
        <p className="text-xs leading-5 text-zinc-500">{caption}</p>
      ) : null}
      <div className="mt-2 flex flex-col gap-1.5 text-sm">{children}</div>
    </div>
  );
}

function HashRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <span className="min-w-[120px] text-xs text-zinc-500">{label}</span>
      <code className="font-mono text-xs break-all text-right text-zinc-900 dark:text-zinc-100">
        {value}
      </code>
    </div>
  );
}

function KeyRow({
  label,
  value,
  mono,
  href,
  tone,
}: {
  label: string;
  value: string;
  mono?: boolean;
  href?: string;
  tone?: "rose" | "amber";
}) {
  const toneStyle =
    tone === "rose"
      ? "text-rose-700 dark:text-rose-300"
      : tone === "amber"
        ? "text-amber-700 dark:text-amber-300"
        : "text-zinc-900 dark:text-zinc-100";
  const content = (
    <span
      className={`${mono ? "font-mono text-xs" : "text-sm"} ${toneStyle}`}
    >
      {value}
    </span>
  );
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="min-w-[100px] text-xs text-zinc-500">{label}</span>
      {href ? (
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="hover:underline"
        >
          {content}
        </a>
      ) : (
        content
      )}
    </div>
  );
}

function formatMinor(minorStr: string): string {
  try {
    const minor = BigInt(minorStr);
    const whole = minor / BigInt(1_000_000);
    const frac = minor % BigInt(1_000_000);
    const fracStr = frac.toString().padStart(6, "0").slice(0, 2);
    return `$${whole.toString()}.${fracStr}`;
  } catch {
    return minorStr;
  }
}
