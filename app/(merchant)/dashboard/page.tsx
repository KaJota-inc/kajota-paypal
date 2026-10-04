export default function MerchantDashboardPage() {
  return (
    <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 px-6 py-16 sm:px-10 sm:py-24">
      <header className="flex flex-col gap-2">
        <span className="text-xs font-medium uppercase tracking-wide text-zinc-500">
          Merchant surface · placeholder
        </span>
        <h1 className="text-3xl font-semibold tracking-tight text-black dark:text-zinc-50">
          Settlement dashboard
        </h1>
        <p className="max-w-2xl text-base leading-7 text-zinc-600 dark:text-zinc-400">
          Every PayPal order and its Mesh fan-out. The live table will render
          through AG Grid with columns for order id, Mandate hash, listing id,
          recipients, shares and the on-chain receipts. Phase A day five lands
          the first row.
        </p>
      </header>
      <section className="rounded-xl border border-dashed border-black/[.12] bg-white/60 p-5 text-sm text-zinc-700 dark:border-white/[.15] dark:bg-zinc-950/40 dark:text-zinc-400">
        <p className="font-medium text-zinc-900 dark:text-zinc-100">
          Next step
        </p>
        <p className="mt-2">
          Wire the PayPal webhook listener to append a row per confirmed order,
          then subscribe the row to the <code>Released</code> event emitted by
          <code> CosellEscrowV2</code>. See{" "}
          <code className="rounded bg-black/[.06] px-1 py-0.5 text-[0.9em] dark:bg-white/[.08]">
            docs/WEBHOOK.md
          </code>
          .
        </p>
      </section>
    </div>
  );
}
