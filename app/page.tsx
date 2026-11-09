import Link from "next/link";

export default function Home() {
  return (
    <div className="flex flex-1 flex-col bg-zinc-50 font-sans dark:bg-black">
      <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-10 px-6 py-16 sm:px-10 sm:py-24">
        <header className="flex flex-col gap-3">
          <span className="inline-flex w-fit items-center gap-2 rounded-full border border-black/[.08] bg-white px-3 py-1 text-xs font-medium uppercase tracking-wide text-zinc-700 dark:border-white/[.12] dark:bg-black dark:text-zinc-300">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            PayPal AI Hackathon · 12 Nov 2026
          </span>
          <h1 className="max-w-3xl text-4xl font-semibold leading-[1.08] tracking-tight text-black sm:text-5xl dark:text-zinc-50">
            The 43rd tool for the PayPal Agent Toolkit.
          </h1>
          <p className="max-w-2xl text-lg leading-8 text-zinc-600 dark:text-zinc-400">
            PayPal takes the buyer&rsquo;s one payment. Kajota Mesh fans the
            proceeds atomically to the merchant, the agent that closed the
            sale, and the affiliate &mdash; one transaction, N payees,{" "}
            <span className="font-medium text-zinc-900 dark:text-zinc-100">
              AP2-bound and PYUSD-settled on Arbitrum
            </span>
            .
          </p>
        </header>

        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Link
            href="/chat"
            className="group flex flex-col gap-2 rounded-xl border border-black/[.08] bg-white p-6 transition-colors hover:border-black/[.2] dark:border-white/[.12] dark:bg-zinc-950 dark:hover:border-white/[.3]"
          >
            <span className="text-xs font-medium uppercase tracking-wide text-zinc-500">
              Buyer
            </span>
            <h2 className="text-lg font-semibold text-black dark:text-zinc-50">
              Agent chat &rarr;
            </h2>
            <p className="text-sm leading-6 text-zinc-600 dark:text-zinc-400">
              Shop in natural language. Channel3, AP2 Cart Mandate, PayPal
              checkout.
            </p>
          </Link>
          <Link
            href="/dashboard"
            className="group flex flex-col gap-2 rounded-xl border border-black/[.08] bg-white p-6 transition-colors hover:border-black/[.2] dark:border-white/[.12] dark:bg-zinc-950 dark:hover:border-white/[.3]"
          >
            <span className="text-xs font-medium uppercase tracking-wide text-zinc-500">
              Merchant
            </span>
            <h2 className="text-lg font-semibold text-black dark:text-zinc-50">
              Settlement dashboard &rarr;
            </h2>
            <p className="text-sm leading-6 text-zinc-600 dark:text-zinc-400">
              Every order, Mandate, listing, N-way fan-out, Arbiscan receipts.
            </p>
          </Link>
          <Link
            href="/leaderboard"
            className="group flex flex-col gap-2 rounded-xl border border-amber-500/40 bg-amber-50 p-6 transition-colors hover:border-amber-500/70 dark:border-amber-500/30 dark:bg-amber-500/10"
          >
            <span className="inline-flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-amber-700 dark:text-amber-300">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-amber-500" />
              Agent sell-side
            </span>
            <h2 className="text-lg font-semibold text-black dark:text-zinc-50">
              Who&apos;s hustling &rarr;
            </h2>
            <p className="text-sm leading-6 text-zinc-600 dark:text-zinc-400">
              Rank the hustlers. PYUSD earned, role mix, streaks. Standing is
              a reward.
            </p>
          </Link>
          <Link
            href="/evidence"
            className="group flex flex-col gap-2 rounded-xl border border-emerald-500/40 bg-emerald-50 p-6 transition-colors hover:border-emerald-500/70 dark:border-emerald-500/30 dark:bg-emerald-500/10"
          >
            <span className="inline-flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-emerald-700 dark:text-emerald-300">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" />
              Judges
            </span>
            <h2 className="text-lg font-semibold text-black dark:text-zinc-50">
              Public evidence &rarr;
            </h2>
            <p className="text-sm leading-6 text-zinc-600 dark:text-zinc-400">
              No login. Live stats. Every tx on Arbiscan. 60 s refresh.
            </p>
          </Link>
        </section>

        <section className="flex flex-col gap-3 rounded-xl border border-black/[.08] bg-white p-5 text-sm text-zinc-700 dark:border-white/[.12] dark:bg-zinc-950 dark:text-zinc-400">
          <p className="font-medium text-zinc-900 dark:text-zinc-100">
            Ship state &mdash; the submission is runnable right now.
          </p>
          <p>
            <code className="rounded bg-black/[.06] px-1 py-0.5 text-[0.9em] dark:bg-white/[.08]">
              pnpm preflight
            </code>{" "}
            runs typecheck · lint · build · unit tests · happy path ·
            7-gate adversarial table in under a minute. 66 unit tests, 7
            of 7 gates fire with a hash per branch. The Mandate Beacon
            compliance layer is byte-identical to the on-chain{" "}
            <code className="rounded bg-black/[.06] px-1 py-0.5 text-[0.9em] dark:bg-white/[.08]">
              MandateAnchor
            </code>{" "}
            leaf. 21 engineering scars documented at{" "}
            <code className="rounded bg-black/[.06] px-1 py-0.5 text-[0.9em] dark:bg-white/[.08]">
              docs/HARD_PARTS.md
            </code>
            , each with a file path or Arbiscan link.
          </p>
        </section>
      </main>
    </div>
  );
}
