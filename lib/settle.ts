/**
 * Debt simplification.
 *
 * Given every expense in a group (who paid, and how it splits), we compute
 * each person's NET balance, then produce the minimal set of transactions
 * that settles everyone up.
 *
 * Net balance = (total this person paid) - (total this person owes).
 *   positive => they are owed money   (creditor)
 *   negative => they owe money         (debtor)
 *
 * Algorithm (greedy): repeatedly match the person owed the most against the
 * person who owes the most, transfer min(|debt|, credit), and repeat until
 * everyone nets to ~0. This yields at most N-1 transactions for N people.
 *
 * Complexity: O(T) to build balances (T = number of splits), then the settle
 * loop runs at most N-1 times; each iteration is O(N) with a linear scan
 * (or O(log N) with a heap). Plenty fast for group sizes.
 */

export interface ExpenseInput {
  paidById: string;
  splits: { userId: string; amount: number }[];
}

export interface Transaction {
  from: string; // debtor
  to: string; // creditor
  amount: number;
}

const CENTS = 100;
const round = (n: number) => Math.round(n * CENTS) / CENTS;

/** Compute net balance per user from a list of expenses. */
export function computeBalances(
  expenses: ExpenseInput[],
): Map<string, number> {
  const balances = new Map<string, number>();
  const add = (id: string, delta: number) =>
    balances.set(id, (balances.get(id) ?? 0) + delta);

  for (const exp of expenses) {
    const total = exp.splits.reduce((s, x) => s + x.amount, 0);
    add(exp.paidById, total); // payer fronted the whole amount
    for (const split of exp.splits) {
      add(split.userId, -split.amount); // each person owes their share
    }
  }

  for (const [id, bal] of balances) balances.set(id, round(bal));
  return balances;
}

/** Turn net balances into a minimal list of settle-up transactions. */
export function settle(balances: Map<string, number>): Transaction[] {
  const creditors: { id: string; amount: number }[] = [];
  const debtors: { id: string; amount: number }[] = [];

  for (const [id, bal] of balances) {
    if (bal > 0.001) creditors.push({ id, amount: bal });
    else if (bal < -0.001) debtors.push({ id, amount: -bal });
  }

  // Largest first so we clear big imbalances in fewer steps.
  creditors.sort((a, b) => b.amount - a.amount);
  debtors.sort((a, b) => b.amount - a.amount);

  const txns: Transaction[] = [];
  let i = 0;
  let j = 0;

  while (i < debtors.length && j < creditors.length) {
    const debtor = debtors[i];
    const creditor = creditors[j];
    const amount = round(Math.min(debtor.amount, creditor.amount));

    if (amount > 0) {
      txns.push({ from: debtor.id, to: creditor.id, amount });
    }

    debtor.amount = round(debtor.amount - amount);
    creditor.amount = round(creditor.amount - amount);

    if (debtor.amount <= 0.001) i++;
    if (creditor.amount <= 0.001) j++;
  }

  return txns;
}

/** Convenience: expenses -> settle-up transactions in one call. */
export function simplifyDebts(expenses: ExpenseInput[]): Transaction[] {
  return settle(computeBalances(expenses));
}
