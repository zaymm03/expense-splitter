import Link from "next/link";
import { getMyGroups } from "./actions";

export default async function GroupsPage() {
  const groups = await getMyGroups();

  return (
    <main className="mx-auto max-w-2xl p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Your groups</h1>
        <Link
          href="/groups/new"
          className="rounded-md bg-black px-3 py-2 text-sm text-white"
        >
          + New group
        </Link>
      </div>

      {groups.length === 0 ? (
        <div className="mt-10 rounded-lg border border-dashed p-10 text-center text-gray-500">
          <p>No groups yet.</p>
          <p className="mt-1 text-sm">
            Create one to start splitting expenses.
          </p>
        </div>
      ) : (
        <ul className="mt-6 space-y-2">
          {groups.map((g) => (
            <li key={g.id}>
              <Link
                href={`/groups/${g.id}`}
                className="block rounded-md border p-4 hover:bg-gray-50"
              >
                <span className="font-medium">{g.name}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}