"use client";

import type { ExamDetail } from "@/types";

interface PassedListProps {
  users: ExamDetail["checkedBy"];
}

export default function PassedList({ users }: PassedListProps) {
  if (users.length === 0) {
    return (
      <div className="animate-scale-in rounded-2xl border border-dashed border-slate-300 bg-white/60 p-8 text-center">
        <span className="mb-2 block text-3xl">⏳</span>
        <p className="text-sm text-slate-500">
          এখনো কেউ এই পরীক্ষায় পাস করেনি।
        </p>
      </div>
    );
  }

  return (
    <ul className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
      {users.map((user, index) => (
        <li
          key={user.id}
          className={`group flex animate-fade-in-up stagger-${Math.min(
            index + 1,
            5
          )} items-center gap-3 rounded-xl border border-slate-200/80 bg-white/80 px-4 py-3 shadow-sm backdrop-blur transition-all duration-200 hover:-translate-y-0.5 hover:border-emerald-200 hover:shadow-md`}
        >
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 text-sm font-bold text-white shadow-sm shadow-emerald-200 transition-transform duration-300 group-hover:scale-110">
            {user.username.charAt(0).toUpperCase()}
          </span>
          <span className="truncate font-medium text-slate-800">
            {user.username}
          </span>
          <span className="ml-auto shrink-0 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-200/70">
            ✅ {user.passes > 1 ? `${user.passes} বার` : "পাস"}
          </span>
        </li>
      ))}
    </ul>
  );
}
