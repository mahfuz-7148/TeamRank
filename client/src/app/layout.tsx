import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Hind_Siliguri } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import AuthGate from "@/components/AuthGate";
import { AuthProvider } from "@/components/AuthProvider";
import RealtimeNotifications from "@/components/RealtimeNotifications";
import SiteHeader from "@/components/SiteHeader";
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

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="bn" className={hindSiliguri.variable}>
      <body className="font-sans">
        <AuthProvider>
          <div className="min-h-screen flex flex-col bg-gradient-to-br from-slate-50 via-indigo-50/40 to-slate-100">
            <SiteHeader />

            <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-8">
              <AuthGate>{children}</AuthGate>
            </main>

            <footer className="border-t border-slate-200/60 py-5 text-center text-xs text-slate-400">
              TeamRank — টিম পরীক্ষা ও লিডারবোর্ড
            </footer>
          </div>
          <RealtimeNotifications />
          <Analytics />
        </AuthProvider>
      </body>
    </html>
  );
}
