"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import PassedList from "@/components/PassedList";
import ResponderList from "@/components/ResponderList";
import { ApiError, getExam, respondToExam } from "@/lib/api";
import { getSocket } from "@/lib/socket";
import { getSavedUser } from "@/lib/user";
import type { ExamDetail, ExamResponseEvent } from "@/types";

const REFRESH_INTERVAL_MS = 5000;
const RESPOND_COOLDOWN_SECONDS = 5;

interface SavedUser {
  id: string;
  username: string;
}

export default function ExamDetailPage() {
  const params = useParams<{ id: string }>();
  const id = typeof params.id === "string" ? params.id : "";

  const [exam, setExam] = useState<ExamDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [me, setMe] = useState<SavedUser | null>(null);
  const [responding, setResponding] = useState(false);
  const [respondError, setRespondError] = useState<string | null>(null);
  const [respondMessage, setRespondMessage] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    setMe(getSavedUser());
  }, []);

  // 5-second cooldown between answer chances
  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setTimeout(() => {
      setCooldown((value) => Math.max(0, value - 1));
    }, 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);

  const loadExam = useCallback(async () => {
    if (!id) return;
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
    void loadExam();
    const timer = setInterval(() => {
      void loadExam();
    }, REFRESH_INTERVAL_MS);
    return () => clearInterval(timer);
  }, [loadExam]);

  // Socket.IO pushes an instant refresh when someone responds on this exam.
  // The 5-second polling above stays as a fallback.
  useEffect(() => {
    if (!id) return;
    const socket = getSocket();
    function handleResponse(event: ExamResponseEvent) {
      if (event.examId === id) void loadExam();
    }
    socket.on("exam:response", handleResponse);
    return () => {
      socket.off("exam:response", handleResponse);
    };
  }, [id, loadExam]);

  // Respond: adds my name to the "wants to answer" list only.
  // This never adds a pass or a point — the admin awards those separately.
  // After each press there is a 5-second cooldown, then the member can
  // press again (as many times as needed) for the next answer chance.
  async function handleRespond() {
    if (!me || !exam || responding || cooldown > 0) return;
    setResponding(true);
    setRespondError(null);
    setRespondMessage(null);
    try {
      await respondToExam(exam.id, me.id);
      // Optimistic update for instant feedback
      setExam((prev) => {
        if (!prev) return prev;
        if (prev.responders.some((u) => u.id === me.id)) return prev;
        return {
          ...prev,
          responders: [
            ...prev.responders,
            { id: me.id, username: me.username },
          ],
        };
      });
      setCooldown(RESPOND_COOLDOWN_SECONDS);
      setRespondMessage(
        "✅ আপনার নাম তালিকায় যোগ হয়েছে — ৫ সেকেন্ড পর আবার উত্তর দিতে পারবেন।"
      );
      // Confirm with server data
      void loadExam();
    } catch (err) {
      setRespondError(
        err instanceof ApiError ? err.message : "নাম যোগ করা যায়নি"
      );
    } finally {
      setResponding(false);
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

  const hasResponded = me
    ? exam.responders.some((u) => u.id === me.id)
    : false;

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

      {/* Raise hand — only adds the name, never a pass or a point */}
      <section className="animate-fade-in-up rounded-2xl border border-slate-200/80 bg-white/80 p-5 shadow-sm backdrop-blur">
        {!me ? (
          <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-slate-600">
              এই প্রশ্নের উত্তর দিতে চাইলে প্রথমে আপনার নাম দিন।
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
                <p className="font-semibold text-slate-800">
                  {me.username}, এই প্রশ্নের উত্তর দিতে চান?
                </p>
                <p className="mt-0.5 text-xs text-slate-500">
                  {hasResponded
                    ? "আপনার নাম তালিকায় আছে — ৫ সেকেন্ড পর পর আবার চাপ দিতে পারবেন, যতবার দরকার।"
                    : "বাটনে চাপলে শুধু আপনার নাম তালিকায় উঠবে — কোনো পাস বা পয়েন্ট যোগ হবে না।"}
                </p>
              </div>
              <button
                type="button"
                onClick={() => void handleRespond()}
                disabled={responding || cooldown > 0}
                className={`shrink-0 rounded-xl px-6 py-3 text-sm font-bold text-white shadow-lg transition-all duration-200 active:scale-95 disabled:cursor-not-allowed disabled:opacity-90 ${
                  cooldown > 0
                    ? "bg-gradient-to-r from-amber-500 to-orange-500 shadow-amber-200"
                    : hasResponded
                      ? "bg-gradient-to-r from-emerald-500 to-teal-600 shadow-emerald-200 hover:shadow-xl hover:shadow-emerald-300"
                      : "bg-gradient-to-r from-indigo-600 to-violet-600 shadow-indigo-200 hover:shadow-xl hover:shadow-indigo-300"
                }`}
              >
                {responding ? (
                  <span className="flex items-center gap-2">
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                    যোগ হচ্ছে...
                  </span>
                ) : cooldown > 0 ? (
                  `⏳ ${cooldown} সেকেন্ড পর আবার চাপুন`
                ) : hasResponded ? (
                  "🙋 আবার উত্তর দিতে চাই"
                ) : (
                  "🙋 আমি উত্তর দিতে চাই"
                )}
              </button>
            </div>
            {cooldown > 0 && (
              <div className="flex items-center gap-2.5">
                <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-amber-100">
                  <span
                    className="block h-full rounded-full bg-gradient-to-r from-amber-400 to-orange-500 transition-all duration-1000 ease-linear"
                    style={{
                      width: `${(cooldown / RESPOND_COOLDOWN_SECONDS) * 100}%`,
                    }}
                  />
                </span>
                <span className="shrink-0 text-xs font-semibold text-amber-600">
                  {cooldown} সেকেন্ড বাকি
                </span>
              </div>
            )}
            {respondMessage && (
              <p className="animate-scale-in rounded-xl bg-emerald-50 px-4 py-2.5 text-sm font-medium text-emerald-700 ring-1 ring-emerald-100">
                {respondMessage}
              </p>
            )}
            {respondError && (
              <p className="animate-scale-in rounded-xl bg-red-50 px-4 py-2.5 text-sm text-red-600 ring-1 ring-red-100">
                ⚠️ {respondError}
              </p>
            )}
          </div>
        )}
      </section>

      <section>
        <div className="mb-3.5 flex flex-wrap items-center gap-2">
          <h2 className="flex items-center gap-2 text-lg font-bold text-slate-900">
            🙋 যারা উত্তর দিতে চায়
          </h2>
          <span className="rounded-full bg-indigo-50 px-2.5 py-0.5 text-xs font-bold text-indigo-600 ring-1 ring-indigo-100">
            {exam.responders.length} জন
          </span>
        </div>
        <ResponderList users={exam.responders} />
      </section>

      <section>
        <div className="mb-3.5 flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-lg font-bold text-slate-900">
            🎖️ যারা পাস করেছে
          </h2>
        </div>
        <PassedList users={exam.checkedBy} />
      </section>
    </article>
  );
}
