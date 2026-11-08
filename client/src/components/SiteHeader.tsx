"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { useAuth } from "@/components/AuthProvider";

const navLinks = [
  { href: "/", label: "হোম" },
  { href: "/admin", label: "অ্যাডমিন" },
  { href: "/award", label: "পয়েন্ট দিন" },
];

export default function SiteHeader() {
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const [loggingOut, setLoggingOut] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleLogout() {
    setLoggingOut(true);
    setError(null);
    try {
      await logout();
      router.replace("/login");
      router.refresh();
    } catch {
      setError("লগআউট করা যায়নি — আবার চেষ্টা করুন");
    } finally {
      setLoggingOut(false);
    }
  }

  return (
    <header className="sticky top-0 z-50 border-b border-indigo-100/60 bg-white/75 shadow-sm backdrop-blur-xl">
      <div className="mx-auto flex max-w-3xl flex-wrap items-center justify-between gap-2 px-4 py-3">
        <Link
          href="/"
          className="flex items-center gap-2 text-lg font-bold tracking-tight text-slate-900 transition-transform duration-200 hover:scale-[1.03] active:scale-95"
        >
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 text-white shadow-lg shadow-indigo-200 animate-trophy-bounce">
            🏆
          </span>
          <span className="bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">
            TeamRank
          </span>
        </Link>

        <nav className="flex items-center gap-1">
          {user ? (
            <>
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`rounded-lg px-2.5 py-1.5 text-xs font-medium transition-all duration-200 active:scale-95 sm:text-sm ${
                    pathname === link.href
                      ? "bg-indigo-50 text-indigo-700"
                      : "text-slate-600 hover:bg-indigo-50 hover:text-indigo-700"
                  }`}
                >
                  {link.label}
                </Link>
              ))}
              <span className="ml-1 hidden items-center gap-1.5 rounded-full bg-white/80 px-2.5 py-1.5 text-xs font-medium text-indigo-700 ring-1 ring-indigo-100 md:flex">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 text-[10px] font-bold text-white">
                  {user.username.charAt(0).toUpperCase()}
                </span>
                <span className="max-w-[7rem] truncate">{user.username}</span>
              </span>
              <button
                type="button"
                onClick={() => void handleLogout()}
                disabled={loggingOut}
                className="ml-1 rounded-lg border border-slate-200 bg-white/80 px-2.5 py-1.5 text-xs text-slate-500 transition-all duration-200 hover:border-red-200 hover:bg-red-50 hover:text-red-600 active:scale-95 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loggingOut ? "..." : "লগআউট"}
              </button>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-all duration-200 active:scale-95 ${
                  pathname === "/login"
                    ? "bg-indigo-50 text-indigo-700"
                    : "text-slate-600 hover:bg-indigo-50 hover:text-indigo-700"
                }`}
              >
                লগইন
              </Link>
              <Link
                href="/signup"
                className="rounded-lg bg-gradient-to-r from-indigo-600 to-violet-600 px-3 py-1.5 text-sm font-semibold text-white shadow-md shadow-indigo-200 transition-all duration-200 hover:shadow-lg active:scale-95"
              >
                সাইনআপ
              </Link>
            </>
          )}
        </nav>
      </div>
      {error && (
        <p className="bg-red-50 px-4 pb-2 text-center text-xs text-red-600">
          ⚠️ {error}
        </p>
      )}
    </header>
  );
}
