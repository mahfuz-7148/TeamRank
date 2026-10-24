"use client";

import Link from "next/link";
import type { ExamSummary } from "@/types";

interface ExamCardProps {
  exam: ExamSummary;
}

export default function ExamCard({ exam }: ExamCardProps) {
  const date = new Date(exam.createdAt).toLocaleDateString("bn-BD", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <Link
      href={`/exam/${exam.id}`}
      className="block rounded-xl bg-white border border-slate-200 p-5 shadow-sm hover:border-indigo-300 hover:shadow-md transition-all"
    >
      <div className="flex items-start justify-between gap-3">
        <h3 className="font-semibold text-slate-900">{exam.title}</h3>
        <span className="shrink-0 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
          ✅ {exam.passedCount} জন পাস
        </span>
      </div>

      {exam.content && (
        <p className="mt-2 line-clamp-2 text-sm text-slate-500">
          {exam.content}
        </p>
      )}

      <p className="mt-3 text-xs text-slate-400">📅 {date}</p>
    </Link>
  );
}
