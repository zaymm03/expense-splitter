import Link from "next/link";
import { redirect } from "next/navigation";
import { getGroupDetail, addMember, addExpense, getSettlement } from "../actions";

export default async function GroupDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  let data;
  try {
    data = await getGroupDetail(id);
  } catch {
    redirect("/groups");
  }

  const { group, members, expenses } = data;
  const settlement = await getSettlement(id);

  // Bind the groupId into the server actions.
  const addMemberAction = addMember.bind(null, id);
  const addExpenseAction = addExpense.bind(null, id);

  return (
    <main className="mx-auto max-w-2xl p-6">
      <Link href="/groups" className="text-sm text-gray-500 hover:underline">
        ← Back to groups
      </Link>
      <h1 className="mt-4 text-2xl font-bold">{group.name}</h1>

      {/* Members */}
      <section className="mt-8">
        <h2 className="text-lg font-semibold">Members ({members.length})</h2>
        <ul className="mt-2 space-y-1 text-sm">
          {members.map((m) => (
            <li key={m.id} className="text-gray-700">
              {m.name}{" "}
              <span className="text-gray-400">({m.email})</span>
            </li>
          ))}
        </ul>

        <form action={addMemberAction} className="mt-3 flex gap-2">
          <input
            name="email"
            type="email"
            required
            placeholder="Add member by email"
            className="flex-1 rounded-md border px-3 py-2 text-sm"
          />
          <button className="rounded-md border px-3 py-2 text-sm hover:bg-gray-50">
            Add
          </button>
        </form>
        <p className="mt-1 text-xs text-gray-400">
          The person must already have an account.
        </p>
      </section>

      {/* Add expense */}
      <section className="mt-8">
        <h2 className="text-lg font-semibold">Add an expense</h2>
        <form action={addExpenseAction} className="mt-3 space-y-3">
          <input
            name="description"
            required
            placeholder="Description (e.g. Dinner)"
            className="w-full rounded-md border px-3 py-2 text-sm"
          />
          <input
            name="amount"
            type="number"
            step="0.01"
            min="0.01"
            required
            placeholder="Amount"
            className="w-full rounded-md border px-3 py-2 text-sm"
          />
          <select
            name="paidById"
            required
            defaultValue=""
            className="w-full rounded-md border px-3 py-2 text-sm"
          >
            <option value="" disabled>
              Who paid?
            </option>
            {members.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
          </select>
          <button className="w-full rounded-md bg-black px-3 py-2 text-sm text-white">
            Add expense
          </button>
        </form>
        <p className="mt-1 text-xs text-gray-400">
          Split evenly among all {members.length} member
          {members.length === 1 ? "" : "s"}.
        </p>
      </section>

      {/* Settle up */}
      <section className="mt-8">
        <h2 className="text-lg font-semibold">Settle up</h2>
        {settlement.length === 0 ? (
          <p className="mt-2 text-sm text-gray-400">
            All settled — nobody owes anything.
          </p>
        ) : (
          <ul className="mt-2 space-y-2">
            {settlement.map((t, i) => (
              <li
                key={i}
                className="flex items-center justify-between rounded-md bg-gray-50 px-4 py-3 text-sm"
              >
                <span>
                  <span className="font-medium">{t.from}</span> pays{" "}
                  <span className="font-medium">{t.to}</span>
                </span>
                <span className="font-semibold">${t.amount.toFixed(2)}</span>
              </li>
            ))}
          </ul>
        )}
        <p className="mt-2 text-xs text-gray-400">
          Minimal set of payments to settle all debts.
        </p>
      </section>

      {/* Expense list */}
      <section className="mt-8">
        <h2 className="text-lg font-semibold">Expenses</h2>
        {expenses.length === 0 ? (
          <p className="mt-2 text-sm text-gray-400">No expenses yet.</p>
        ) : (
          <ul className="mt-2 divide-y">
            {expenses.map((e) => (
              <li key={e.id} className="flex justify-between py-3 text-sm">
                <div>
                  <span className="font-medium">{e.description}</span>
                  <span className="ml-2 text-gray-400">
                    paid by {e.paidByName}
                  </span>
                </div>
                <span className="font-medium">${e.amount.toFixed(2)}</span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}