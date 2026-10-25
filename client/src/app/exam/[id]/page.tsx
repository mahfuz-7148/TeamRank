"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import PassedList from "@/components/PassedList";
import { ApiError, getExam, selfPass } from "@/lib/api";
import { getSavedUser } from "@/lib/user";
import type { ExamDetail } from "@/types";

const REFRESH_INTERVAL_MS = 5000;

interface SavedUser {
  id: string;
  username: string;
}

export default function ExamDetailPage() {
  const params = useParams<{ id: string }>();
  const id = typeof params.id === "string" ? params.id : "";

  const [exam, setExam] = useState<ExamDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [me, setMe] = useState<SavedUser | null>(null);
  const [passing, setPassing] = useState(false);
  const [passError, setPassError] = useState<string | null>(null);
  const [passMessage, setPassMessage] = useState<string | null>(null);

  useEffect(() => {
    setMe(getSavedUser());
  }, []);

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

  // Self-pass: every press adds one pass, then refresh the list immediately
  async function handleSelfPass() {
    if (!me || !exam || passing) return;
    setPassing(true);
    setPassError(null);
    setPassMessage(null);
    try {
      const result = await selfPass(exam.id, me.id);
      // Optimistic update for instant feedback
      setExam((prev) => {
        if (!prev) return prev;
        const exists = prev.checkedBy.some((u) => u.id === me.id);
        const checkedBy = exists
          ? prev.checkedBy.map((u) =>
              u.id === me.id ? { ...u, passes: result.userPasses } : u
            )
          : [
              ...prev.checkedBy,
              { id: me.id, username: me.username, passes: result.userPasses },
            ];
        return {
          ...prev,
          checkedBy,
          passedCount: result.passedCount,
          uniqueUsers: result.uniqueUsers,
        };
      });
      setPassMessage(
        `🎉 পাস রেকর্ড হয়েছে! আপনি এখন ${result.userPasses} বার পাস করেছেন।`
      );
      // Confirm with server data
      void loadExam();
    } catch (err) {
      setPassError(
        err instanceof ApiError ? err.message : "পাস রেকর্ড করা যায়নি"
      );
    } finally {
      setPassing(false);
    }
  }

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

  const myPasses = me
    ? exam.checkedBy.find((u) => u.id === me.id)?.passes ?? 0
    : 0;

  return (
    <article className="flex flex-col gap-7">
      <header className="relative animate-fade-in-up overflow-hidden rounded-2xl border border-slate-200/80 bg-white/80 p-6 shadow-sm backdrop-blur">
        <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-indigo-500 via-violet-500 to-fuchsia-500" />
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">{exam.title}</h1>
            <p className="mt-1.5 flex flex-wrap items-center gap-3 text-xs text-slate-400">
              <span>📅 {date}</span>
              <span className="h-1 w-1 rounded-full bg-slate-300" />
              <span className="font-semibold text-emerald-600">
                ✅ {exam.passedCount}টি পাস
              </span>
              <span className="font-semibold text-indigo-600">
                👥 {exam.uniqueUsers} জন
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

      {/* Self pass — user marks their own success */}
      <section className="animate-fade-in-up rounded-2xl border border-slate-200/80 bg-white/80 p-5 shadow-sm backdrop-blur">
        {!me ? (
          <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-slate-600">
              এই পরীক্ষা পাস করলে আপনার নাম তালিকায় যোগ করতে প্রথমে নাম দিন।
            </p>
            <Link
              href="/"
              className="shrink-0 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-4 py-2 text-sm font-semibold text-white shadow-md shadow-indigo-200 transition-all duration-200 hover:shadow-lg active:scale-95"
            >
              নাম দিন →
            </Link>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="flex flex-wrap items-center gap-2 font-semibold text-slate-800">
                  <span>{me.username}, পরীক্ষাটি কি পারছেন?</span>
                  {myPasses > 0 && (
                    <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-bold text-emerald-700 ring-1 ring-emerald-200">
                      ✅ {myPasses} বার পাস
                    </span>
                  )}
                </p>
                <p className="mt-0.5 text-xs text-slate-500">
                  {myPasses > 0
                    ? "আরেকটি প্রশ্নের উত্তর দিতে আবার চাপুন — প্রতিবার +১ যোগ হবে।"
                    : "পাস করলে নিচের বাটনে চাপুন — সাথে সাথে আপনার নাম তালিকায় উঠবে।"}
                </p>
              </div>
              <button
                type="button"
                onClick={() => void handleSelfPass()}
                disabled={passing}
                className="shrink-0 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-emerald-200 transition-all duration-200 hover:shadow-xl hover:shadow-emerald-300 active:scale-95 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {passing ? (
                  <span className="flex items-center gap-2">
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                    যোগ হচ্ছে...
                  </span>
                ) : (
                  "✅ আমি পাস করেছি (+১)"
                )}
              </button>
            </div>
            {passMessage && (
              <p className="animate-scale-in rounded-xl bg-emerald-50 px-4 py-2.5 text-sm font-medium text-emerald-700 ring-1 ring-emerald-100">
                {passMessage}
              </p>
            )}
            {passError && (
              <p className="animate-scale-in rounded-xl bg-red-50 px-4 py-2.5 text-sm text-red-600 ring-1 ring-red-100">
                ⚠️ {passError}
              </p>
            )}
          </div>
        )}
      </section>

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
