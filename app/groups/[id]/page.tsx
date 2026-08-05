import Link from "next/link";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { groups, groupMembers } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { headers } from "next/headers";
import { redirect, notFound } from "next/navigation";

export default async function GroupDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/login");

  // Confirm the user is a member of this group.
  const membership = await db
    .select()
    .from(groupMembers)
    .where(
      and(
        eq(groupMembers.groupId, id),
        eq(groupMembers.userId, session.user.id),
      ),
    )
    .limit(1);

  if (membership.length === 0) notFound();

  const [group] = await db.select().from(groups).where(eq(groups.id, id));
  if (!group) notFound();

  return (
    <main className="mx-auto max-w-2xl p-6">
      <Link href="/groups" className="text-sm text-gray-500 hover:underline">
        ← Back to groups
      </Link>
      <h1 className="mt-4 text-2xl font-bold">{group.name}</h1>
      <p className="mt-4 text-gray-500">
        Expenses will appear here (coming in the next milestone).
      </p>
    </main>
  );
}