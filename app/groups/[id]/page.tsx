import Link from "next/link";
import { redirect } from "next/navigation";
import SiteHeader from "@/components/site-header";
import ExpenseForm from "./expense-form";
import {
  getGroupDetail,
  addMember,
  addExpense,
  getSettlement,
  getBalances,
} from "../actions";

export default async function GroupDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { id } = await params;
  const { error } = await searchParams;

  let data;
  try {
    data = await getGroupDetail(id);
  } catch {
    redirect("/groups");
  }

  const { group, members, expenses } = data;
  const [settlement, balances] = await Promise.all([
    getSettlement(id),
    getBalances(id),
  ]);

  const addMemberAction = addMember.bind(null, id);
  const addExpenseAction = addExpense.bind(null, id);

  const totalSpent = expenses.reduce((s, e) => s + e.amount, 0);

  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-2xl px-6 py-10">
        <Link href="/groups" className="text-sm text-ink-soft hover:text-ink">
          ← Back to groups
        </Link>

        <div className="mt-4 flex items-end justify-between">
          <h1
            className="text-3xl text-ink"
            style={{ fontFamily: "var(--font-fraunces)", fontWeight: 600 }}
          >
            {group.name}
          </h1>
          <span className="text-sm text-ink-soft">
            <span className="tnum">RM {totalSpent.toFixed(2)}</span> total
          </span>
        </div>

        {/* Balance strip — the signature element */}
        <section className="rise mt-6">
          <div className="grid gap-3 sm:grid-cols-2">
            {balances.map((b) => {
              const up = b.balance > 0.001;
              const down = b.balance < -0.001;
              return (
                <div
                  key={b.id}
                  className="flex items-center justify-between rounded-xl border border-line bg-card px-4 py-3"
                >
                  <span className="font-medium text-ink">{b.name}</span>
                  <span
                    className="tnum text-sm font-semibold"
                    style={{
                      color: up
                        ? "var(--credit)"
                        : down
                          ? "var(--owed)"
                          : "var(--ink-soft)",
                    }}
                  >
                    {up && "gets back "}
                    {down && "owes "}
                    {up || down
                      ? `RM ${Math.abs(b.balance).toFixed(2)}`
                      : "settled"}
                  </span>
                </div>
              );
            })}
          </div>
        </section>

        {/* Settle up */}
        <section className="mt-8">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-ink-soft">
            Settle up
          </h2>
          {settlement.length === 0 ? (
            <p className="mt-3 rounded-xl border border-line bg-card px-4 py-4 text-sm text-ink-soft">
              Everyone&apos;s square — no payments needed.
            </p>
          ) : (
            <ul className="mt-3 space-y-2">
              {settlement.map((t, i) => (
                <li
                  key={i}
                  className="flex items-center justify-between rounded-xl border border-owed/20 bg-owed-soft px-4 py-3 text-sm"
                >
                  <span className="text-ink">
                    <span className="font-semibold">{t.from}</span> pays{" "}
                    <span className="font-semibold">{t.to}</span>
                  </span>
                  <span className="tnum font-semibold text-owed">
                    RM {t.amount.toFixed(2)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Add expense */}
        <section className="mt-8">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-ink-soft">
            Add an expense
          </h2>
          {error === "split" && (
            <p className="mt-3 rounded-lg bg-owed-soft px-3 py-2 text-sm text-owed">
              Those shares didn&apos;t add up to the total. Please try again.
            </p>
          )}
          <ExpenseForm members={members} action={addExpenseAction} />
        </section>

        {/* Expense list */}
        <section className="mt-8">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-ink-soft">
            Expenses
          </h2>
          {expenses.length === 0 ? (
            <p className="mt-3 text-sm text-ink-soft">
              No expenses yet. Add your first one above.
            </p>
          ) : (
            <ul className="mt-3 divide-y divide-line rounded-xl border border-line bg-card">
              {expenses.map((e) => (
                <li
                  key={e.id}
                  className="flex items-center justify-between px-4 py-3 text-sm"
                >
                  <div>
                    <span className="font-medium text-ink">
                      {e.description}
                    </span>
                    <span className="ml-2 text-ink-soft">
                      paid by {e.paidByName}
                    </span>
                  </div>
                  <span className="tnum font-medium text-ink">
                    RM {e.amount.toFixed(2)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Members */}
        <section className="mt-8">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-ink-soft">
            Members ({members.length})
          </h2>
          <ul className="mt-3 flex flex-wrap gap-2">
            {members.map((m) => (
              <li
                key={m.id}
                className="rounded-full border border-line bg-card px-3 py-1 text-sm text-ink"
              >
                {m.name}
              </li>
            ))}
          </ul>
          <form action={addMemberAction} className="mt-3 flex gap-2">
            <input
              name="email"
              type="email"
              required
              placeholder="Add member by email"
              className="flex-1 rounded-lg border border-line bg-card px-3 py-2.5 text-sm outline-none focus:border-ink"
            />
            <button className="rounded-lg border border-line px-4 py-2.5 text-sm text-ink hover:bg-card">
              Add
            </button>
          </form>
          <p className="mt-1 text-xs text-ink-soft">
            They&apos;ll need to sign up first with that email.
          </p>
        </section>
      </main>
    </>
  );
}