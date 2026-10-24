"use client";

import Link from "next/link";
import type { ExamSummary } from "@/types";

interface ExamCardProps {
  exam: ExamSummary;
  index?: number;
}

export default function ExamCard({ exam, index = 0 }: ExamCardProps) {
  const date = new Date(exam.createdAt).toLocaleDateString("bn-BD", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const staggerClass = `stagger-${Math.min(index + 1, 5)}`;

  return (
    <Link
      href={`/exam/${exam.id}`}
      className={`group block animate-fade-in-up ${staggerClass}`}
    >
      <div className="relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white/80 p-5 shadow-sm backdrop-blur transition-all duration-300 hover:-translate-y-1 hover:border-indigo-200 hover:shadow-xl hover:shadow-indigo-100/80 active:translate-y-0 active:scale-[0.99]">
        {/* Gradient accent line on hover */}
        <div className="absolute inset-x-0 top-0 h-1 origin-left scale-x-0 bg-gradient-to-r from-indigo-500 via-violet-500 to-fuchsia-500 transition-transform duration-300 group-hover:scale-x-100" />

        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 text-lg shadow-md shadow-indigo-200/70 transition-transform duration-300 group-hover:rotate-6 group-hover:scale-110">
              📝
            </span>
            <div>
              <h3 className="font-semibold text-slate-900 transition-colors group-hover:text-indigo-700">
                {exam.title}
              </h3>
              <p className="mt-0.5 text-xs text-slate-400">📅 {date}</p>
            </div>
          </div>
          <span className="shrink-0 rounded-full bg-gradient-to-r from-emerald-50 to-teal-50 px-3 py-1 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-200/70">
            ✅ {exam.passedCount} জন
          </span>
        </div>

        {exam.content && (
          <p className="mt-3 line-clamp-2 text-sm leading-relaxed text-slate-500">
            {exam.content}
          </p>
        )}

        <div className="mt-4 flex items-center justify-between">
          <span className="text-xs font-medium text-slate-400">
            বিস্তারিত দেখুন
          </span>
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-indigo-50 text-indigo-500 transition-all duration-300 group-hover:translate-x-1 group-hover:bg-indigo-100">
            →
          </span>
        </div>
      </div>
    </Link>
  );
}
