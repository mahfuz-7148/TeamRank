"use client";

import type { ExamDetail } from "@/types";

interface ResponderListProps {
  users: ExamDetail["responders"];
}

export default function ResponderList({ users }: ResponderListProps) {
  if (users.length === 0) {
    return (
      <div className="animate-scale-in rounded-2xl border border-dashed border-slate-300 bg-white/60 p-6 text-center">
        <span className="mb-1.5 block text-2xl">🙋</span>
        <p className="text-sm text-slate-500">
          এখনো কেউ উত্তর দিতে আগ্রহ দেখায়নি।
        </p>
      </div>
    );
  }

  return (
    <ul className="flex flex-wrap gap-2">
      {users.map((user, index) => (
        <li
          key={user.id}
          className={`flex animate-fade-in-up stagger-${Math.min(
            index + 1,
            5
          )} items-center gap-2 rounded-full border border-indigo-100 bg-white/80 py-1.5 pl-1.5 pr-3.5 shadow-sm backdrop-blur transition-all duration-200 hover:-translate-y-0.5 hover:border-indigo-200 hover:shadow-md`}
        >
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-indigo-400 to-violet-500 text-xs font-bold text-white shadow-sm shadow-indigo-200">
            {user.username.charAt(0).toUpperCase()}
          </span>
          <span className="max-w-[10rem] truncate text-sm font-medium text-slate-700">
            {user.username}
          </span>
        </li>
      ))}
    </ul>
  );
}
