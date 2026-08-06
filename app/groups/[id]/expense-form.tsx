"use client";

import { useState } from "react";
import type { SplitMode } from "@/lib/splits";

type Member = { id: string; name: string };

export interface ExpenseFormInitial {
  description: string;
  amount: string;
  paidById: string;
  mode: SplitMode;
  values: Record<string, string>;
}

export default function ExpenseForm({
  members,
  action,
  initial,
  submitLabel = "Add expense",
}: {
  members: Member[];
  action: (formData: FormData) => void;
  initial?: ExpenseFormInitial;
  submitLabel?: string;
}) {
  const [mode, setMode] = useState<SplitMode>(initial?.mode ?? "even");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [amount, setAmount] = useState(initial?.amount ?? "");
  const [paidById, setPaidById] = useState(initial?.paidById ?? "");
  const [values, setValues] = useState<Record<string, string>>(
    initial?.values ?? {},
  );

  const total = Number(amount) || 0;
  const entered = members.reduce((s, m) => s + (Number(values[m.id]) || 0), 0);

  let hint: { text: string; ok: boolean } | null = null;
  if (mode === "exact" && total > 0) {
    const diff = Math.round((total - entered) * 100) / 100;
    hint =
      Math.abs(diff) < 0.001
        ? { text: "Shares match the total.", ok: true }
        : {
            text:
              diff > 0
                ? `RM ${diff.toFixed(2)} left to assign.`
                : `RM ${Math.abs(diff).toFixed(2)} over the total.`,
            ok: false,
          };
  } else if (mode === "percent") {
    const diff = Math.round((100 - entered) * 100) / 100;
    hint =
      Math.abs(diff) < 0.001
        ? { text: "Percentages total 100%.", ok: true }
        : {
            text:
              diff > 0
                ? `${diff}% left to assign.`
                : `${Math.abs(diff)}% over 100%.`,
            ok: false,
          };
  }

  return (
    <form
      action={action}
      className="mt-3 space-y-3 rounded-xl border border-line bg-card p-4"
    >
      <input
        name="description"
        required
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder="What was it for? (e.g. Dinner)"
        className="w-full rounded-lg border border-line bg-paper px-3 py-2.5 text-sm outline-none focus:border-ink"
      />

      <div className="flex gap-3">
        <input
          name="amount"
          type="number"
          step="0.01"
          min="0.01"
          required
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="Amount"
          className="tnum w-32 rounded-lg border border-line bg-paper px-3 py-2.5 text-sm outline-none focus:border-ink"
        />
        <select
          name="paidById"
          required
          value={paidById}
          onChange={(e) => setPaidById(e.target.value)}
          className="flex-1 rounded-lg border border-line bg-paper px-3 py-2.5 text-sm outline-none focus:border-ink"
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
      </div>

      <input type="hidden" name="mode" value={mode} />
      <div className="flex gap-1 rounded-lg border border-line bg-paper p-1 text-sm">
        {(
          [
            ["even", "Even"],
            ["exact", "Exact"],
            ["percent", "Percent"],
          ] as [SplitMode, string][]
        ).map(([m, label]) => (
          <button
            key={m}
            type="button"
            onClick={() => setMode(m)}
            className={`flex-1 rounded-md px-3 py-1.5 transition ${
              mode === m ? "bg-ink text-paper" : "text-ink-soft hover:text-ink"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {mode !== "even" && (
        <div className="space-y-2 rounded-lg border border-line bg-paper p-3">
          {members.map((m) => (
            <div key={m.id} className="flex items-center justify-between gap-3">
              <span className="text-sm text-ink">{m.name}</span>
              <div className="flex items-center gap-1">
                {mode === "exact" && (
                  <span className="text-xs text-ink-soft">RM</span>
                )}
                <input
                  name={`value_${m.id}`}
                  type="number"
                  step="0.01"
                  min="0"
                  value={values[m.id] ?? ""}
                  onChange={(e) =>
                    setValues((v) => ({ ...v, [m.id]: e.target.value }))
                  }
                  placeholder="0"
                  className="tnum w-24 rounded-md border border-line bg-card px-2 py-1.5 text-right text-sm outline-none focus:border-ink"
                />
                {mode === "percent" && (
                  <span className="text-xs text-ink-soft">%</span>
                )}
              </div>
            </div>
          ))}
          {hint && (
            <p
              className="text-xs"
              style={{ color: hint.ok ? "var(--credit)" : "var(--owed)" }}
            >
              {hint.text}
            </p>
          )}
        </div>
      )}

      <button className="w-full rounded-lg bg-ink px-3 py-2.5 text-sm font-medium text-paper hover:opacity-90">
        {submitLabel}
      </button>
      <p className="text-xs text-ink-soft">
        {mode === "even"
          ? `Split evenly among all ${members.length} member${members.length === 1 ? "" : "s"}.`
          : mode === "exact"
            ? "Enter each person's exact share."
            : "Enter each person's percentage."}
      </p>
    </form>
  );
}