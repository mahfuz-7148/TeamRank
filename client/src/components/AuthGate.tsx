"use client";

import { useEffect, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";

const PUBLIC_PATHS = new Set(["/login", "/signup"]);

function FullPageSpinner() {
  return (
    <div className="flex items-center justify-center py-24">
      <span className="h-10 w-10 animate-spin rounded-full border-4 border-indigo-100 border-t-indigo-500" />
    </div>
  );
}

export default function AuthGate({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const isPublic = PUBLIC_PATHS.has(pathname);

  useEffect(() => {
    if (loading) return;
    if (!user && !isPublic) {
      const target = `${pathname}${window.location.search}`;
      const next = target === "/" ? "" : `?next=${encodeURIComponent(target)}`;
      router.replace(`/login${next}`);
    } else if (user && isPublic) {
      router.replace("/");
    }
  }, [loading, user, isPublic, router]);

  if (isPublic) {
    // Logged-in users are redirected home, but don't flash the auth form.
    if (loading || user) return <FullPageSpinner />;
    return <>{children}</>;
  }

  if (loading || !user) return <FullPageSpinner />;
  return <>{children}</>;
}
