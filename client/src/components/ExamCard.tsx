"use client";

import Link from "next/link";
import type { ExamSummary } from "@/types";

interface ExamCardProps {
  exam: ExamSummary;
  index?: number;
  onDelete: (exam: ExamSummary) => void;
}

export default function ExamCard({ exam, index = 0, onDelete }: ExamCardProps) {
  const date = new Date(exam.createdAt).toLocaleDateString("bn-BD", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const staggerClass = `stagger-${Math.min(index + 1, 5)}`;

  return (
    <div
      className={`group relative animate-fade-in-up ${staggerClass} overflow-hidden rounded-2xl border border-slate-200/80 bg-white/80 shadow-sm backdrop-blur transition-all duration-300 hover:-translate-y-1 hover:border-indigo-200 hover:shadow-xl hover:shadow-indigo-100/80`}
    >
      {/* Gradient accent line on hover */}
      <div className="absolute inset-x-0 top-0 h-1 origin-left scale-x-0 bg-gradient-to-r from-indigo-500 via-violet-500 to-fuchsia-500 transition-transform duration-300 group-hover:scale-x-100" />

      <Link href={`/exam/${exam.id}`} className="block p-5 pr-16">
        <div className="flex items-start gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 text-lg shadow-md shadow-indigo-200/70 transition-transform duration-300 group-hover:rotate-6 group-hover:scale-110">
            📝
          </span>
          <div className="min-w-0">
            <h3 className="truncate font-semibold text-slate-900 transition-colors group-hover:text-indigo-700">
              {exam.title}
            </h3>
            <p className="mt-0.5 flex flex-wrap items-center gap-2 text-xs text-slate-400">
              <span>📅 {date}</span>
              <span className="inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-emerald-50 to-teal-50 px-2 py-0.5 font-semibold text-emerald-700 ring-1 ring-emerald-200/70">
                ✅ {exam.passedCount} পাস
              </span>
              <span className="inline-flex items-center gap-1 rounded-full bg-slate-50 px-2 py-0.5 font-semibold text-slate-600 ring-1 ring-slate-200">
                👥 {exam.uniqueUsers} জন
              </span>
            </p>
          </div>
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
      </Link>

      {/* Delete — admin permission required (checked by server) */}
      <button
        type="button"
        onClick={() => onDelete(exam)}
        aria-label={`${exam.title} পরীক্ষাটি ডিলিট করুন`}
        title="পরীক্ষা ডিলিট করুন (অ্যাডমিন)"
        className="absolute right-3 top-3 z-10 rounded-lg border border-slate-200 bg-white/90 p-2 text-slate-400 opacity-100 shadow-sm backdrop-blur transition-all duration-200 hover:border-red-200 hover:bg-red-50 hover:text-red-600 active:scale-90 focus:opacity-100 focus:outline-none focus:ring-2 focus:ring-red-200 sm:opacity-0 sm:group-hover:opacity-100"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={1.8}
          strokeLinecap="round"
          strokeLinejoin="round"
          className="h-4 w-4"
          aria-hidden="true"
        >
          <path d="M3 6h18" />
          <path d="M8 6V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2" />
          <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
          <path d="M10 11v6M14 11v6" />
        </svg>
      </button>
    </div>
  );
}
