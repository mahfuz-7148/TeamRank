"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import PassedList from "@/components/PassedList";
import { ApiError, getExam } from "@/lib/api";
import type { ExamDetail } from "@/types";

const REFRESH_INTERVAL_MS = 5000;

export default function ExamDetailPage() {
  const params = useParams<{ id: string }>();
  const id = typeof params.id === "string" ? params.id : "";

  const [exam, setExam] = useState<ExamDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadExam = useCallback(async () => {
    if (!id) return;
    setRefreshing(true);
    try {
      const data = await getExam(id);
      setExam(data);
      setError(null);
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : "পরীক্ষা লোড করা যায়নি"
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [id]);

  useEffect(() => {
    void loadExam();
    const timer = setInterval(() => {
      void loadExam();
    }, REFRESH_INTERVAL_MS);
    return () => clearInterval(timer);
  }, [loadExam]);

  if (!id) {
    return (
      <div className="animate-scale-in rounded-2xl bg-red-50 p-5 text-sm text-red-600 ring-1 ring-red-100">
        ⚠️ ভুল লিংক — পরীক্ষার আইডি পাওয়া যায়নি।
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex flex-col gap-4">
        <div className="rounded-2xl border border-slate-200/80 bg-white/80 p-6">
          <div className="skeleton h-6 w-1/2" />
          <div className="skeleton mt-3 h-3 w-1/4" />
          <div className="skeleton mt-5 h-3 w-3/4" />
          <div className="skeleton mt-2 h-3 w-2/3" />
        </div>
        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
          {[1, 2, 3, 4].map((n) => (
            <div
              key={n}
              className="flex items-center gap-3 rounded-xl border border-slate-200/80 bg-white/80 px-4 py-3"
            >
              <div className="skeleton h-9 w-9 rounded-full" />
              <div className="skeleton h-4 flex-1" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="animate-scale-in rounded-2xl bg-red-50 p-5 text-sm text-red-600 ring-1 ring-red-100">
        ⚠️ {error}
        <button
          onClick={() => {
            setLoading(true);
            void loadExam();
          }}
          className="ml-3 font-medium underline hover:no-underline"
        >
          আবার চেষ্টা করুন
        </button>
      </div>
    );
  }

  if (!exam) return null;

  const date = new Date(exam.createdAt).toLocaleDateString("bn-BD", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <article className="flex flex-col gap-7">
      <header className="relative animate-fade-in-up overflow-hidden rounded-2xl border border-slate-200/80 bg-white/80 p-6 shadow-sm backdrop-blur">
        <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-indigo-500 via-violet-500 to-fuchsia-500" />
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">{exam.title}</h1>
            <p className="mt-1.5 flex items-center gap-3 text-xs text-slate-400">
              <span>📅 {date}</span>
              <span className="h-1 w-1 rounded-full bg-slate-300" />
              <span className="font-semibold text-emerald-600">
                ✅ {exam.passedCount}টি পাস
              </span>
            </p>
          </div>
          <Link
            href="/"
            className="shrink-0 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-500 transition-all duration-200 hover:border-indigo-200 hover:text-indigo-600 active:scale-95"
          >
            ← ফিরুন
          </Link>
        </div>
        {exam.content && (
          <p className="mt-4 whitespace-pre-wrap text-sm leading-relaxed text-slate-600">
            {exam.content}
          </p>
        )}
      </header>

      <section>
        <div className="mb-3.5 flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-lg font-bold text-slate-900">
            🎖️ যারা পাস করেছে
          </h2>
          <span
            className={`flex items-center gap-1.5 text-xs text-slate-400 transition-opacity duration-300 ${
              refreshing ? "opacity-100" : "opacity-0"
            }`}
          >
            <span className="h-3 w-3 animate-spin rounded-full border-2 border-indigo-100 border-t-indigo-400" />
            আপডেট হচ্ছে
          </span>
        </div>
        <PassedList users={exam.checkedBy} />
        <p className="mt-3 text-center text-xs text-slate-400">
          প্রতি ৫ সেকেন্ডে স্বয়ংক্রিয়ভাবে আপডেট হয়
        </p>
      </section>
    </article>
  );
}
