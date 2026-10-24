"use client";

import { useState, type FormEvent } from "react";
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
      const exam = await createExam(adminKey.trim(), title.trim(), content.trim());
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
    <div className="mx-auto max-w-xl">
      <h1 className="mb-1 text-xl font-bold">নতুন পরীক্ষা তৈরি করুন</h1>
      <p className="mb-5 text-sm text-slate-500">
        শুধু অ্যাডমিন নতুন পরীক্ষা তৈরি করতে পারেন। কী কোথাও সংরক্ষণ করা হয় না।
      </p>

      <form
        onSubmit={handleSubmit}
        className="flex flex-col gap-4 rounded-xl bg-white border border-slate-200 p-5 shadow-sm"
      >
        <div>
          <label
            htmlFor="adminKey"
            className="mb-1 block text-sm font-medium text-slate-700"
          >
            অ্যাডমিন কী
          </label>
          <input
            id="adminKey"
            type="password"
            value={adminKey}
            onChange={(e) => setAdminKey(e.target.value)}
            placeholder="সার্ভারের ADMIN_KEY"
            autoComplete="off"
            disabled={loading}
            className="w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 disabled:opacity-60"
          />
        </div>

        <div>
          <label
            htmlFor="title"
            className="mb-1 block text-sm font-medium text-slate-700"
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
            className="w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 disabled:opacity-60"
          />
        </div>

        <div>
          <label
            htmlFor="content"
            className="mb-1 block text-sm font-medium text-slate-700"
          >
            বর্ণনা <span className="text-slate-400">(ঐচ্ছিক)</span>
          </label>
          <textarea
            id="content"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="পরীক্ষা সম্পর্কে বিস্তারিত লিখুন..."
            rows={4}
            disabled={loading}
            className="w-full resize-y rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 disabled:opacity-60"
          />
        </div>

        {error && (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
            {error}
          </p>
        )}
        {success && (
          <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
            {success}
          </p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="rounded-lg bg-indigo-600 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-60 transition-colors"
        >
          {loading ? "তৈরি হচ্ছে..." : "পরীক্ষা তৈরি করুন"}
        </button>
      </form>
    </div>
  );
}
