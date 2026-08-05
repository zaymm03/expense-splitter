import Link from "next/link";
import SiteHeader from "@/components/site-header";
import { createGroup } from "../actions";

export default function NewGroupPage() {
  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-md px-6 py-10">
        <Link
          href="/groups"
          className="text-sm text-ink-soft hover:text-ink"
        >
          ← Back to groups
        </Link>

        <h1
          className="mt-4 text-3xl text-ink"
          style={{ fontFamily: "var(--font-fraunces)", fontWeight: 600 }}
        >
          Create a group
        </h1>
        <p className="mt-1 text-sm text-ink-soft">
          Name it something you&apos;ll recognize — &ldquo;Bali 2026&rdquo; or &ldquo;Flat 3B.&rdquo;
        </p>

        <form action={createGroup} className="mt-6 space-y-4">
          <input
            name="name"
            required
            placeholder="Group name"
            className="w-full rounded-lg border border-line bg-card px-3 py-2.5 outline-none focus:border-ink"
          />
          <button
            type="submit"
            className="w-full rounded-lg bg-ink px-3 py-2.5 font-medium text-paper hover:opacity-90"
          >
            Create group
          </button>
        </form>
      </main>
    </>
  );
}