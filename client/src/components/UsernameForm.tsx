"use client";

import { useState, type FormEvent } from "react";
import { createUser, ApiError } from "@/lib/api";
import { saveUser } from "@/lib/user";

interface UsernameFormProps {
  onSaved: (user: { id: string; username: string }) => void;
}

export default function UsernameForm({ onSaved }: UsernameFormProps) {
  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const trimmed = username.trim();
    if (trimmed.length === 0) {
      setError("ইউজারনেম লিখুন");
      return;
    }
    if (trimmed.length > 30) {
      setError("ইউজারনেম সর্বোচ্চ ৩০ অক্ষরের হতে পারে");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const user = await createUser(trimmed);
      saveUser(user);
      onSaved({ id: user.id, username: user.username });
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : "কিছু একটা সমস্যা হয়েছে"
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="animate-fade-in-up mx-auto mt-8 max-w-md">
      <div className="mb-6 text-center">
        <span className="mb-3 inline-flex h-20 w-20 animate-trophy-bounce items-center justify-center rounded-3xl bg-gradient-to-br from-indigo-500 to-violet-600 text-4xl shadow-xl shadow-indigo-200">
          🏆
        </span>
        <h1 className="text-2xl font-bold text-slate-900">
          TeamRank-এ স্বাগতম!
        </h1>
        <p className="mt-1.5 text-sm text-slate-500">
          শুরু করতে আপনার ইউজারনেম দিন। একবার দিলে পরে আর জানতে চাওয়া হবে না।
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="rounded-2xl border border-slate-200/80 bg-white/80 p-6 shadow-lg shadow-indigo-100/50 backdrop-blur"
      >
        <label
          htmlFor="username"
          className="mb-1.5 block text-sm font-medium text-slate-700"
        >
          ইউজারনেম
        </label>
        <div className="flex flex-col gap-3 sm:flex-row">
          <input
            id="username"
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="যেমন: রাহিম"
            maxLength={30}
            disabled={loading}
            className="flex-1 rounded-xl border border-slate-300 bg-white/90 px-4 py-3 text-sm outline-none transition-all duration-200 placeholder:text-slate-400 focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100 disabled:opacity-60"
          />
          <button
            type="submit"
            disabled={loading}
            className="relative overflow-hidden rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-7 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-200 transition-all duration-200 hover:shadow-xl hover:shadow-indigo-300 active:scale-95 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                অপেক্ষা করুন...
              </span>
            ) : (
              "শুরু করুন →"
            )}
          </button>
        </div>

        {error && (
          <p className="mt-3 animate-scale-in rounded-xl bg-red-50 px-4 py-2.5 text-sm text-red-600 ring-1 ring-red-100">
            ⚠️ {error}
          </p>
        )}
      </form>
    </div>
  );
}
