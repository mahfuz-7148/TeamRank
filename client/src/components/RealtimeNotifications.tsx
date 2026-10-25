"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { getSocket } from "@/lib/socket";
import type { ExamResponseEvent } from "@/types";

interface ToastEvent extends ExamResponseEvent {
  key: string;
}

const DISMISS_AFTER_MS = 8000;
const MAX_TOASTS = 3;

export default function RealtimeNotifications() {
  const [toasts, setToasts] = useState<ToastEvent[]>([]);
  const timers = useRef<number[]>([]);

  useEffect(() => {
    const socket = getSocket();

    function dismiss(key: string) {
      setToasts((prev) => prev.filter((toast) => toast.key !== key));
    }

    function handleResponse(event: ExamResponseEvent) {
      const key = `${event.examId}:${event.userId}:${event.at}`;
      setToasts((prev) => [
        ...prev.filter((toast) => toast.key !== key).slice(-(MAX_TOASTS - 1)),
        { ...event, key },
      ]);

      const timer = window.setTimeout(() => dismiss(key), DISMISS_AFTER_MS);
      timers.current.push(timer);
    }

    socket.on("exam:response", handleResponse);

    return () => {
      socket.off("exam:response", handleResponse);
      timers.current.forEach((timer) => window.clearTimeout(timer));
      timers.current = [];
    };
  }, []);

  function dismiss(key: string) {
    setToasts((prev) => prev.filter((toast) => toast.key !== key));
  }

  if (toasts.length === 0) return null;

  return (
    <div
      aria-live="polite"
      className="pointer-events-none fixed inset-x-3 bottom-3 z-[100] flex flex-col items-stretch gap-2 sm:inset-x-auto sm:bottom-5 sm:right-5 sm:w-[22rem]"
    >
      {toasts.map((toast) => (
        <div
          key={toast.key}
          className="pointer-events-auto flex animate-fade-in-up items-start gap-3 rounded-2xl border border-indigo-100 bg-white/95 p-3.5 shadow-xl shadow-indigo-200/50 backdrop-blur"
        >
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 text-lg text-white shadow-md shadow-indigo-200">
            🙋
          </span>
          <Link
            href={`/exam/${toast.examId}`}
            className="min-w-0 flex-1 transition-opacity hover:opacity-80"
          >
            <p className="truncate text-sm font-semibold text-slate-900">
              {toast.username} উত্তর দিতে চেয়েছে
            </p>
            <p className="mt-0.5 truncate text-xs text-slate-500">
              📝 {toast.examTitle}
            </p>
            <p className="mt-1 text-[11px] font-bold text-indigo-600">
              এখনই দেখুন →
            </p>
          </Link>
          <button
            type="button"
            onClick={() => dismiss(toast.key)}
            aria-label="নোটিফিকেশন বন্ধ করুন"
            className="shrink-0 rounded-lg p-1 text-lg leading-none text-slate-300 transition-colors hover:bg-slate-100 hover:text-slate-500"
          >
            ×
          </button>
        </div>
      ))}
    </div>
  );
}
