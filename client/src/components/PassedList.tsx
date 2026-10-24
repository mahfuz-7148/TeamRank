"use client";

import type { ExamDetail } from "@/types";

interface PassedListProps {
  users: ExamDetail["checkedBy"];
}

export default function PassedList({ users }: PassedListProps) {
  if (users.length === 0) {
    return (
      <p className="rounded-xl bg-white border border-slate-200 p-5 text-sm text-slate-500 text-center">
        এখনো কেউ এই পরীক্ষায় পাস করেনি।
      </p>
    );
  }

  return (
    <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2">
      {users.map((user) => (
        <li
          key={user.id}
          className="flex items-center gap-2 rounded-lg bg-white border border-slate-200 px-4 py-2.5 text-sm"
        >
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-xs text-emerald-700">
            {user.username.charAt(0).toUpperCase()}
          </span>
          <span className="font-medium text-slate-800 truncate">
            {user.username}
          </span>
          <span className="ml-auto text-xs text-emerald-600">✅ পাস</span>
        </li>
      ))}
    </ul>
  );
}
