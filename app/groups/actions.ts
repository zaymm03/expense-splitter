"use server";

import { auth } from "@/lib/auth";
import { db } from "@/db";
import { groups, groupMembers } from "@/db/schema";
import { eq } from "drizzle-orm";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

async function requireUser() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/login");
  return session.user;
}

export async function createGroup(formData: FormData): Promise<void> {
  const user = await requireUser();
  const name = String(formData.get("name") ?? "").trim();

  // The form field is `required`, but guard on the server too.
  if (!name) redirect("/groups/new");

  // Create the group, then add the creator as its first member.
  const [group] = await db
    .insert(groups)
    .values({ name, ownerId: user.id })
    .returning();

  await db.insert(groupMembers).values({
    groupId: group.id,
    userId: user.id,
  });

  revalidatePath("/groups");
  redirect("/groups");
}

export async function getMyGroups() {
  const user = await requireUser();

  const rows = await db
    .select({
      id: groups.id,
      name: groups.name,
      createdAt: groups.createdAt,
      ownerId: groups.ownerId,
    })
    .from(groupMembers)
    .innerJoin(groups, eq(groupMembers.groupId, groups.id))
    .where(eq(groupMembers.userId, user.id));

  return rows;
}