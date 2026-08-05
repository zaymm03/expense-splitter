import Link from "next/link";
import SiteHeader from "@/components/site-header";

export default function Home() {
  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-2xl px-6">
        <section className="rise py-20 text-center">
          <p className="text-sm font-medium uppercase tracking-widest text-ink-soft">
            Shared expenses, squared away
          </p>
          <h1
            className="mt-4 text-5xl leading-tight text-ink sm:text-6xl"
            style={{ fontFamily: "var(--font-fraunces)", fontWeight: 600 }}
          >
            Split the bill.
            <br />
            Skip the math.
          </h1>
          <p className="mx-auto mt-6 max-w-md text-lg text-ink-soft">
            Track who paid for what on your next trip or shared house, and let
            Settle work out the fewest payments to make everyone even.
          </p>
          <div className="mt-8 flex justify-center gap-3">
            <Link
              href="/signup"
              className="rounded-lg bg-ink px-6 py-3 font-medium text-paper hover:opacity-90"
            >
              Start splitting
            </Link>
            <Link
              href="/login"
              className="rounded-lg border border-line px-6 py-3 font-medium text-ink hover:bg-card"
            >
              Log in
            </Link>
          </div>
        </section>

        <section className="grid gap-4 pb-20 sm:grid-cols-3">
          {[
            { t: "Add expenses", d: "Log who paid and split it evenly across the group." },
            { t: "See balances", d: "Know instantly who's up and who's down." },
            { t: "Settle up", d: "Get the minimal set of payments to clear all debts." },
          ].map((f, i) => (
            <div
              key={i}
              className="rounded-xl border border-line bg-card p-5"
            >
              <div className="text-sm font-semibold text-ink">{f.t}</div>
              <p className="mt-1 text-sm text-ink-soft">{f.d}</p>
            </div>
          ))}
        </section>
      </main>
    </>
  );
}