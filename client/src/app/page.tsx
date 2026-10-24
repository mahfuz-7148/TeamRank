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

export default function HomePage() {
  const [user, setUser] = useState<SavedUser | null>(null);
  const [ready, setReady] = useState(false);

  const [exams, setExams] = useState<ExamSummary[] | null>(null);
  const [examsError, setExamsError] = useState<string | null>(null);

  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[] | null>(
    null
  );
  const [leaderboardError, setLeaderboardError] = useState<string | null>(null);

  // Load saved user (client only, SSR-safe)
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
      <div className="py-16 text-center text-sm text-slate-400">লোড হচ্ছে...</div>
    );
  }

  if (!user) {
    return <UsernameForm onSaved={handleUserSaved} />;
  }

  return (
    <div className="flex flex-col gap-8">
      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-bold">পরীক্ষাসমূহ</h2>
          <div className="flex items-center gap-2 text-sm">
            <span className="font-medium text-indigo-600">{user.username}</span>
            <button
              onClick={handleLogout}
              className="rounded-md border border-slate-300 px-2.5 py-1 text-xs text-slate-500 hover:bg-slate-100 transition-colors"
            >
              বদলান
            </button>
          </div>
        </div>

        {examsError && (
          <div className="rounded-xl bg-red-50 p-4 text-sm text-red-600">
            {examsError}
            <button
              onClick={() => void loadData()}
              className="ml-3 underline hover:no-underline"
            >
              আবার চেষ্টা করুন
            </button>
          </div>
        )}

        {!examsError && exams === null && (
          <p className="py-6 text-center text-sm text-slate-400">লোড হচ্ছে...</p>
        )}

        {exams !== null && exams.length === 0 && (
          <p className="rounded-xl bg-white border border-slate-200 p-6 text-center text-sm text-slate-500">
            এখনো কোনো পরীক্ষা তৈরি হয়নি। অ্যাডমিন পেজ থেকে তৈরি করুন।
          </p>
        )}

        {exams !== null && exams.length > 0 && (
          <div className="flex flex-col gap-3">
            {exams.map((exam) => (
              <ExamCard key={exam.id} exam={exam} />
            ))}
          </div>
        )}
      </section>

      <section>
        <h2 className="mb-3 text-lg font-bold">🏆 লিডারবোর্ড</h2>

        {leaderboardError && (
          <div className="rounded-xl bg-red-50 p-4 text-sm text-red-600">
            {leaderboardError}
            <button
              onClick={() => void loadData()}
              className="ml-3 underline hover:no-underline"
            >
              আবার চেষ্টা করুন
            </button>
          </div>
        )}

        {!leaderboardError && leaderboard === null && (
          <p className="py-6 text-center text-sm text-slate-400">লোড হচ্ছে...</p>
        )}

        {leaderboard !== null && (
          <Leaderboard entries={leaderboard} currentUserId={user.id} />
        )}
      </section>
    </div>
  );
}
