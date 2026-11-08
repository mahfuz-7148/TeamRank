"use client";

import { useCallback, useEffect, useState } from "react";
import ConfirmDialog from "@/components/ConfirmDialog";
import ExamCard from "@/components/ExamCard";
import Leaderboard from "@/components/Leaderboard";
import { useAuth } from "@/components/AuthProvider";
import {
  ApiError,
  deleteExam,
  getLeaderboard,
  listExams,
} from "@/lib/api";
import type { ExamSummary, LeaderboardEntry } from "@/types";

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
  const { user } = useAuth();

  const [exams, setExams] = useState<ExamSummary[] | null>(null);
  const [examsError, setExamsError] = useState<string | null>(null);

  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[] | null>(
    null
  );
  const [leaderboardError, setLeaderboardError] = useState<string | null>(null);

  // Exam delete flow (admin key required, never stored)
  const [examToDelete, setExamToDelete] = useState<ExamSummary | null>(null);
  const [deleteAdminKey, setDeleteAdminKey] = useState("");
  const [deletingExam, setDeletingExam] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

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

  function openDeleteDialog(exam: ExamSummary) {
    setExamToDelete(exam);
    setDeleteAdminKey("");
    setDeleteError(null);
    setNotice(null);
  }

  function closeDeleteDialog() {
    if (deletingExam) return;
    setExamToDelete(null);
    setDeleteAdminKey("");
    setDeleteError(null);
  }

  async function handleDeleteExam() {
    if (!examToDelete) return;
    if (deleteAdminKey.trim().length === 0) {
      setDeleteError("অ্যাডমিন কী দিন — শুধু অ্যাডমিন পরীক্ষা ডিলিট করতে পারেন");
      return;
    }

    setDeletingExam(true);
    setDeleteError(null);
    try {
      await deleteExam(deleteAdminKey.trim(), examToDelete.id);
      setExams((prev) =>
        prev ? prev.filter((e) => e.id !== examToDelete.id) : prev
      );
      setNotice(`🗑️ "${examToDelete.title}" পরীক্ষাটি ডিলিট করা হয়েছে`);
      setExamToDelete(null);
      setDeleteAdminKey("");
      void loadData();
    } catch (err) {
      setDeleteError(
        err instanceof ApiError ? err.message : "পরীক্ষা ডিলিট করা যায়নি"
      );
    } finally {
      setDeletingExam(false);
    }
  }

  // AuthGate guarantees a user; this keeps TypeScript happy.
  if (!user) return null;

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
        </div>

        {notice && (
          <div className="mb-4 animate-scale-in rounded-2xl bg-emerald-50 p-4 text-sm text-emerald-700 ring-1 ring-emerald-100">
            {notice}
          </div>
        )}

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
              <ExamCard
                key={exam.id}
                exam={exam}
                index={index}
                onDelete={openDeleteDialog}
              />
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

      {/* Exam delete confirmation — admin permission required */}
      <ConfirmDialog
        open={examToDelete !== null}
        title="পরীক্ষা ডিলিট করবেন?"
        description={
          examToDelete
            ? `"${examToDelete.title}" পরীক্ষাটি স্থায়ীভাবে মুছে যাবে। এর সাথে এই পরীক্ষার সব পাস/পয়েন্টও মুছে যাবে। এটি ফিরিয়ে আনা যাবে না।`
            : ""
        }
        confirmLabel="হ্যাঁ, ডিলিট করুন"
        cancelLabel="না, থাক"
        destructive
        loading={deletingExam}
        confirmDisabled={deleteAdminKey.trim().length === 0}
        onConfirm={() => void handleDeleteExam()}
        onCancel={closeDeleteDialog}
      >
        <label
          htmlFor="deleteAdminKey"
          className="mb-1.5 block text-sm font-medium text-slate-700"
        >
          🔑 অ্যাডমিন কী{" "}
          <span className="font-normal text-slate-400">
            (শুধু অ্যাডমিন ডিলিট করতে পারবেন)
          </span>
        </label>
        <input
          id="deleteAdminKey"
          type="password"
          value={deleteAdminKey}
          onChange={(e) => setDeleteAdminKey(e.target.value)}
          placeholder="সার্ভারের ADMIN_KEY"
          autoComplete="off"
          disabled={deletingExam}
          autoFocus
          className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm outline-none transition-all duration-200 placeholder:text-slate-400 focus:border-red-400 focus:ring-4 focus:ring-red-100 disabled:opacity-60"
        />
        {deleteError && (
          <p className="mt-2 animate-scale-in rounded-lg bg-red-50 px-3 py-2 text-xs text-red-600 ring-1 ring-red-100">
            ⚠️ {deleteError}
          </p>
        )}
      </ConfirmDialog>
    </div>
  );
}
