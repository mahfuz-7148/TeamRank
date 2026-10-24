"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import { ApiError, getExam, listExams, listUsers, toggleAward } from "@/lib/api";
import type { ExamSummary, User } from "@/types";

export default function AwardPage() {
  const [adminKey, setAdminKey] = useState("");
  const [keyVerified, setKeyVerified] = useState(false);

  const [exams, setExams] = useState<ExamSummary[]>([]);
  const [selectedExamId, setSelectedExamId] = useState("");

  const [users, setUsers] = useState<User[]>([]);
  const [awardedIds, setAwardedIds] = useState<Map<string, number>>(new Map());

  const [loading, setLoading] = useState(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [examList, userList] = await Promise.all([
        listExams(),
        listUsers(),
      ]);
      setExams(examList);
      setUsers(userList);
      setSelectedExamId((prev) => prev || examList[0]?.id || "");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "ডেটা লোড করা যায়নি");
    } finally {
      setLoading(false);
    }
  }, []);

  const loadExamDetail = useCallback(async (examId: string) => {
    if (!examId) {
      setAwardedIds(new Map());
      return;
    }
    try {
      const detail = await getExam(examId);
      setAwardedIds(new Map(detail.checkedBy.map((u) => [u.id, u.passes])));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "পরীক্ষা লোড করা যায়নি");
    }
  }, []);

  useEffect(() => {
    if (!keyVerified) return;
    void loadData();
  }, [keyVerified, loadData]);

  useEffect(() => {
    if (!keyVerified || !selectedExamId) return;
    void loadExamDetail(selectedExamId);
  }, [keyVerified, selectedExamId, loadExamDetail]);

  function handleVerify(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (adminKey.trim().length === 0) {
      setError("অ্যাডমিন কী দিন");
      return;
    }
    setError(null);
    setKeyVerified(true);
  }

  async function handleToggle(userId: string) {
    if (!selectedExamId) return;
    setTogglingId(userId);
    setError(null);
    try {
      await toggleAward(adminKey.trim(), selectedExamId, userId);
      setAwardedIds((prev) => {
        const next = new Map(prev);
        next.set(userId, (next.get(userId) ?? 0) + 1);
        return next;
      });
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : "পয়েন্ট পরিবর্তন করা যায়নি"
      );
    } finally {
      setTogglingId(null);
    }
  }

  // ---- Step 1: admin key ----
  if (!keyVerified) {
    return (
      <form
        onSubmit={handleVerify}
        className="mx-auto flex max-w-sm animate-fade-in-up flex-col gap-5 rounded-2xl border border-slate-200/80 bg-white/80 p-7 shadow-lg shadow-indigo-100/50 backdrop-blur"
      >
        <div className="text-center">
          <span className="mb-3 inline-flex h-16 w-16 animate-pulse-glow items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 text-3xl shadow-lg shadow-indigo-200">
            🔐
          </span>
          <h1 className="text-xl font-bold text-slate-900">পয়েন্ট প্রদান</h1>
          <p className="mt-1 text-sm text-slate-500">
            অ্যাডমিন কী দিয়ে প্রবেশ করুন। কী কোথাও সংরক্ষণ করা হয় না।
          </p>
        </div>
        <input
          type="password"
          value={adminKey}
          onChange={(e) => setAdminKey(e.target.value)}
          placeholder="অ্যাডমিন কী"
          autoComplete="off"
          className="w-full rounded-xl border border-slate-300 bg-white/90 px-4 py-3 text-sm outline-none transition-all duration-200 placeholder:text-slate-400 focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100"
        />
        {error && (
          <p className="animate-scale-in rounded-xl bg-red-50 px-4 py-2.5 text-sm text-red-600 ring-1 ring-red-100">
            ⚠️ {error}
          </p>
        )}
        <button
          type="submit"
          className="w-full rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-200 transition-all duration-200 hover:shadow-xl hover:shadow-indigo-300 active:scale-[0.98]"
        >
          প্রবেশ করুন →
        </button>
      </form>
    );
  }

  // ---- Step 2: exam + users ----
  return (
    <div className="animate-fade-in flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">🎯 পয়েন্ট প্রদান</h1>
          <p className="mt-0.5 text-xs text-slate-400">
            প্রতিটি ক্লিকে ইউজারের পাস কাউন্ট ১ করে বাড়বে
          </p>
        </div>
        <button
          onClick={() => {
            setKeyVerified(false);
            setExams([]);
            setUsers([]);
            setAwardedIds(new Map());
            setSelectedExamId("");
          }}
          className="rounded-lg border border-slate-200 bg-white/80 px-3 py-1.5 text-xs text-slate-500 transition-all duration-200 hover:border-red-200 hover:bg-red-50 hover:text-red-600 active:scale-95"
        >
          কী বদলান
        </button>
      </div>

      {error && (
        <div className="animate-scale-in rounded-2xl bg-red-50 p-4 text-sm text-red-600 ring-1 ring-red-100">
          ⚠️ {error}
          <button
            onClick={() => void loadData()}
            className="ml-3 font-medium underline hover:no-underline"
          >
            আবার চেষ্টা করুন
          </button>
        </div>
      )}

      {loading && (
        <div className="flex flex-col gap-3">
          <div className="skeleton h-12 w-full rounded-xl" />
          {[1, 2, 3, 4].map((n) => (
            <div
              key={n}
              className="flex items-center gap-3 rounded-xl border border-slate-200/80 bg-white/80 px-4 py-3"
            >
              <div className="skeleton h-5 w-24" />
              <div className="skeleton ml-auto h-8 w-20 rounded-lg" />
            </div>
          ))}
        </div>
      )}

      {!loading && exams.length === 0 && (
        <div className="animate-scale-in rounded-2xl border border-dashed border-slate-300 bg-white/60 p-10 text-center">
          <span className="mb-2 block text-3xl">📭</span>
          <p className="text-sm text-slate-500">
            কোনো পরীক্ষা নেই — আগে অ্যাডমিন পেজ থেকে তৈরি করুন।
          </p>
        </div>
      )}

      {!loading && exams.length > 0 && (
        <>
          <div>
            <label
              htmlFor="examSelect"
              className="mb-1.5 block text-sm font-medium text-slate-700"
            >
              পরীক্ষা নির্বাচন করুন
            </label>
            <select
              id="examSelect"
              value={selectedExamId}
              onChange={(e) => setSelectedExamId(e.target.value)}
              className="w-full cursor-pointer rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition-all duration-200 focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100"
            >
              {exams.map((exam) => (
                <option key={exam.id} value={exam.id}>
                  {exam.title} ({exam.passedCount}টি পাস)
                </option>
              ))}
            </select>
          </div>

          <section>
            <h2 className="mb-3 text-sm font-bold text-slate-700">
              👥 ইউজার তালিকা
            </h2>

            {users.length === 0 ? (
              <div className="animate-scale-in rounded-2xl border border-dashed border-slate-300 bg-white/60 p-8 text-center">
                <span className="mb-2 block text-3xl">🤷</span>
                <p className="text-sm text-slate-500">এখনো কোনো ইউজার নেই।</p>
              </div>
            ) : (
              <ul className="flex flex-col gap-2.5">
                {users.map((user, index) => {
                  const passes = awardedIds.get(user.id) ?? 0;
                  const busy = togglingId === user.id;
                  return (
                    <li
                      key={user.id}
                      className={`group flex animate-fade-in-up stagger-${Math.min(
                        index + 1,
                        5
                      )} items-center gap-3 rounded-xl border border-slate-200/80 bg-white/80 px-4 py-3.5 shadow-sm backdrop-blur transition-all duration-200 hover:border-indigo-200 hover:shadow-md`}
                    >
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 text-sm font-bold text-white shadow-sm shadow-indigo-200">
                        {user.username.charAt(0).toUpperCase()}
                      </span>
                      <span className="truncate text-sm font-semibold text-slate-800">
                        {user.username}
                      </span>
                      {passes > 0 && (
                        <span
                          key={passes}
                          className="count-pop shrink-0 rounded-full bg-gradient-to-r from-emerald-50 to-teal-50 px-2.5 py-1 text-xs font-bold text-emerald-700 ring-1 ring-emerald-200"
                        >
                          {passes}
                        </span>
                      )}
                      <button
                        onClick={() => void handleToggle(user.id)}
                        disabled={busy}
                        className="ml-auto shrink-0 rounded-lg bg-gradient-to-r from-indigo-600 to-violet-600 px-4 py-2 text-xs font-semibold text-white shadow-sm shadow-indigo-200 transition-all duration-200 hover:shadow-md hover:shadow-indigo-300 active:scale-90 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {busy ? (
                          <span className="flex items-center gap-1.5">
                            <span className="h-3 w-3 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                          </span>
                        ) : (
                          "+ Pass করান"
                        )}
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>
        </>
      )}
    </div>
  );
}
