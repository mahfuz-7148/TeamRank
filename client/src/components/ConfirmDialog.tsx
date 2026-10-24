"use client";

import { useEffect, type ReactNode } from "react";

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
  loading?: boolean;
  confirmDisabled?: boolean;
  children?: ReactNode;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = "নিশ্চিত করুন",
  cancelLabel = "বাতিল",
  destructive = false,
  loading = false,
  confirmDisabled = false,
  children,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  // Close on Escape
  useEffect(() => {
    if (!open) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape" && !loading) onCancel();
    }
    document.addEventListener("keydown", onKeyDown);
    // Prevent background scroll
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = prevOverflow;
    };
  }, [open, loading, onCancel]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-title"
    >
      {/* Backdrop */}
      <button
        type="button"
        aria-label="বন্ধ করুন"
        onClick={() => {
          if (!loading) onCancel();
        }}
        className="absolute inset-0 animate-fade-in cursor-default bg-slate-900/40 backdrop-blur-sm"
      />

      {/* Dialog */}
      <div className="relative w-full max-w-sm animate-scale-in rounded-2xl border border-slate-200/80 bg-white p-6 shadow-2xl shadow-slate-900/20">
        <div
          className={`mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl text-2xl ${
            destructive
              ? "bg-red-50 text-red-600 ring-1 ring-red-100"
              : "bg-indigo-50 text-indigo-600 ring-1 ring-indigo-100"
          }`}
        >
          {destructive ? "🗑️" : "❓"}
        </div>

        <h2
          id="confirm-title"
          className="text-center text-lg font-bold text-slate-900"
        >
          {title}
        </h2>
        <p className="mt-2 text-center text-sm leading-relaxed text-slate-500">
          {description}
        </p>

        {children && <div className="mt-4">{children}</div>}

        <div className="mt-6 flex gap-2.5">
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="flex-1 rounded-xl border border-slate-200 bg-white py-2.5 text-sm font-semibold text-slate-600 transition-all duration-200 hover:bg-slate-50 active:scale-95 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading || confirmDisabled}
            className={`flex-1 rounded-xl py-2.5 text-sm font-semibold text-white shadow-lg transition-all duration-200 active:scale-95 disabled:cursor-not-allowed disabled:opacity-70 ${
              destructive
                ? "bg-gradient-to-r from-red-500 to-rose-600 shadow-red-200 hover:shadow-xl hover:shadow-red-300"
                : "bg-gradient-to-r from-indigo-600 to-violet-600 shadow-indigo-200 hover:shadow-xl hover:shadow-indigo-300"
            }`}
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                অপেক্ষা করুন...
              </span>
            ) : (
              confirmLabel
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
