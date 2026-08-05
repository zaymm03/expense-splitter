import Link from "next/link";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import SignOutButton from "@/app/dashboard/sign-out-button";

export default async function SiteHeader() {
  const session = await auth.api.getSession({ headers: await headers() });

  return (
    <header className="border-b border-line bg-card/70 backdrop-blur">
      <div className="mx-auto flex max-w-2xl items-center justify-between px-6 py-4">
        <Link href={session ? "/groups" : "/"} className="group flex items-center gap-2">
          <span className="grid h-7 w-7 place-items-center rounded-md bg-ink text-sm text-paper">
            ₪
          </span>
          <span
            className="text-lg font-semibold text-ink"
            style={{ fontFamily: "var(--font-fraunces)" }}
          >
            Settle
          </span>
        </Link>

        {session ? (
          <div className="flex items-center gap-4 text-sm">
            <span className="hidden text-ink-soft sm:inline">
              {session.user.name}
            </span>
            <SignOutButton />
          </div>
        ) : (
          <nav className="flex items-center gap-3 text-sm">
            <Link href="/login" className="text-ink-soft hover:text-ink">
              Log in
            </Link>
            <Link
              href="/signup"
              className="rounded-md bg-ink px-3 py-1.5 text-paper hover:opacity-90"
            >
              Sign up
            </Link>
          </nav>
        )}
      </div>
    </header>
  );
}