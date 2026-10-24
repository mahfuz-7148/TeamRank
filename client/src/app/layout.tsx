import type { Metadata } from "next";
import type { ReactNode } from "react";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "TeamRank",
  description: "টিম পরীক্ষা, পয়েন্ট এবং লিডারবোর্ড সিস্টেম",
};

const navLinks = [
  { href: "/", label: "হোম" },
  { href: "/admin", label: "অ্যাডমিন" },
  { href: "/award", label: "পয়েন্ট দিন" },
];

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="bn">
      <body>
        <div className="min-h-screen flex flex-col">
          <header className="bg-indigo-600 text-white shadow">
            <div className="mx-auto max-w-3xl px-4 py-3 flex items-center justify-between">
              <Link href="/" className="text-lg font-bold tracking-tight">
                🏆 TeamRank
              </Link>
              <nav className="flex gap-1 sm:gap-3">
                {navLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="rounded-md px-2 py-1 text-sm hover:bg-indigo-500 transition-colors"
                  >
                    {link.label}
                  </Link>
                ))}
              </nav>
            </div>
          </header>

          <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-6">
            {children}
          </main>

          <footer className="border-t border-slate-200 py-4 text-center text-xs text-slate-400">
            TeamRank — টিম পরীক্ষা ও লিডারবোর্ড
          </footer>
        </div>
      </body>
    </html>
  );
}
