import Link from "next/link";
import { redirect } from "next/navigation";
import SiteHeader from "@/components/site-header";
import ExpenseForm, { type ExpenseFormInitial } from "../../../expense-form";
import { getExpense, updateExpense } from "../../../../actions";
import type { SplitMode } from "@/lib/splits";

export default async function EditExpensePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string; expenseId: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { id, expenseId } = await params;
  const { error } = await searchParams;

  let data;
  try {
    data = await getExpense(id, expenseId);
  } catch {
    redirect(`/groups/${id}`);
  }

  const { expense, splits, members } = data;

  // Infer the split mode from stored splits: if all equal, treat as "even",
  // otherwise present as "exact" with the stored amounts pre-filled.
  const amounts = splits.map((s) => s.amount);
  const allEqual =
    amounts.length > 0 &&
    amounts.every((a) => Math.abs(a - amounts[0]) < 0.01);
  const mode: SplitMode = allEqual ? "even" : "exact";

  const values: Record<string, string> = {};
  if (mode === "exact") {
    for (const s of splits) values[s.userId] = String(s.amount);
  }

  const initial: ExpenseFormInitial = {
    description: expense.description,
    amount: String(expense.amount),
    paidById: expense.paidById,
    mode,
    values,
  };

  const updateAction = updateExpense.bind(null, id, expenseId);

  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-2xl px-6 py-10">
        <Link
          href={`/groups/${id}`}
          className="text-sm text-ink-soft hover:text-ink"
        >
          ← Back to group
        </Link>
        <h1
          className="mt-4 text-3xl text-ink"
          style={{ fontFamily: "var(--font-fraunces)", fontWeight: 600 }}
        >
          Edit expense
        </h1>
        {error === "split" && (
          <p className="mt-3 rounded-lg bg-owed-soft px-3 py-2 text-sm text-owed">
            Those shares didn&apos;t add up to the total. Please try again.
          </p>
        )}
        <ExpenseForm
          members={members}
          action={updateAction}
          initial={initial}
          submitLabel="Save changes"
        />
      </main>
    </>
  );
}