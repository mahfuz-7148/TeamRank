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
  const [awardedIds, setAwardedIds] = useState<Set<string>>(new Set());

  const [loading, setLoading] = useState(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Load exams + users once the admin key is verified
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

  // Load passed users of the selected exam
  const loadExamDetail = useCallback(async (examId: string) => {
    if (!examId) {
      setAwardedIds(new Set());
      return;
    }
    try {
      const detail = await getExam(examId);
      setAwardedIds(new Set(detail.checkedBy.map((u) => u.id)));
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
      const result = await toggleAward(adminKey.trim(), selectedExamId, userId);
      setAwardedIds((prev) => {
        const next = new Set(prev);
        if (result.passed) {
          next.add(userId);
        } else {
          next.delete(userId);
        }
        return next;
      });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "পয়েন্ট পরিবর্তন করা যায়নি");
    } finally {
      setTogglingId(null);
    }
  }

  // ---- Step 1: admin key ----
  if (!keyVerified) {
    return (
      <form
        onSubmit={handleVerify}
        className="mx-auto flex max-w-sm flex-col gap-4 rounded-xl bg-white border border-slate-200 p-5 shadow-sm"
      >
        <div>
          <h1 className="text-xl font-bold">পয়েন্ট প্রদান</h1>
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
          className="w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
        />
        {error && (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
            {error}
          </p>
        )}
        <button
          type="submit"
          className="rounded-lg bg-indigo-600 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 transition-colors"
        >
          প্রবেশ করুন
        </button>
      </form>
    );
  }

  // ---- Step 2: exam + users ----
  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">পয়েন্ট প্রদান</h1>
        <button
          onClick={() => {
            setKeyVerified(false);
            setExams([]);
            setUsers([]);
            setAwardedIds(new Set());
            setSelectedExamId("");
          }}
          className="rounded-md border border-slate-300 px-2.5 py-1 text-xs text-slate-500 hover:bg-slate-100 transition-colors"
        >
          কী বদলান
        </button>
      </div>

      {error && (
        <div className="rounded-xl bg-red-50 p-4 text-sm text-red-600">
          {error}
          <button
            onClick={() => void loadData()}
            className="ml-3 underline hover:no-underline"
          >
            আবার চেষ্টা করুন
          </button>
        </div>
      )}

      {loading && (
        <p className="py-6 text-center text-sm text-slate-400">লোড হচ্ছে...</p>
      )}

      {!loading && exams.length === 0 && (
        <p className="rounded-xl bg-white border border-slate-200 p-6 text-center text-sm text-slate-500">
          কোনো পরীক্ষা নেই — আগে অ্যাডমিন পেজ থেকে তৈরি করুন।
        </p>
      )}

      {!loading && exams.length > 0 && (
        <>
          <div>
            <label
              htmlFor="examSelect"
              className="mb-1 block text-sm font-medium text-slate-700"
            >
              পরীক্ষা নির্বাচন করুন
            </label>
            <select
              id="examSelect"
              value={selectedExamId}
              onChange={(e) => setSelectedExamId(e.target.value)}
              className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
            >
              {exams.map((exam) => (
                <option key={exam.id} value={exam.id}>
                  {exam.title} ({exam.passedCount} জন পাস)
                </option>
              ))}
            </select>
          </div>

          <section>
            <h2 className="mb-3 text-sm font-semibold text-slate-700">
              ইউজার তালিকা
            </h2>

            {users.length === 0 ? (
              <p className="rounded-xl bg-white border border-slate-200 p-6 text-center text-sm text-slate-500">
                এখনো কোনো ইউজার নেই।
              </p>
            ) : (
              <ul className="flex flex-col gap-2">
                {users.map((user) => {
                  const passed = awardedIds.has(user.id);
                  const busy = togglingId === user.id;
                  return (
                    <li
                      key={user.id}
                      className="flex items-center gap-3 rounded-xl bg-white border border-slate-200 px-4 py-3"
                    >
                      <span className="font-medium text-sm text-slate-800 truncate">
                        {user.username}
                      </span>
                      <button
                        onClick={() => void handleToggle(user.id)}
                        disabled={busy}
                        className={`ml-auto rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-colors disabled:opacity-60 ${
                          passed
                            ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-200"
                            : "bg-indigo-600 text-white hover:bg-indigo-700"
                        }`}
                      >
                        {busy
                          ? "..."
                          : passed
                            ? "✅ Passed"
                            : "Pass করান"}
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
