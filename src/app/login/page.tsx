"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [slug, setSlug] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (signInError) {
        throw signInError;
      }
      const safeSlug = slug.trim().toLowerCase();
      if (!safeSlug) {
        throw new Error("Enter your restaurant slug.");
      }
      router.push(`/mode/${safeSlug}`);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Login failed.";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <div className="mx-auto flex min-h-screen w-full max-w-4xl flex-col justify-center px-6 py-16">
        <p className="text-sm uppercase tracking-[0.3em] text-teal-600">
          HostFlow
        </p>
        <h1 className="mt-4 text-4xl font-semibold text-slate-900 sm:text-5xl">
          Staff login
        </h1>
        <p className="mt-3 max-w-xl text-base text-slate-600">
          Sign in, then choose host or guest kiosk mode for this device.
        </p>

        <form
          onSubmit={handleSubmit}
          className="mt-10 grid gap-5 rounded-3xl border border-slate-200 bg-white p-8 shadow-sm"
        >
          <label className="grid gap-2 text-sm text-slate-600">
            Email
            <input
              type="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-base text-slate-900 focus:border-sky-400 focus:outline-none"
            />
          </label>
          <label className="grid gap-2 text-sm text-slate-600">
            Password
            <input
              type="password"
              required
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-base text-slate-900 focus:border-sky-400 focus:outline-none"
            />
          </label>
          <label className="grid gap-2 text-sm text-slate-600">
            Restaurant slug
            <input
              type="text"
              required
              placeholder="joespizza"
              value={slug}
              onChange={(event) => setSlug(event.target.value)}
              className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-base text-slate-900 focus:border-sky-400 focus:outline-none"
            />
          </label>
          {error ? (
            <p className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {error}
            </p>
          ) : null}
          <button
            type="submit"
            disabled={isLoading}
            className="rounded-2xl bg-teal-500 px-4 py-3 text-base font-semibold text-white transition hover:bg-teal-400 disabled:opacity-60"
          >
            {isLoading ? "Signing in..." : "Choose device mode"}
          </button>
        </form>
      </div>
    </div>
  );
}
