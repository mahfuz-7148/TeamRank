"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { ApiError, createExam } from "@/lib/api";

export default function AdminPage() {
  const [adminKey, setAdminKey] = useState("");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSuccess(null);

    if (adminKey.trim().length === 0) {
      setError("অ্যাডমিন কী দিন");
      return;
    }
    if (title.trim().length === 0) {
      setError("পরীক্ষার শিরোনাম দিন");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const exam = await createExam(
        adminKey.trim(),
        title.trim(),
        content.trim()
      );
      setSuccess(`✅ "${exam.title}" পরীক্ষাটি তৈরি হয়েছে`);
      setTitle("");
      setContent("");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "কিছু একটা সমস্যা হয়েছে");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="animate-fade-in-up mx-auto max-w-xl">
      <div className="mb-6 text-center">
        <span className="mb-3 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 text-3xl shadow-xl shadow-indigo-200">
          🛠️
        </span>
        <h1 className="text-2xl font-bold text-slate-900">
          নতুন পরীক্ষা তৈরি করুন
        </h1>
        <p className="mt-1.5 text-sm text-slate-500">
          শুধু অ্যাডমিন নতুন পরীক্ষা তৈরি করতে পারেন। কী কোথাও সংরক্ষণ করা হয় না।
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="rounded-2xl border border-slate-200/80 bg-white/80 p-6 shadow-lg shadow-indigo-100/50 backdrop-blur"
      >
        <div className="space-y-5">
          <div>
            <label
              htmlFor="adminKey"
              className="mb-1.5 block text-sm font-medium text-slate-700"
            >
              🔑 অ্যাডমিন কী
            </label>
            <input
              id="adminKey"
              type="password"
              value={adminKey}
              onChange={(e) => setAdminKey(e.target.value)}
              placeholder="সার্ভারের ADMIN_KEY"
              autoComplete="off"
              disabled={loading}
              className="w-full rounded-xl border border-slate-300 bg-white/90 px-4 py-3 text-sm outline-none transition-all duration-200 placeholder:text-slate-400 focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100 disabled:opacity-60"
            />
          </div>

          <div>
            <label
              htmlFor="title"
              className="mb-1.5 block text-sm font-medium text-slate-700"
            >
              শিরোনাম
            </label>
            <input
              id="title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="যেমন: বিষয়ভিত্তিক পরীক্ষা ১"
              maxLength={120}
              disabled={loading}
              className="w-full rounded-xl border border-slate-300 bg-white/90 px-4 py-3 text-sm outline-none transition-all duration-200 placeholder:text-slate-400 focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100 disabled:opacity-60"
            />
          </div>

          <div>
            <label
              htmlFor="content"
              className="mb-1.5 block text-sm font-medium text-slate-700"
            >
              বর্ণনা <span className="font-normal text-slate-400">(ঐচ্ছিক)</span>
            </label>
            <textarea
              id="content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="পরীক্ষা সম্পর্কে বিস্তারিত লিখুন..."
              rows={4}
              disabled={loading}
              className="w-full resize-y rounded-xl border border-slate-300 bg-white/90 px-4 py-3 text-sm outline-none transition-all duration-200 placeholder:text-slate-400 focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100 disabled:opacity-60"
            />
          </div>
        </div>

        {error && (
          <p className="mt-4 animate-scale-in rounded-xl bg-red-50 px-4 py-2.5 text-sm text-red-600 ring-1 ring-red-100">
            ⚠️ {error}
          </p>
        )}
        {success && (
          <div className="mt-4 flex animate-scale-in items-center justify-between gap-3 rounded-xl bg-emerald-50 px-4 py-2.5 text-sm text-emerald-700 ring-1 ring-emerald-100">
            <span>{success}</span>
            <Link
              href="/"
              className="shrink-0 font-semibold underline hover:no-underline"
            >
              দেখুন →
            </Link>
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="mt-6 w-full rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 py-3.5 text-sm font-semibold text-white shadow-lg shadow-indigo-200 transition-all duration-200 hover:shadow-xl hover:shadow-indigo-300 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-70"
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
              তৈরি হচ্ছে...
            </span>
          ) : (
            "✨ পরীক্ষা তৈরি করুন"
          )}
        </button>
      </form>
    </div>
  );
}
