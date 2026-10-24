"use client";

import type { LeaderboardEntry } from "@/types";

const MEDALS = ["🥇", "🥈", "🥉"];

interface LeaderboardProps {
  entries: LeaderboardEntry[];
  currentUserId: string | null;
}

export default function Leaderboard({
  entries,
  currentUserId,
}: LeaderboardProps) {
  if (entries.length === 0) {
    return (
      <p className="rounded-xl bg-white border border-slate-200 p-5 text-sm text-slate-500 text-center">
        এখনো কোনো ইউজার নেই।
      </p>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl bg-white border border-slate-200 shadow-sm">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-slate-200 bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
            <th className="px-4 py-3">#</th>
            <th className="px-4 py-3">ইউজার</th>
            <th className="px-4 py-3 text-right">পয়েন্ট</th>
          </tr>
        </thead>
        <tbody>
          {entries.map((entry, index) => {
            const isMe = currentUserId === entry.id;
            return (
              <tr
                key={entry.id}
                className={`border-b border-slate-100 last:border-0 ${
                  isMe ? "bg-indigo-50" : ""
                }`}
              >
                <td className="px-4 py-3 font-medium text-slate-500">
                  {MEDALS[index] ?? index + 1}
                </td>
                <td className="px-4 py-3 font-medium text-slate-800">
                  {entry.username}
                  {isMe && (
                    <span className="ml-2 rounded-full bg-indigo-100 px-2 py-0.5 text-xs text-indigo-700">
                      আপনি
                    </span>
                  )}
                </td>
                <td className="px-4 py-3 text-right font-bold text-indigo-600">
                  {entry.points}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
