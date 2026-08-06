"use client";

import { useState } from "react";

type Member = { id: string; name: string };

export default function SettleForm({
  members,
  action,
}: {
  members: Member[];
  action: (formData: FormData) => void;
}) {
  const [open, setOpen] = useState(false);

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="mt-3 text-sm font-medium text-ink underline hover:opacity-80"
      >
        Record a payment
      </button>
    );
  }

  return (
    <form
      action={action}
      className="mt-3 space-y-3 rounded-xl border border-line bg-card p-4"
    >
      <div className="flex flex-wrap items-center gap-2 text-sm">
        <select
          name="fromId"
          required
          defaultValue=""
          className="rounded-lg border border-line bg-paper px-3 py-2 outline-none focus:border-ink"
        >
          <option value="" disabled>
            Who paid
          </option>
          {members.map((m) => (
            <option key={m.id} value={m.id}>
              {m.name}
            </option>
          ))}
        </select>
        <span className="text-ink-soft">paid</span>
        <select
          name="toId"
          required
          defaultValue=""
          className="rounded-lg border border-line bg-paper px-3 py-2 outline-none focus:border-ink"
        >
          <option value="" disabled>
            Who received
          </option>
          {members.map((m) => (
            <option key={m.id} value={m.id}>
              {m.name}
            </option>
          ))}
        </select>
        <span className="text-ink-soft">RM</span>
        <input
          name="amount"
          type="number"
          step="0.01"
          min="0.01"
          required
          placeholder="0.00"
          className="tnum w-24 rounded-lg border border-line bg-paper px-3 py-2 text-right outline-none focus:border-ink"
        />
      </div>
      <div className="flex gap-2">
        <button className="rounded-lg bg-ink px-4 py-2 text-sm font-medium text-paper hover:opacity-90">
          Save payment
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="rounded-lg border border-line px-4 py-2 text-sm text-ink-soft hover:text-ink"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}