/**
 * Split computation for the three expense-split modes.
 *
 * Every mode returns per-person amounts (in the expense's currency) that are
 * guaranteed to sum EXACTLY to the total — no lost or extra pennies. Rounding
 * remainders are distributed one cent at a time across the first participants.
 */

export type SplitMode = "even" | "exact" | "percent";

export interface SplitParticipant {
  userId: string;
  /** For "exact": the person's amount. For "percent": their percentage. Ignored for "even". */
  value?: number;
}

export interface SplitResult {
  userId: string;
  amount: number;
}

const round2 = (n: number) => Math.round(n * 100) / 100;

/** Split `total` evenly across participants, distributing any remainder. */
export function splitEven(total: number, userIds: string[]): SplitResult[] {
  const n = userIds.length;
  if (n === 0) return [];
  const base = Math.floor((total / n) * 100) / 100;
  const shares = userIds.map(() => base);
  let remainder = round2(total - base * n);
  for (let i = 0; remainder > 0.0001 && i < n; i++) {
    shares[i] = round2(shares[i] + 0.01);
    remainder = round2(remainder - 0.01);
  }
  return userIds.map((userId, i) => ({ userId, amount: shares[i] }));
}

/**
 * Compute a split for any mode. Returns { ok, result?, error? }.
 * Validates that exact amounts sum to the total and percentages sum to 100.
 */
export function computeSplit(
  mode: SplitMode,
  total: number,
  participants: SplitParticipant[],
): { ok: true; result: SplitResult[] } | { ok: false; error: string } {
  if (total <= 0) return { ok: false, error: "Amount must be greater than zero." };
  if (participants.length === 0)
    return { ok: false, error: "At least one participant is required." };

  if (mode === "even") {
    return { ok: true, result: splitEven(total, participants.map((p) => p.userId)) };
  }

  if (mode === "exact") {
    const sum = round2(participants.reduce((s, p) => s + (p.value ?? 0), 0));
    if (Math.abs(sum - round2(total)) > 0.001) {
      return {
        ok: false,
        error: `Shares add up to ${sum.toFixed(2)}, but the total is ${round2(total).toFixed(2)}.`,
      };
    }
    return {
      ok: true,
      result: participants.map((p) => ({ userId: p.userId, amount: round2(p.value ?? 0) })),
    };
  }

  // percent
  const pctSum = round2(participants.reduce((s, p) => s + (p.value ?? 0), 0));
  if (Math.abs(pctSum - 100) > 0.001) {
    return {
      ok: false,
      error: `Percentages add up to ${pctSum}%, but they must total 100%.`,
    };
  }
  // Convert percentages to amounts, then fix rounding so they sum to total.
  const amounts = participants.map((p) => round2((total * (p.value ?? 0)) / 100));
  let diff = round2(total - amounts.reduce((s, a) => s + a, 0));
  for (let i = 0; Math.abs(diff) > 0.0001 && i < amounts.length; i++) {
    const step = diff > 0 ? 0.01 : -0.01;
    amounts[i] = round2(amounts[i] + step);
    diff = round2(diff - step);
  }
  return {
    ok: true,
    result: participants.map((p, i) => ({ userId: p.userId, amount: amounts[i] })),
  };
}