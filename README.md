# 💸 Expense Splitter

Split shared expenses with friends and settle up in the fewest possible payments.

**[🔗 Live Demo](https://expense-splitter-virid.vercel.app)**

---

## What it does

Track who paid for what in a group, and the app computes the **minimal set of
transactions** needed to settle everyone up. If Alice owes Bob and Bob owes
Carol, you don't need two payments — the app collapses it into one.

## Tech stack

| Layer     | Choice                   | Why                                          |
| --------- | ------------------------ | -------------------------------------------- |
| Framework | Next.js 15 (App Router)  | Modern React, server components, easy deploy |
| Language  | TypeScript               | Type safety across the whole stack           |
| Database  | Turso (libSQL / SQLite)  | Free tier, edge-replicated, zero cold starts |
| ORM       | Drizzle                  | Type-safe queries, lightweight migrations    |
| Auth      | Better Auth              | Email/password auth without vendor lock-in   |
| UI        | Tailwind CSS + shadcn/ui | Fast, clean, accessible components           |
| Hosting   | Vercel                   | Free tier, git-push deploys                  |
| Testing   | Vitest                   | Fast unit tests for the settle algorithm     |

## Architecture

Expenses are stored with a payer and a set of **splits** (each member's share).
Balances are never stored — they're derived: for each expense the payer is
credited the full amount and each participant is debited their share. The
settle-up algorithm then converts net balances into payments.

## The settle-up algorithm

Located in `lib/settle.ts`. Greedy debt simplification:

1. Compute each person's **net balance** (paid - owed).
2. Split into creditors (owed money) and debtors (owe money).
3. Repeatedly match the largest debtor against the largest creditor, settle the
   smaller of the two, and repeat.

This guarantees **at most N-1 transactions** for N people. Fully unit-tested.

**Complexity:** O(T) to build balances (T = number of splits); the settle loop
runs at most N-1 times.

## Data model

- **users** — accounts
- **groups** — a shared-expense group (has an owner)
- **group_members** — many-to-many users <-> groups
- **expenses** — a charge (description, amount, who paid)
- **expense_splits** — how each expense divides among members

## Running locally

```bash
npm install
cp .env.example .env      # fill in Turso + Better Auth values
npm run db:push           # create tables in Turso
npm run dev
```

## Testing

```bash
npm test                  # runs the settle-algorithm suite
```

## License

MIT