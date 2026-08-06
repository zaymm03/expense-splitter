import { describe, it, expect } from "vitest";
import { computeSplit, splitEven } from "../lib/splits";

const sum = (rows: { amount: number }[]) =>
  Math.round(rows.reduce((s, r) => s + r.amount, 0) * 100) / 100;

describe("splitEven", () => {
  it("splits evenly when divisible", () => {
    const r = splitEven(30, ["a", "b", "c"]);
    expect(r.map((x) => x.amount)).toEqual([10, 10, 10]);
  });

  it("distributes remainder so it sums exactly", () => {
    const r = splitEven(10, ["a", "b", "c"]);
    expect(sum(r)).toBe(10);
    expect(r.map((x) => x.amount)).toEqual([3.34, 3.33, 3.33]);
  });
});

describe("computeSplit — even", () => {
  it("returns an even split", () => {
    const res = computeSplit("even", 20, [{ userId: "a" }, { userId: "b" }]);
    expect(res.ok).toBe(true);
    if (res.ok) expect(sum(res.result)).toBe(20);
  });
});

describe("computeSplit — exact", () => {
  it("accepts exact amounts that sum to total", () => {
    const res = computeSplit("exact", 50, [
      { userId: "a", value: 20 },
      { userId: "b", value: 30 },
    ]);
    expect(res.ok).toBe(true);
    if (res.ok) expect(sum(res.result)).toBe(50);
  });

  it("rejects amounts that don't sum to total", () => {
    const res = computeSplit("exact", 50, [
      { userId: "a", value: 20 },
      { userId: "b", value: 20 },
    ]);
    expect(res.ok).toBe(false);
  });
});

describe("computeSplit — percent", () => {
  it("accepts percentages summing to 100 and converts to amounts", () => {
    const res = computeSplit("percent", 100, [
      { userId: "a", value: 25 },
      { userId: "b", value: 75 },
    ]);
    expect(res.ok).toBe(true);
    if (res.ok) {
      expect(sum(res.result)).toBe(100);
      expect(res.result[0].amount).toBe(25);
      expect(res.result[1].amount).toBe(75);
    }
  });

  it("handles percentages that cause rounding (33/33/34)", () => {
    const res = computeSplit("percent", 100, [
      { userId: "a", value: 33.33 },
      { userId: "b", value: 33.33 },
      { userId: "c", value: 33.34 },
    ]);
    expect(res.ok).toBe(true);
    if (res.ok) expect(sum(res.result)).toBe(100);
  });

  it("rejects percentages that don't total 100", () => {
    const res = computeSplit("percent", 100, [
      { userId: "a", value: 40 },
      { userId: "b", value: 40 },
    ]);
    expect(res.ok).toBe(false);
  });
});

describe("computeSplit — guards", () => {
  it("rejects zero total", () => {
    expect(computeSplit("even", 0, [{ userId: "a" }]).ok).toBe(false);
  });
  it("rejects empty participants", () => {
    expect(computeSplit("even", 10, []).ok).toBe(false);
  });
});