"use client";

import { useCallback, useEffect, useState } from "react";
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
  const [error, setError] = useState<string | null>(null);

  const loadExam = useCallback(async () => {
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
    }
  }, [id]);

  useEffect(() => {
    if (!id) return;
    void loadExam();
    const timer = setInterval(() => {
      void loadExam();
    }, REFRESH_INTERVAL_MS);
    return () => clearInterval(timer);
  }, [id, loadExam]);

  if (!id) {
    return (
      <p className="rounded-xl bg-red-50 p-4 text-sm text-red-600">
        ভুল লিংক — পরীক্ষার আইডি পাওয়া যায়নি।
      </p>
    );
  }

  if (loading) {
    return (
      <div className="py-16 text-center text-sm text-slate-400">
        লোড হচ্ছে...
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl bg-red-50 p-4 text-sm text-red-600">
        {error}
        <button
          onClick={() => {
            setLoading(true);
            void loadExam();
          }}
          className="ml-3 underline hover:no-underline"
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
    <article className="flex flex-col gap-6">
      <header className="rounded-xl bg-white border border-slate-200 p-5 shadow-sm">
        <h1 className="text-xl font-bold text-slate-900">{exam.title}</h1>
        <p className="mt-1 text-xs text-slate-400">
          📅 {date} · ✅ {exam.passedCount} জন পাস
        </p>
        {exam.content && (
          <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-slate-600">
            {exam.content}
          </p>
        )}
      </header>

      <section>
        <h2 className="mb-3 text-lg font-bold">যারা পাস করেছে</h2>
        <PassedList users={exam.checkedBy} />
        <p className="mt-2 text-center text-xs text-slate-400">
          প্রতি ৫ সেকেন্ডে স্বয়ংক্রিয়ভাবে আপডেট হয়
        </p>
      </section>
    </article>
  );
}
