"use client";

import { useEffect, useState } from "react";
import type { LeaderboardEntry } from "@/types";

const MEDALS = ["🥇", "🥈", "🥉"];

const RANK_STYLES = [
  "from-amber-100 to-yellow-50 ring-amber-300",
  "from-slate-200 to-slate-50 ring-slate-300",
  "from-orange-100 to-amber-50 ring-orange-300",
];

interface LeaderboardProps {
  entries: LeaderboardEntry[];
  currentUserId: string | null;
}

export default function Leaderboard({
  entries,
  currentUserId,
}: LeaderboardProps) {
  // Re-trigger pop animation when points change
  const [popKey, setPopKey] = useState(0);
  const pointsSignature = entries.map((e) => e.points).join(",");
  useEffect(() => {
    setPopKey((k) => k + 1);
  }, [pointsSignature]);

  if (entries.length === 0) {
    return (
      <div className="animate-scale-in rounded-2xl border border-dashed border-slate-300 bg-white/60 p-8 text-center">
        <span className="mb-2 block text-3xl">🏁</span>
        <p className="text-sm text-slate-500">
          এখনো কোনো ইউজার নেই — প্রথম প্রতিযোগী হোন!
        </p>
      </div>
    );
  }

  const maxPoints = Math.max(...entries.map((e) => e.points), 1);

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white/80 shadow-sm backdrop-blur">
      <div className="border-b border-slate-100 bg-gradient-to-r from-indigo-50/80 via-violet-50/60 to-transparent px-5 py-3.5">
        <h3 className="flex items-center gap-2 text-sm font-bold text-slate-700">
          <span className="animate-trophy-bounce inline-block">🏆</span>
          লিডারবোর্ড
        </h3>
      </div>

      <ul key={popKey} className="divide-y divide-slate-100/80">
        {entries.map((entry, index) => {
          const isMe = currentUserId === entry.id;
          const isTop3 = index < 3;
          const rankStyle = isTop3 ? RANK_STYLES[index] : undefined;
          const pct = Math.round((entry.points / maxPoints) * 100);

          return (
            <li
              key={entry.id}
              className={`group relative animate-fade-in-up stagger-${Math.min(
                index + 1,
                5
              )} transition-colors duration-200 ${
                isMe ? "bg-indigo-50/70" : "hover:bg-slate-50/80"
              }`}
            >
              {isMe && (
                <span className="absolute inset-y-0 left-0 w-1 bg-gradient-to-b from-indigo-500 to-violet-500" />
              )}
              <div className="flex items-center gap-3 px-5 py-3.5">
                {/* Rank */}
                <span
                  className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-sm font-bold ring-1 transition-transform duration-200 group-hover:scale-110 ${
                    rankStyle
                      ? `bg-gradient-to-br ${rankStyle}`
                      : "bg-slate-50 text-slate-500 ring-slate-200"
                  }`}
                >
                  {isTop3 ? (
                    <span className="text-lg">{MEDALS[index]}</span>
                  ) : (
                    index + 1
                  )}
                </span>

                {/* Name + progress */}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="truncate font-semibold text-slate-800">
                      {entry.username}
                    </span>
                    {isMe && (
                      <span className="rounded-full bg-indigo-100 px-2 py-0.5 text-[10px] font-bold text-indigo-700">
                        আপনি
                      </span>
                    )}
                  </div>
                  <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-slate-100">
                    <div
                      className={`h-full rounded-full transition-all duration-700 ease-out ${
                        isTop3
                          ? "bg-gradient-to-r from-amber-400 to-orange-400"
                          : "bg-gradient-to-r from-indigo-400 to-violet-400"
                      }`}
                      style={{ width: `${Math.max(pct, 4)}%` }}
                    />
                  </div>
                </div>

                {/* Points */}
                <div className="shrink-0 text-right">
                  <span
                    key={entry.points}
                    className="count-pop inline-block text-lg font-extrabold tabular-nums text-indigo-600"
                  >
                    {entry.points}
                  </span>
                  <span className="ml-1 text-xs font-medium text-slate-400">
                    পয়েন্ট
                  </span>
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
