"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ApiError } from "@/lib/api";
import { useAuth } from "@/components/AuthProvider";

type Mode = "login" | "signup";

interface AuthFormProps {
  mode: Mode;
}

function nextPath(): string {
  if (typeof window === "undefined") return "/";
  const value = new URLSearchParams(window.location.search).get("next");
  if (value && value.startsWith("/") && !value.startsWith("//")) return value;
  return "/";
}

export default function AuthForm({ mode }: AuthFormProps) {
  const { login, signup } = useAuth();
  const router = useRouter();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isSignup = mode === "signup";

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
    if (password.length === 0) {
      setError("পাসওয়ার্ড দিন");
      return;
    }
    if (isSignup && password.length < 8) {
      setError("পাসওয়ার্ড কমপক্ষে ৮ অক্ষরের হতে হবে");
      return;
    }
    if (isSignup && password !== confirmPassword) {
      setError("দুইবার দেওয়া পাসওয়ার্ড মিলছে না");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      if (isSignup) {
        await signup(trimmed, password);
      } else {
        await login(trimmed, password);
      }
      router.replace(nextPath());
      router.refresh();
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : "কিছু একটা সমস্যা হয়েছে"
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="animate-fade-in-up mx-auto mt-6 max-w-md">
      <div className="mb-6 text-center">
        <span className="mb-3 inline-flex h-20 w-20 animate-trophy-bounce items-center justify-center rounded-3xl bg-gradient-to-br from-indigo-500 to-violet-600 text-4xl shadow-xl shadow-indigo-200">
          {isSignup ? "✨" : "🏆"}
        </span>
        <h1 className="text-2xl font-bold text-slate-900">
          {isSignup ? "নতুন অ্যাকাউন্ট খুলুন" : "আবার স্বাগতম!"}
        </h1>
        <p className="mt-1.5 text-sm text-slate-500">
          {isSignup
            ? "ইউজারনেম আর একটি পাসওয়ার্ড দিন — ব্যস, শুরু।"
            : "আপনার ইউজারনেম ও পাসওয়ার্ড দিয়ে লগইন করুন।"}
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="rounded-2xl border border-slate-200/80 bg-white/80 p-6 shadow-lg shadow-indigo-100/50 backdrop-blur"
      >
        <div className="space-y-4">
          <div>
            <label
              htmlFor="username"
              className="mb-1.5 block text-sm font-medium text-slate-700"
            >
              ইউজারনেম
            </label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="যেমন: রাহিম"
              maxLength={30}
              autoComplete="username"
              disabled={loading}
              className="w-full rounded-xl border border-slate-300 bg-white/90 px-4 py-3 text-sm outline-none transition-all duration-200 placeholder:text-slate-400 focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100 disabled:opacity-60"
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="mb-1.5 block text-sm font-medium text-slate-700"
            >
              পাসওয়ার্ড
            </label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={isSignup ? "কমপক্ষে ৮ অক্ষর" : "আপনার পাসওয়ার্ড"}
                autoComplete={isSignup ? "new-password" : "current-password"}
                disabled={loading}
                className="w-full rounded-xl border border-slate-300 bg-white/90 px-4 py-3 pr-16 text-sm outline-none transition-all duration-200 placeholder:text-slate-400 focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100 disabled:opacity-60"
              />
              <button
                type="button"
                onClick={() => setShowPassword((value) => !value)}
                disabled={loading}
                className="absolute inset-y-0 right-1 my-1 rounded-lg px-3 text-xs font-medium text-slate-500 transition-colors hover:bg-slate-50 hover:text-indigo-600 disabled:opacity-60"
              >
                {showPassword ? "লুকান" : "দেখুন"}
              </button>
            </div>
          </div>

          {isSignup && (
            <div>
              <label
                htmlFor="confirmPassword"
                className="mb-1.5 block text-sm font-medium text-slate-700"
              >
                পাসওয়ার্ড আবার দিন
              </label>
              <input
                id="confirmPassword"
                type={showPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="একই পাসওয়ার্ড আবার লিখুন"
                autoComplete="new-password"
                disabled={loading}
                className="w-full rounded-xl border border-slate-300 bg-white/90 px-4 py-3 text-sm outline-none transition-all duration-200 placeholder:text-slate-400 focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100 disabled:opacity-60"
              />
            </div>
          )}
        </div>

        {error && (
          <p className="mt-4 animate-scale-in rounded-xl bg-red-50 px-4 py-2.5 text-sm text-red-600 ring-1 ring-red-100">
            ⚠️ {error}
          </p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="mt-5 w-full rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 py-3.5 text-sm font-semibold text-white shadow-lg shadow-indigo-200 transition-all duration-200 hover:shadow-xl hover:shadow-indigo-300 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-70"
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
              অপেক্ষা করুন...
            </span>
          ) : isSignup ? (
            "সাইনআপ করুন →"
          ) : (
            "লগইন করুন →"
          )}
        </button>

        {isSignup && (
          <p className="mt-3 text-center text-xs text-slate-400">
            আগে ইউজারনেম দিয়ে অ্যাকাউন্ট থাকলে একই ইউজারনেম ব্যবহার করুন —
            আপনার পুরোনো পয়েন্ট হারাবে না।
          </p>
        )}
      </form>

      <p className="mt-5 text-center text-sm text-slate-500">
        {isSignup ? "আগেই অ্যাকাউন্ট আছে?" : "নতুন ব্যবহারকারী?"}{" "}
        <Link
          href={isSignup ? "/login" : "/signup"}
          className="font-semibold text-indigo-600 underline-offset-2 hover:underline"
        >
          {isSignup ? "লগইন করুন" : "সাইনআপ করুন"}
        </Link>
      </p>
    </div>
  );
}
