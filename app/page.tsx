import Link from "next/link";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 p-6 text-center">
      <div>
        <h1 className="text-4xl font-bold">💸 Expense Splitter</h1>
        <p className="mt-2 text-gray-500">
          Split shared expenses and settle up in the fewest payments.
        </p>
      </div>
      <div className="flex gap-3">
        <Link
          href="/signup"
          className="rounded-md bg-black px-4 py-2 text-white"
        >
          Get started
        </Link>
        <Link href="/login" className="rounded-md border px-4 py-2">
          Log in
        </Link>
      </div>
    </main>
  );
}