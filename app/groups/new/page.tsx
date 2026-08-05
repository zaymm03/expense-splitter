import Link from "next/link";
import { createGroup } from "../actions";

export default function NewGroupPage() {
  return (
    <main className="mx-auto max-w-md p-6">
      <Link href="/groups" className="text-sm text-gray-500 hover:underline">
        ← Back to groups
      </Link>

      <h1 className="mt-4 text-2xl font-bold">Create a group</h1>
      <p className="text-sm text-gray-500">
        Give it a name like &quot;Trip to Bali&quot; or &quot;Apartment&quot;.
      </p>

      <form action={createGroup} className="mt-6 space-y-4">
        <input
          name="name"
          required
          placeholder="Group name"
          className="w-full rounded-md border px-3 py-2"
        />
        <button
          type="submit"
          className="w-full rounded-md bg-black px-3 py-2 text-white"
        >
          Create group
        </button>
      </form>
    </main>
  );
}