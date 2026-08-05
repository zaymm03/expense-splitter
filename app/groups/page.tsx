import Link from "next/link";
import SiteHeader from "@/components/site-header";
import { getMyGroups } from "./actions";

export default async function GroupsPage() {
  const groups = await getMyGroups();

  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-2xl px-6 py-10">
        <div className="flex items-end justify-between">
          <div>
            <h1
              className="text-3xl text-ink"
              style={{ fontFamily: "var(--font-fraunces)", fontWeight: 600 }}
            >
              Your groups
            </h1>
            <p className="mt-1 text-sm text-ink-soft">
              Trips, houses, and anything you share.
            </p>
          </div>
          <Link
            href="/groups/new"
            className="rounded-lg bg-ink px-4 py-2 text-sm font-medium text-paper hover:opacity-90"
          >
            New group
          </Link>
        </div>

        {groups.length === 0 ? (
          <div className="mt-8 rounded-xl border border-dashed border-line bg-card p-12 text-center">
            <p className="text-ink">No groups yet</p>
            <p className="mt-1 text-sm text-ink-soft">
              Create your first group to start splitting expenses.
            </p>
            <Link
              href="/groups/new"
              className="mt-5 inline-block rounded-lg bg-ink px-4 py-2 text-sm font-medium text-paper hover:opacity-90"
            >
              Create a group
            </Link>
          </div>
        ) : (
          <ul className="mt-8 space-y-3">
            {groups.map((g) => (
              <li key={g.id} className="rise">
                <Link
                  href={`/groups/${g.id}`}
                  className="flex items-center justify-between rounded-xl border border-line bg-card p-5 transition hover:border-ink/30 hover:shadow-sm"
                >
                  <span className="font-medium text-ink">{g.name}</span>
                  <span className="text-ink-soft">→</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </main>
    </>
  );
}