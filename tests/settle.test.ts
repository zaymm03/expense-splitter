import { describe, it, expect } from "vitest";
import {
  computeBalances,
  settle,
  simplifyDebts,
  type ExpenseInput,
} from "../lib/settle";

function netFromTxns(txns: { from: string; to: string; amount: number }[]) {
  const net = new Map<string, number>();
  for (const t of txns) {
    net.set(t.from, (net.get(t.from) ?? 0) - t.amount);
    net.set(t.to, (net.get(t.to) ?? 0) + t.amount);
  }
  return net;
}

describe("computeBalances", () => {
  it("credits the payer and debits each participant's share", () => {
    const expenses: ExpenseInput[] = [
      {
        paidById: "alice",
        splits: [
          { userId: "alice", amount: 10 },
          { userId: "bob", amount: 10 },
          { userId: "carol", amount: 10 },
        ],
      },
    ];
    const balances = computeBalances(expenses);
    expect(balances.get("alice")).toBeCloseTo(20);
    expect(balances.get("bob")).toBeCloseTo(-10);
    expect(balances.get("carol")).toBeCloseTo(-10);
  });

  it("balances always sum to zero", () => {
    const expenses: ExpenseInput[] = [
      {
        paidById: "bob",
        splits: [
          { userId: "alice", amount: 15 },
          { userId: "bob", amount: 15 },
        ],
      },
      {
        paidById: "carol",
        splits: [
          { userId: "carol", amount: 9 },
          { userId: "alice", amount: 9 },
          { userId: "bob", amount: 9 },
        ],
      },
    ];
    const total = [...computeBalances(expenses).values()].reduce(
      (s, x) => s + x,
      0,
    );
    expect(total).toBeCloseTo(0);
  });
});

describe("settle", () => {
  it("produces transactions that zero everyone out", () => {
    const balances = new Map([
      ["alice", 20],
      ["bob", -10],
      ["carol", -10],
    ]);
    const txns = settle(balances);
    const net = netFromTxns(txns);
    expect(net.get("alice")).toBeCloseTo(20);
    expect(net.get("bob")).toBeCloseTo(-10);
    expect(net.get("carol")).toBeCloseTo(-10);
  });

  it("simplifies a chain A->B->C into fewer transactions", () => {
    const balances = new Map([
      ["alice", -10],
      ["bob", 0],
      ["carol", 10],
    ]);
    const txns = settle(balances);
    expect(txns).toHaveLength(1);
    expect(txns[0]).toEqual({ from: "alice", to: "carol", amount: 10 });
  });

  it("never emits more than N-1 transactions", () => {
    const balances = new Map([
      ["a", -5],
      ["b", -5],
      ["c", -5],
      ["d", 15],
    ]);
    const txns = settle(balances);
    expect(txns.length).toBeLessThanOrEqual(3);
    const net = netFromTxns(txns);
    expect(net.get("d")).toBeCloseTo(15);
  });

  it("returns nothing when everyone is settled", () => {
    expect(settle(new Map([["a", 0], ["b", 0]]))).toHaveLength(0);
  });
});

describe("simplifyDebts (end to end)", () => {
  it("handles a realistic multi-expense group", () => {
    const expenses: ExpenseInput[] = [
      {
        paidById: "alice",
        splits: [
          { userId: "alice", amount: 20 },
          { userId: "bob", amount: 20 },
          { userId: "carol", amount: 20 },
        ],
      },
      {
        paidById: "bob",
        splits: [
          { userId: "alice", amount: 15 },
          { userId: "bob", amount: 15 },
        ],
      },
    ];
    const txns = simplifyDebts(expenses);
    const net = netFromTxns(txns);
    const balances = computeBalances(expenses);
    for (const [id, bal] of balances) {
      if (Math.abs(bal) > 0.001) {
        expect(net.get(id)).toBeCloseTo(bal);
      }
    }
  });
});