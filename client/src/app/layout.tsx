import type { Metadata } from "next";
import type { ReactNode } from "react";
import Link from "next/link";
import { Hind_Siliguri } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import RealtimeNotifications from "@/components/RealtimeNotifications";
import "./globals.css";

const hindSiliguri = Hind_Siliguri({
  subsets: ["bengali", "latin"],
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
  variable: "--font-bengali",
});

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
    <html lang="bn" className={hindSiliguri.variable}>
      <body className="font-sans">
        <div className="min-h-screen flex flex-col bg-gradient-to-br from-slate-50 via-indigo-50/40 to-slate-100">
          <header className="sticky top-0 z-50 border-b border-indigo-100/60 bg-white/75 backdrop-blur-xl shadow-sm">
            <div className="mx-auto max-w-3xl px-4 py-3 flex items-center justify-between">
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
              <nav className="flex gap-1">
                {navLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="rounded-lg px-3 py-1.5 text-sm font-medium text-slate-600 transition-all duration-200 hover:bg-indigo-50 hover:text-indigo-700 active:scale-95"
                  >
                    {link.label}
                  </Link>
                ))}
              </nav>
            </div>
          </header>

          <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-8">
            {children}
          </main>

          <footer className="border-t border-slate-200/60 py-5 text-center text-xs text-slate-400">
            TeamRank — টিম পরীক্ষা ও লিডারবোর্ড
          </footer>
        </div>
        <RealtimeNotifications />
        <Analytics />
      </body>
    </html>
  );
}
