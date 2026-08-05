import Link from "next/link";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import SignOutButton from "./sign-out-button";

export default async function DashboardPage() {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session) {
    redirect("/login");
  }

  return (
    <main className="mx-auto max-w-2xl p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <SignOutButton />
      </div>
      <p className="mt-4 text-gray-600">Welcome, {session.user.name}.</p>

      <Link
        href="/groups"
        className="mt-6 inline-block rounded-md bg-black px-4 py-2 text-white"
      >
        View your groups →
      </Link>
    </main>
  );
}