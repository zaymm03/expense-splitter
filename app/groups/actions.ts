"use server";

import { auth } from "@/lib/auth";
import { db } from "@/db";
import { groups, groupMembers, expenses, expenseSplits, settlements, user } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { simplifyDebts, computeBalances, settle as settleFromBalances, type ExpenseInput } from "@/lib/settle";
import { computeSplit, type SplitMode } from "@/lib/splits";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

async function requireUser() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/login");
  return session.user;
}

async function assertMember(groupId: string, userId: string) {
  const rows = await db
    .select({ id: groupMembers.id })
    .from(groupMembers)
    .where(
      and(eq(groupMembers.groupId, groupId), eq(groupMembers.userId, userId)),
    )
    .limit(1);
  if (rows.length === 0) throw new Error("Not a member of this group.");
}

/**
 * Apply recorded settlements to a raw balances map.
 * A payment from X to Y means X has paid down debt: X's net rises, Y's falls.
 */
function applySettlements(
  balances: Map<string, number>,
  paid: { fromId: string; toId: string; amount: number }[],
) {
  for (const s of paid) {
    balances.set(s.fromId, (balances.get(s.fromId) ?? 0) + s.amount);
    balances.set(s.toId, (balances.get(s.toId) ?? 0) - s.amount);
  }
  for (const [k, v] of balances) balances.set(k, Math.round(v * 100) / 100);
  return balances;
}

export async function createGroup(formData: FormData): Promise<void> {
  const currentUser = await requireUser();
  const name = String(formData.get("name") ?? "").trim();
  if (!name) redirect("/groups/new");

  const [group] = await db
    .insert(groups)
    .values({ name, ownerId: currentUser.id })
    .returning();

  await db.insert(groupMembers).values({
    groupId: group.id,
    userId: currentUser.id,
  });

  revalidatePath("/groups");
  redirect("/groups");
}

export async function getMyGroups() {
  const currentUser = await requireUser();
  return db
    .select({
      id: groups.id,
      name: groups.name,
      createdAt: groups.createdAt,
      ownerId: groups.ownerId,
    })
    .from(groupMembers)
    .innerJoin(groups, eq(groupMembers.groupId, groups.id))
    .where(eq(groupMembers.userId, currentUser.id));
}

export async function getGroupDetail(groupId: string) {
  const currentUser = await requireUser();
  await assertMember(groupId, currentUser.id);

  const [group] = await db.select().from(groups).where(eq(groups.id, groupId));

  const members = await db
    .select({ id: user.id, name: user.name, email: user.email })
    .from(groupMembers)
    .innerJoin(user, eq(groupMembers.userId, user.id))
    .where(eq(groupMembers.groupId, groupId));

  const expenseRows = await db
    .select({
      id: expenses.id,
      description: expenses.description,
      amount: expenses.amount,
      paidById: expenses.paidById,
      paidByName: user.name,
      createdAt: expenses.createdAt,
    })
    .from(expenses)
    .innerJoin(user, eq(expenses.paidById, user.id))
    .where(eq(expenses.groupId, groupId));

  return { group, members, expenses: expenseRows };
}

export async function addMember(groupId: string, formData: FormData): Promise<void> {
  const currentUser = await requireUser();
  await assertMember(groupId, currentUser.id);

  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  if (!email) redirect(`/groups/${groupId}`);

  const [target] = await db.select().from(user).where(eq(user.email, email)).limit(1);
  if (!target) {
    redirect(`/groups/${groupId}?error=nouser`);
  }

  const existing = await db
    .select({ id: groupMembers.id })
    .from(groupMembers)
    .where(
      and(eq(groupMembers.groupId, groupId), eq(groupMembers.userId, target.id)),
    )
    .limit(1);

  if (existing.length === 0) {
    await db.insert(groupMembers).values({ groupId, userId: target.id });
  }

  revalidatePath(`/groups/${groupId}`);
  redirect(`/groups/${groupId}`);
}

export async function addExpense(groupId: string, formData: FormData): Promise<void> {
  const currentUser = await requireUser();
  await assertMember(groupId, currentUser.id);

  const description = String(formData.get("description") ?? "").trim();
  const amount = Number(formData.get("amount"));
  const paidById = String(formData.get("paidById") ?? "").trim();
  const mode = (String(formData.get("mode") ?? "even") as SplitMode);

  if (!description || !amount || amount <= 0 || !paidById) {
    redirect(`/groups/${groupId}`);
  }

  const members = await db
    .select({ userId: groupMembers.userId })
    .from(groupMembers)
    .where(eq(groupMembers.groupId, groupId));

  if (members.length === 0) redirect(`/groups/${groupId}`);

  const participants = members.map((m) => ({
    userId: m.userId,
    value:
      mode === "even"
        ? undefined
        : Number(formData.get(`value_${m.userId}`) ?? 0),
  }));

  const split = computeSplit(mode, amount, participants);
  if (!split.ok) {
    redirect(`/groups/${groupId}?error=split`);
  }

  const [expense] = await db
    .insert(expenses)
    .values({ groupId, description, amount, paidById })
    .returning();

  await db.insert(expenseSplits).values(
    split.result.map((s) => ({
      expenseId: expense.id,
      userId: s.userId,
      amount: s.amount,
    })),
  );

  revalidatePath(`/groups/${groupId}`);
  redirect(`/groups/${groupId}`);
}

export async function getSettlement(groupId: string) {
  const currentUser = await requireUser();
  await assertMember(groupId, currentUser.id);

  const groupExpenses = await db
    .select({ id: expenses.id, paidById: expenses.paidById })
    .from(expenses)
    .where(eq(expenses.groupId, groupId));

  const allSplits = await db
    .select({
      expenseId: expenseSplits.expenseId,
      userId: expenseSplits.userId,
      amount: expenseSplits.amount,
    })
    .from(expenseSplits)
    .innerJoin(expenses, eq(expenseSplits.expenseId, expenses.id))
    .where(eq(expenses.groupId, groupId));

  const splitsByExpense = new Map<string, { userId: string; amount: number }[]>();
  for (const s of allSplits) {
    const list = splitsByExpense.get(s.expenseId) ?? [];
    list.push({ userId: s.userId, amount: s.amount });
    splitsByExpense.set(s.expenseId, list);
  }

  const input: ExpenseInput[] = groupExpenses.map((e) => ({
    paidById: e.paidById,
    splits: splitsByExpense.get(e.id) ?? [],
  }));

  const paid = await db
    .select({ fromId: settlements.fromId, toId: settlements.toId, amount: settlements.amount })
    .from(settlements)
    .where(eq(settlements.groupId, groupId));

  const balancesForSettle = applySettlements(computeBalances(input), paid);
  const transactions = settleFromBalances(balancesForSettle);

  const names = new Map(
    (
      await db
        .select({ id: user.id, name: user.name })
        .from(groupMembers)
        .innerJoin(user, eq(groupMembers.userId, user.id))
        .where(eq(groupMembers.groupId, groupId))
    ).map((r) => [r.id, r.name]),
  );

  return transactions.map((t) => ({
    from: names.get(t.from) ?? "Unknown",
    to: names.get(t.to) ?? "Unknown",
    amount: t.amount,
  }));
}

export async function getBalances(groupId: string) {
  const currentUser = await requireUser();
  await assertMember(groupId, currentUser.id);

  const groupExpenses = await db
    .select({ id: expenses.id, paidById: expenses.paidById })
    .from(expenses)
    .where(eq(expenses.groupId, groupId));

  const allSplits = await db
    .select({
      expenseId: expenseSplits.expenseId,
      userId: expenseSplits.userId,
      amount: expenseSplits.amount,
    })
    .from(expenseSplits)
    .innerJoin(expenses, eq(expenseSplits.expenseId, expenses.id))
    .where(eq(expenses.groupId, groupId));

  const splitsByExpense = new Map<string, { userId: string; amount: number }[]>();
  for (const s of allSplits) {
    const list = splitsByExpense.get(s.expenseId) ?? [];
    list.push({ userId: s.userId, amount: s.amount });
    splitsByExpense.set(s.expenseId, list);
  }

  const input: ExpenseInput[] = groupExpenses.map((e) => ({
    paidById: e.paidById,
    splits: splitsByExpense.get(e.id) ?? [],
  }));

  const paid = await db
    .select({ fromId: settlements.fromId, toId: settlements.toId, amount: settlements.amount })
    .from(settlements)
    .where(eq(settlements.groupId, groupId));

  const balances = applySettlements(computeBalances(input), paid);

  const members = await db
    .select({ id: user.id, name: user.name })
    .from(groupMembers)
    .innerJoin(user, eq(groupMembers.userId, user.id))
    .where(eq(groupMembers.groupId, groupId));

  return members.map((m) => ({
    id: m.id,
    name: m.name,
    balance: Math.round((balances.get(m.id) ?? 0) * 100) / 100,
  }));
}

/** Delete an expense (its splits cascade-delete via the FK). */
export async function deleteExpense(
  groupId: string,
  expenseId: string,
): Promise<void> {
  const currentUser = await requireUser();
  await assertMember(groupId, currentUser.id);

  const [target] = await db
    .select({ id: expenses.id })
    .from(expenses)
    .where(and(eq(expenses.id, expenseId), eq(expenses.groupId, groupId)))
    .limit(1);

  if (target) {
    await db.delete(expenses).where(eq(expenses.id, expenseId));
  }

  revalidatePath(`/groups/${groupId}`);
  redirect(`/groups/${groupId}`);
}

/** Fetch one expense plus its current per-person splits, for the edit form. */
export async function getExpense(groupId: string, expenseId: string) {
  const currentUser = await requireUser();
  await assertMember(groupId, currentUser.id);

  const [expense] = await db
    .select()
    .from(expenses)
    .where(and(eq(expenses.id, expenseId), eq(expenses.groupId, groupId)))
    .limit(1);

  if (!expense) throw new Error("Expense not found.");

  const splits = await db
    .select({ userId: expenseSplits.userId, amount: expenseSplits.amount })
    .from(expenseSplits)
    .where(eq(expenseSplits.expenseId, expenseId));

  const members = await db
    .select({ id: user.id, name: user.name })
    .from(groupMembers)
    .innerJoin(user, eq(groupMembers.userId, user.id))
    .where(eq(groupMembers.groupId, groupId));

  return { expense, splits, members };
}

/** Update an expense: rewrite its fields and re-create its splits. */
export async function updateExpense(
  groupId: string,
  expenseId: string,
  formData: FormData,
): Promise<void> {
  const currentUser = await requireUser();
  await assertMember(groupId, currentUser.id);

  const [existing] = await db
    .select({ id: expenses.id })
    .from(expenses)
    .where(and(eq(expenses.id, expenseId), eq(expenses.groupId, groupId)))
    .limit(1);
  if (!existing) redirect(`/groups/${groupId}`);

  const description = String(formData.get("description") ?? "").trim();
  const amount = Number(formData.get("amount"));
  const paidById = String(formData.get("paidById") ?? "").trim();
  const mode = String(formData.get("mode") ?? "even") as SplitMode;

  if (!description || !amount || amount <= 0 || !paidById) {
    redirect(`/groups/${groupId}/expenses/${expenseId}/edit`);
  }

  const members = await db
    .select({ userId: groupMembers.userId })
    .from(groupMembers)
    .where(eq(groupMembers.groupId, groupId));

  const participants = members.map((m) => ({
    userId: m.userId,
    value:
      mode === "even"
        ? undefined
        : Number(formData.get(`value_${m.userId}`) ?? 0),
  }));

  const split = computeSplit(mode, amount, participants);
  if (!split.ok) {
    redirect(`/groups/${groupId}/expenses/${expenseId}/edit?error=split`);
  }

  await db
    .update(expenses)
    .set({ description, amount, paidById })
    .where(eq(expenses.id, expenseId));

  await db.delete(expenseSplits).where(eq(expenseSplits.expenseId, expenseId));
  await db.insert(expenseSplits).values(
    split.result.map((s) => ({
      expenseId,
      userId: s.userId,
      amount: s.amount,
    })),
  );

  revalidatePath(`/groups/${groupId}`);
  redirect(`/groups/${groupId}`);
}

/** Record that one member paid another. */
export async function recordSettlement(
  groupId: string,
  formData: FormData,
): Promise<void> {
  const currentUser = await requireUser();
  await assertMember(groupId, currentUser.id);

  const fromId = String(formData.get("fromId") ?? "").trim();
  const toId = String(formData.get("toId") ?? "").trim();
  const amount = Number(formData.get("amount"));

  if (!fromId || !toId || fromId === toId || !amount || amount <= 0) {
    redirect(`/groups/${groupId}`);
  }

  await db.insert(settlements).values({ groupId, fromId, toId, amount });

  revalidatePath(`/groups/${groupId}`);
  redirect(`/groups/${groupId}`);
}

/** List recorded settlements (payment history) for a group. */
export async function getSettlementHistory(groupId: string) {
  const currentUser = await requireUser();
  await assertMember(groupId, currentUser.id);

  const rows = await db
    .select({
      id: settlements.id,
      amount: settlements.amount,
      fromId: settlements.fromId,
      toId: settlements.toId,
      createdAt: settlements.createdAt,
    })
    .from(settlements)
    .where(eq(settlements.groupId, groupId));

  const names = new Map(
    (
      await db
        .select({ id: user.id, name: user.name })
        .from(groupMembers)
        .innerJoin(user, eq(groupMembers.userId, user.id))
        .where(eq(groupMembers.groupId, groupId))
    ).map((r) => [r.id, r.name] as const),
  );

  return rows.map((r) => ({
    id: r.id,
    amount: r.amount,
    fromName: names.get(r.fromId) ?? "Unknown",
    toName: names.get(r.toId) ?? "Unknown",
    createdAt: r.createdAt,
  }));
}