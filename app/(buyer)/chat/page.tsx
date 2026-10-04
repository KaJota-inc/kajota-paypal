export default function BuyerChatPage() {
  return (
    <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 px-6 py-16 sm:px-10 sm:py-24">
      <header className="flex flex-col gap-2">
        <span className="text-xs font-medium uppercase tracking-wide text-zinc-500">
          Buyer surface · placeholder
        </span>
        <h1 className="text-3xl font-semibold tracking-tight text-black dark:text-zinc-50">
          Agent chat
        </h1>
        <p className="max-w-2xl text-base leading-7 text-zinc-600 dark:text-zinc-400">
          The buyer will prompt in natural language. The agent, running on the
          Vercel AI SDK with OpenAI as the model, will call Channel3 for
          discovery and assemble an AP2 Cart Mandate before launching PayPal
          checkout. First functional cut lands in Phase A day four.
        </p>
      </header>
      <section className="rounded-xl border border-dashed border-black/[.12] bg-white/60 p-5 text-sm text-zinc-700 dark:border-white/[.15] dark:bg-zinc-950/40 dark:text-zinc-400">
        <p className="font-medium text-zinc-900 dark:text-zinc-100">
          Next step
        </p>
        <p className="mt-2">
          Wire <code>/api/channel3/search</code> and the Vercel AI SDK chat
          endpoint. See{" "}
          <code className="rounded bg-black/[.06] px-1 py-0.5 text-[0.9em] dark:bg-white/[.08]">
            docs/planning/plan.md
          </code>{" "}
          §3 Phase A.
        </p>
      </section>
    </div>
  );
}
