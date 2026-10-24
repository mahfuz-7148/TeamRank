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
    <div className="rounded-xl bg-white p-6 shadow-sm border border-slate-200">
      <h2 className="text-xl font-bold mb-1">স্বাগতম! 👋</h2>
      <p className="text-sm text-slate-500 mb-4">
        শুরু করতে আপনার ইউজারনেম দিন। একবার দিলে পরে আর জানতে চাওয়া হবে না।
      </p>

      <form onSubmit={handleSubmit} className="flex flex-col gap-3 sm:flex-row">
        <input
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="আপনার ইউজারনেম"
          maxLength={30}
          disabled={loading}
          className="flex-1 rounded-lg border border-slate-300 px-4 py-2.5 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 disabled:opacity-60"
        />
        <button
          type="submit"
          disabled={loading}
          className="rounded-lg bg-indigo-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-60 transition-colors"
        >
          {loading ? "অপেক্ষা করুন..." : "শুরু করুন"}
        </button>
      </form>

      {error && (
        <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}
