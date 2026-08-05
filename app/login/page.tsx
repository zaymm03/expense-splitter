"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { signIn } from "@/lib/auth-client";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit() {
    setError("");
    setLoading(true);
    const { error } = await signIn.email({ email, password });
    setLoading(false);
    if (error) {
      setError(error.message ?? "Invalid email or password");
      return;
    }
    router.push("/groups");
    router.refresh();
  }

  return (
    <main className="grid min-h-screen place-items-center px-6">
      <div className="rise w-full max-w-sm">
        <Link
          href="/"
          className="text-2xl text-ink"
          style={{ fontFamily: "var(--font-fraunces)", fontWeight: 600 }}
        >
          Settle
        </Link>
        <h1 className="mt-6 text-2xl font-semibold text-ink">Welcome back</h1>
        <p className="mt-1 text-sm text-ink-soft">Log in to your account.</p>

        <div className="mt-6 space-y-3">
          <input
            className="w-full rounded-lg border border-line bg-card px-3 py-2.5 outline-none focus:border-ink"
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <input
            className="w-full rounded-lg border border-line bg-card px-3 py-2.5 outline-none focus:border-ink"
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          {error && (
            <p className="rounded-md bg-owed-soft px-3 py-2 text-sm text-owed">
              {error}
            </p>
          )}

          <button
            onClick={handleSubmit}
            disabled={loading}
            className="w-full rounded-lg bg-ink px-3 py-2.5 font-medium text-paper hover:opacity-90 disabled:opacity-50"
          >
            {loading ? "Logging in…" : "Log in"}
          </button>
        </div>

        <p className="mt-6 text-center text-sm text-ink-soft">
          No account yet?{" "}
          <Link href="/signup" className="font-medium text-ink underline">
            Sign up
          </Link>
        </p>
      </div>
    </main>
  );
}