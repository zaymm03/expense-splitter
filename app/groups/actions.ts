"use server";

import { auth } from "@/lib/auth";
import { db } from "@/db";
import { groups, groupMembers, expenses, expenseSplits, user } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

async function requireUser() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/login");
  return session.user;
}

/** Throws if the current user is not a member of the group. */
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

/** Full detail for one group: members and expenses. */
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

/** Add an existing (signed-up) user to the group by their email. */
export async function addMember(groupId: string, formData: FormData): Promise<void> {
  const currentUser = await requireUser();
  await assertMember(groupId, currentUser.id);

  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  if (!email) redirect(`/groups/${groupId}`);

  const [target] = await db.select().from(user).where(eq(user.email, email)).limit(1);
  if (!target) {
    // Silently return; in a real app we'd surface "no user with that email".
    redirect(`/groups/${groupId}?error=nouser`);
  }

  // Skip if already a member.
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

/** Add an expense, split evenly among all current members. */
export async function addExpense(groupId: string, formData: FormData): Promise<void> {
  const currentUser = await requireUser();
  await assertMember(groupId, currentUser.id);

  const description = String(formData.get("description") ?? "").trim();
  const amount = Number(formData.get("amount"));
  const paidById = String(formData.get("paidById") ?? "").trim();

  if (!description || !amount || amount <= 0 || !paidById) {
    redirect(`/groups/${groupId}`);
  }

  const members = await db
    .select({ userId: groupMembers.userId })
    .from(groupMembers)
    .where(eq(groupMembers.groupId, groupId));

  if (members.length === 0) redirect(`/groups/${groupId}`);

  // Even split. Distribute any rounding remainder across the first members
  // so the shares sum exactly to the total.
  const share = Math.floor((amount / members.length) * 100) / 100;
  const shares = members.map(() => share);
  let remainder = Math.round((amount - share * members.length) * 100) / 100;
  for (let i = 0; remainder > 0 && i < shares.length; i++) {
    shares[i] = Math.round((shares[i] + 0.01) * 100) / 100;
    remainder = Math.round((remainder - 0.01) * 100) / 100;
  }

  const [expense] = await db
    .insert(expenses)
    .values({ groupId, description, amount, paidById })
    .returning();

  await db.insert(expenseSplits).values(
    members.map((m, i) => ({
      expenseId: expense.id,
      userId: m.userId,
      amount: shares[i],
    })),
  );

  revalidatePath(`/groups/${groupId}`);
  redirect(`/groups/${groupId}`);
}