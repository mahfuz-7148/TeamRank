"use client";

import { useCallback, useEffect, useState } from "react";
import ExamCard from "@/components/ExamCard";
import Leaderboard from "@/components/Leaderboard";
import UsernameForm from "@/components/UsernameForm";
import { ApiError, getLeaderboard, listExams } from "@/lib/api";
import { clearSavedUser, getSavedUser } from "@/lib/user";
import type { ExamSummary, LeaderboardEntry } from "@/types";

interface SavedUser {
  id: string;
  username: string;
}

function ExamSkeleton() {
  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white/80 p-5">
      <div className="flex items-center gap-3">
        <div className="skeleton h-11 w-11 rounded-xl" />
        <div className="flex-1 space-y-2">
          <div className="skeleton h-4 w-1/3" />
          <div className="skeleton h-3 w-1/4" />
        </div>
        <div className="skeleton h-6 w-16 rounded-full" />
      </div>
      <div className="skeleton mt-4 h-3 w-3/4" />
    </div>
  );
}

export default function HomePage() {
  const [user, setUser] = useState<SavedUser | null>(null);
  const [ready, setReady] = useState(false);

  const [exams, setExams] = useState<ExamSummary[] | null>(null);
  const [examsError, setExamsError] = useState<string | null>(null);

  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[] | null>(
    null
  );
  const [leaderboardError, setLeaderboardError] = useState<string | null>(null);

  useEffect(() => {
    setUser(getSavedUser());
    setReady(true);
  }, []);

  const loadData = useCallback(async () => {
    try {
      const data = await listExams();
      setExams(data);
      setExamsError(null);
    } catch (err) {
      setExamsError(
        err instanceof ApiError ? err.message : "পরীক্ষা লোড করা যায়নি"
      );
    }

    try {
      const data = await getLeaderboard();
      setLeaderboard(data);
      setLeaderboardError(null);
    } catch (err) {
      setLeaderboardError(
        err instanceof ApiError ? err.message : "লিডারবোর্ড লোড করা যায়নি"
      );
    }
  }, []);

  useEffect(() => {
    if (!user) return;
    void loadData();
  }, [user, loadData]);

  function handleUserSaved(saved: SavedUser) {
    setUser(saved);
  }

  function handleLogout() {
    clearSavedUser();
    setUser(null);
  }

  if (!ready) {
    return (
      <div className="flex items-center justify-center py-24">
        <span className="h-10 w-10 animate-spin rounded-full border-4 border-indigo-100 border-t-indigo-500" />
      </div>
    );
  }

  if (!user) {
    return <UsernameForm onSaved={handleUserSaved} />;
  }

  return (
    <div className="flex flex-col gap-10">
      <section>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-lg font-bold text-slate-900">
            📝 পরীক্ষাসমূহ
            {exams !== null && (
              <span className="rounded-full bg-indigo-100 px-2.5 py-0.5 text-xs font-bold text-indigo-700">
                {exams.length}
              </span>
            )}
          </h2>
          <div className="flex items-center gap-2.5 text-sm">
            <span className="flex items-center gap-1.5 rounded-full bg-white/80 px-3 py-1.5 font-medium text-indigo-700 ring-1 ring-indigo-100">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 text-[10px] font-bold text-white">
                {user.username.charAt(0).toUpperCase()}
              </span>
              {user.username}
            </span>
            <button
              onClick={handleLogout}
              className="rounded-lg border border-slate-200 bg-white/80 px-2.5 py-1.5 text-xs text-slate-500 transition-all duration-200 hover:border-red-200 hover:bg-red-50 hover:text-red-600 active:scale-95"
            >
              বদলান
            </button>
          </div>
        </div>

        {examsError && (
          <div className="animate-scale-in rounded-2xl bg-red-50 p-4 text-sm text-red-600 ring-1 ring-red-100">
            ⚠️ {examsError}
            <button
              onClick={() => void loadData()}
              className="ml-3 font-medium underline hover:no-underline"
            >
              আবার চেষ্টা করুন
            </button>
          </div>
        )}

        {!examsError && exams === null && (
          <div className="flex flex-col gap-3">
            <ExamSkeleton />
            <ExamSkeleton />
            <ExamSkeleton />
          </div>
        )}

        {exams !== null && exams.length === 0 && (
          <div className="animate-scale-in rounded-2xl border border-dashed border-slate-300 bg-white/60 p-10 text-center">
            <span className="mb-2 block text-3xl">📭</span>
            <p className="text-sm text-slate-500">
              এখনো কোনো পরীক্ষা তৈরি হয়নি।
            </p>
            <p className="mt-1 text-xs text-slate-400">
              অ্যাডমিন পেজ থেকে প্রথম পরীক্ষাটি তৈরি করুন।
            </p>
          </div>
        )}

        {exams !== null && exams.length > 0 && (
          <div className="flex flex-col gap-3">
            {exams.map((exam, index) => (
              <ExamCard key={exam.id} exam={exam} index={index} />
            ))}
          </div>
        )}
      </section>

      <section>
        {leaderboardError && (
          <div className="animate-scale-in rounded-2xl bg-red-50 p-4 text-sm text-red-600 ring-1 ring-red-100">
            ⚠️ {leaderboardError}
            <button
              onClick={() => void loadData()}
              className="ml-3 font-medium underline hover:no-underline"
            >
              আবার চেষ্টা করুন
            </button>
          </div>
        )}

        {!leaderboardError && leaderboard === null && (
          <div className="rounded-2xl border border-slate-200/80 bg-white/80 p-5">
            <div className="skeleton mb-4 h-5 w-32" />
            <div className="space-y-3">
              {[1, 2, 3].map((n) => (
                <div key={n} className="flex items-center gap-3">
                  <div className="skeleton h-9 w-9 rounded-xl" />
                  <div className="skeleton h-4 flex-1" />
                  <div className="skeleton h-6 w-10" />
                </div>
              ))}
            </div>
          </div>
        )}

        {leaderboard !== null && (
          <div className="animate-fade-in">
            <Leaderboard entries={leaderboard} currentUserId={user.id} />
          </div>
        )}
      </section>
    </div>
  );
}
