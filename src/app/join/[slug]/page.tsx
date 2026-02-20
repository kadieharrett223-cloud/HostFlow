"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import type { RealtimeChannel } from "@supabase/supabase-js";

interface Party {
  id: string;
  name: string;
  size: number;
  created_at: string;
}

export default function JoinWaitlistPage() {
  const params = useParams<{ slug: string }>();
  const router = useRouter();
  const slug = params.slug;
  const [name, setName] = useState("");
  const [size, setSize] = useState(2);
  const [phone, setPhone] = useState("");
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [parties, setParties] = useState<Party[]>([]);

  useEffect(() => {
    const fetchParties = async () => {
      try {
        const { data, error: fetchError } = await supabase
          .from("parties")
          .select("id, name, size, created_at")
          .eq("restaurant_slug", slug)
          .eq("status", "waiting")
          .order("created_at", { ascending: true });
        if (fetchError) throw fetchError;
        setParties(data || []);
      } catch (err) {
        console.error("Failed to fetch parties:", err);
      }
    };

    fetchParties();

    // Subscribe to realtime updates
    const channel: RealtimeChannel = supabase
      .channel(`parties-${slug}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "parties",
          filter: `restaurant_slug=eq.${slug}`,
        },
        () => {
          fetchParties();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [slug]);

  const calculateAverageWait = (): number => {
    if (parties.length === 0) return 0;
    const now = new Date();
    const totalMinutes = parties.reduce((sum, p) => {
      const created = new Date(p.created_at);
      const minutes = Math.floor((now.getTime() - created.getTime()) / 60000);
      return sum + minutes;
    }, 0);
    return Math.round(totalMinutes / parties.length);
  };

  const restaurantName = slug
    ? slug
        .split("-")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ")
    : "Restaurant";

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const { data, error: insertError } = await supabase
        .from("parties")
        .insert({
          restaurant_slug: slug,
          name: name.trim(),
          size,
          phone: phone.trim() ? phone.trim() : null,
          notes: notes.trim() ? notes.trim() : null,
          status: "waiting",
        })
        .select("id")
        .single();
      if (insertError) {
        throw insertError;
      }
      if (!data?.id) {
        throw new Error("No party ID returned.");
      }

      // Send SMS notification if phone provided
      if (phone.trim()) {
        try {
          await fetch("/api/send-sms", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              phone: phone.trim(),
              message: `Hi ${name}! You've been added to the waitlist at ${restaurantName}. You're #${parties.length + 1} in line. We'll text you when your table is ready.`,
            }),
          });
        } catch (err) {
          console.error("Failed to send SMS:", err);
        }
      }

      // Show success message
      setShowSuccess(true);
      // Reset form after 3 seconds
      setTimeout(() => {
        setName("");
        setSize(2);
        setPhone("");
        setNotes("");
        setShowSuccess(false);
      }, 3000);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Submission failed.";
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      <div className="flex flex-1 flex-col items-center justify-center px-4 py-8">
        {/* Header */}
        <div className="mb-6 text-center">
          <h1 className="text-3xl font-bold text-slate-900 sm:text-4xl">
            Join the list
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            at {restaurantName}
          </p>
        </div>

        {/* Queue Summary */}
        {parties.length > 0 && (
          <div className="mb-6 flex gap-6 rounded-lg bg-slate-50 px-4 py-3">
            <div className="flex items-center gap-2">
              <span className="text-xl">🕒</span>
              <div>
                <p className="text-xs text-slate-500">Avg</p>
                <p className="text-lg font-bold text-slate-900">
                  {calculateAverageWait()}m
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xl">👥</span>
              <div>
                <p className="text-xs text-slate-500">Ahead</p>
                <p className="text-lg font-bold text-slate-900">
                  {parties.length}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Success Message */}
        {showSuccess && (
          <div className="mb-6 w-full max-w-md">
            <div className="rounded-lg border border-teal-200 bg-teal-50 px-6 py-8 text-center">
              <p className="text-2xl font-bold text-teal-900">✓ You're on the list!</p>
              <p className="mt-2 text-sm text-teal-700">
                We'll text you when your table is ready.
              </p>
            </div>
          </div>
        )}

        {/* Form */}
        <div className="w-full max-w-md">
          <form
            onSubmit={handleSubmit}
            className="rounded-xl border border-slate-300 bg-white p-6 shadow-sm"
          >
            {/* Name Input */}
            <div className="mb-5">
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Your name
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="John"
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-base text-slate-900 placeholder-slate-400 focus:border-teal-700 focus:outline-none"
              />
            </div>

            {/* Party Size */}
            <div className="mb-5">
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Party size
              </label>
              <div className="inline-flex items-center gap-1 rounded-lg border border-slate-300 bg-slate-50 p-1">
                <button
                  type="button"
                  onClick={() => setSize(Math.max(1, size - 1))}
                  className="px-2 py-1 text-slate-600 hover:bg-slate-200 hover:text-slate-900"
                >
                  −
                </button>
                <div className="w-8 text-center text-sm font-bold text-teal-700">
                  {size}
                </div>
                <button
                  type="button"
                  onClick={() => setSize(size + 1)}
                  className="px-2 py-1 text-slate-600 hover:bg-slate-200 hover:text-slate-900"
                >
                  +
                </button>
              </div>
            </div>

            {/* Phone Input */}
            <div className="mb-5">
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Phone (for text updates)
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(event) => setPhone(event.target.value)}
                placeholder="(555) 555-1234"
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-base text-slate-900 placeholder-slate-400 focus:border-teal-700 focus:outline-none"
              />
            </div>

            {/* Notes Input */}
            <div className="mb-5">
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Special requests (optional)
              </label>
              <textarea
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
                placeholder="e.g., Allergies, seating preference, high chair needed..."
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-base text-slate-900 placeholder-slate-400 focus:border-teal-700 focus:outline-none"
                rows={3}
              />
            </div>

            {/* Error */}
            {error && (
              <div className="mb-5 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700">
                {error}
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full rounded-lg bg-teal-700 px-4 py-3 text-base font-semibold text-white transition hover:bg-teal-800 disabled:opacity-60"
            >
              {isSubmitting ? "Joining..." : "Join the Waitlist"}
            </button>

            {/* Footer Text */}
            <p className="mt-3 text-center text-xs text-slate-600">
              We'll notify you when your table is ready.
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
