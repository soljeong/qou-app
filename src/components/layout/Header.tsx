import Image from "next/image";
import Link from "next/link";
import { auth, signOut } from "@/auth";

export async function Header() {
  const session = await auth();

  async function handleSignOut() {
    "use server";
    await signOut({ redirectTo: "/" });
  }

  return (
    <header className="fixed top-0 z-10 w-full border-b border-slate-200 bg-white/80 backdrop-blur-md print:hidden dark:border-slate-800 dark:bg-slate-950/80">
      <div className="container mx-auto flex h-16 items-center justify-between px-6">
        <div className="flex items-center gap-3">
          <Link href="/" className="flex items-center gap-3">
            <Image
              src="/logo_w.png"
              alt="Logo"
              width={198}
              height={32}
              className="invert dark:invert-0"
            />
          </Link>
        </div>

        <nav className="hidden items-center gap-8 text-sm font-medium text-slate-600 dark:text-slate-400 md:flex">
          <Link
            href="/quotes"
            className="transition-colors hover:text-blue-600 dark:hover:text-blue-400"
          >
            Quotes
          </Link>
        </nav>

        <div className="flex items-center gap-4">
          {session?.user ? (
            <>
              <span className="hidden text-sm text-slate-600 dark:text-slate-400 md:block">
                {session.user.name ?? session.user.email}
              </span>
              <form action={handleSignOut}>
                <button
                  type="submit"
                  className="rounded-full bg-slate-100 px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
                >
                  Logout
                </button>
              </form>
            </>
          ) : (
            <Link
              href="/login"
              className="rounded-full bg-slate-100 px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
            >
              Login
            </Link>
          )}

          <Link
            href="/quotes/new"
            className="rounded-full bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 shadow-sm shadow-blue-200 dark:shadow-none"
          >
            New Quote
          </Link>
        </div>
      </div>
    </header>
  );
}
