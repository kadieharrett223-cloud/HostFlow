"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { estimateWaitMinutes, formatTimeAdded } from "@/lib/waitlist";

type PartyStatus = "waiting" | "ready" | "seated" | "no_show";

type Party = {
  id: string;
  name: string;
  size: number;
  notes?: string | null;
  phone?: string | null;
  status: PartyStatus;
  created_at?: string | null;
  ready_at?: string | null;
};

export default function HostDashboardPage() {
  const params = useParams<{ slug: string }>();
  const slug = params.slug;
  const [parties, setParties] = useState<Party[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [name, setName] = useState("");
  const [size, setSize] = useState(2);
  const [notes, setNotes] = useState("");
  const [actionError, setActionError] = useState<string | null>(null);

  const restaurantName = slug
    ? slug
        .split("-")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ")
    : "Tonight's";

  const fetchParties = useCallback(async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from("parties")
      .select("*")
      .eq("restaurant_slug", slug)
      .order("created_at", { ascending: true });

    if (error) {
      setIsLoading(false);
      return;
    }

    setParties(data ?? []);
    setIsLoading(false);
  }, [slug]);

  useEffect(() => {
    let isActive = true;

    const runFetch = async () => {
      if (!isActive) {
        return;
      }
      await fetchParties();
    };

    runFetch();

    const channel = supabase
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
          runFetch();
        }
      )
      .subscribe();

    return () => {
      isActive = false;
      supabase.removeChannel(channel);
    };
  }, [fetchParties, slug]);

  const waitingParties = useMemo(
    () => parties.filter((party) => party.status === "waiting"),
    [parties]
  );

  const queuePosition = useMemo(() => {
    const positions = new Map<string, number>();
    waitingParties.forEach((party, index) => {
      positions.set(party.id, index + 1);
    });
    return positions;
  }, [waitingParties]);

  const handleAddParty = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setActionError(null);
    if (!name.trim()) {
      return;
    }

    const { error } = await supabase.from("parties").insert({
      restaurant_slug: slug,
      name: name.trim(),
      size,
      notes: notes.trim() ? notes.trim() : null,
      status: "waiting",
    });

    if (error) {
      setActionError(error.message);
      return;
    }

    await fetchParties();

    setName("");
    setSize(2);
    setNotes("");
  };

  const handleMarkReady = async (party: Party) => {
    setActionError(null);
    const { error } = await supabase
      .from("parties")
      .update({ status: "ready", ready_at: new Date().toISOString() })
      .eq("id", party.id);
    if (error) {
      setActionError(error.message);
      return;
    }

    // Send SMS notification if phone is available
    if (party.phone) {
      try {
        await fetch("/api/send-sms", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            phone: party.phone,
            message: `Your table at ${restaurantName} is ready! Please proceed to the host stand.`,
          }),
        });
      } catch (err) {
        console.error("Failed to send SMS:", err);
      }
    }

    await fetchParties();
  };

  const handleSeatParty = async (partyId: string) => {
    setActionError(null);
    const { error } = await supabase
      .from("parties")
      .update({ status: "seated" })
      .eq("id", partyId);
    if (error) {
      setActionError(error.message);
      return;
    }
    await fetchParties();
  };

  const handleMarkNoShow = async (partyId: string) => {
    setActionError(null);
    const { error } = await supabase
      .from("parties")
      .update({ status: "no_show" })
      .eq("id", partyId);
    if (error) {
      setActionError(error.message);
      return;
    }
    await fetchParties();
  };

  const handleRemoveParty = async (partyId: string) => {
    setActionError(null);
    const { error } = await supabase
      .from("parties")
      .delete()
      .eq("id", partyId);
    if (error) {
      setActionError(error.message);
      return;
    }
    await fetchParties();
  };

  const handleEditParty = async (party: Party) => {
    setActionError(null);
    const nextSize = window.prompt("Update party size", String(party.size));
    if (!nextSize) {
      return;
    }

    const sizeValue = Number(nextSize);
    if (Number.isNaN(sizeValue) || sizeValue < 1) {
      return;
    }

    const nextNotes = window.prompt("Update notes", party.notes ?? "");
    const { error } = await supabase
      .from("parties")
      .update({
        size: sizeValue,
        notes: nextNotes?.trim() ? nextNotes.trim() : null,
      })
      .eq("id", party.id);
    if (error) {
      setActionError(error.message);
      return;
    }
    await fetchParties();
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-6 py-10">
        <header className="flex flex-wrap items-start justify-between gap-6">
          <div className="grid gap-2">
            <p className="text-xs uppercase tracking-[0.25em] text-teal-600">
              HostFlow
            </p>
            <h1 className="text-3xl font-semibold text-slate-900 sm:text-4xl">
              {restaurantName} Grill — Live Waitlist
            </h1>
            <p className="max-w-2xl text-sm text-slate-600">
              Tap a party to seat them. Updates sync instantly to the guest
              kiosk.
            </p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white px-5 py-4 text-right shadow-sm">
            <p className="text-sm font-semibold text-slate-900">
              {restaurantName} Grill
            </p>
            <p className="text-xs text-slate-500">Host iPad • Synced</p>
          </div>
        </header>

        {/* Tab Navigation */}
        <nav className="flex gap-4 border-b border-slate-200">
          <a
            href={`/host/${slug}`}
            className="border-b-2 border-teal-600 px-4 py-3 text-sm font-medium text-teal-600"
          >
            Queue
          </a>
          <a
            href={`/host/${slug}/analytics`}
            className="border-b-2 border-transparent px-4 py-3 text-sm font-medium text-slate-600 hover:text-slate-900"
          >
            Analytics
          </a>
        </nav>

        <section className="flex flex-wrap items-center gap-4 text-sm text-slate-600">
          <div className="rounded-full border border-slate-200 bg-white px-4 py-2 shadow-sm">
            Avg wait <span className="font-semibold text-slate-900">{estimateWaitMinutes(1)} min</span>
          </div>
          <div className="rounded-full border border-slate-200 bg-white px-4 py-2 shadow-sm">
            Waiting <span className="font-semibold text-slate-900">{waitingParties.length} parties</span>
          </div>
        </section>

        <section className="grid gap-6 rounded-[14px] border border-slate-200 bg-white p-7 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
                Control panel
              </p>
              <h2 className="mt-2 text-lg font-semibold text-slate-900">
                + Add Walk-In
              </h2>
              <p className="mt-1 text-sm text-slate-600">
                New parties appear immediately in the live queue.
              </p>
            </div>
          </div>

          <form onSubmit={handleAddParty} className="grid gap-4">
            <div className="grid gap-4 md:grid-cols-[1.2fr_0.6fr_1fr]">
              <input
                type="text"
                required
                placeholder="Party name"
                value={name}
                onChange={(event) => setName(event.target.value)}
                className="rounded-[14px] border border-slate-200 bg-white px-4 py-3 text-base text-slate-900 focus:border-sky-400 focus:outline-none"
              />
              <div className="flex items-center justify-between rounded-[14px] border border-slate-200 bg-white px-3 py-2">
                <button
                  type="button"
                  onClick={() => setSize((prev) => Math.max(1, prev - 1))}
                  className="h-9 w-9 rounded-full border border-slate-200 text-base text-slate-600 transition hover:border-slate-300"
                >
                  -
                </button>
                <span className="text-base font-semibold text-slate-900">
                  {size}
                </span>
                <button
                  type="button"
                  onClick={() => setSize((prev) => prev + 1)}
                  className="h-9 w-9 rounded-full border border-slate-200 text-base text-slate-600 transition hover:border-slate-300"
                >
                  +
                </button>
              </div>
              <input
                type="text"
                placeholder="Notes (optional)"
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
                className="rounded-[14px] border border-slate-200 bg-white px-4 py-3 text-base text-slate-900 focus:border-sky-400 focus:outline-none"
              />
            </div>
            {actionError ? (
              <p className="rounded-[14px] border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                {actionError}
              </p>
            ) : null}
            <div className="border-t border-slate-200 pt-4">
              <button
                type="submit"
                className="w-full rounded-[14px] bg-teal-500 px-5 py-3 text-base font-semibold text-white transition hover:bg-teal-400"
              >
                Add Party →
              </button>
            </div>
          </form>
        </section>

        <section className="grid gap-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <h2 className="text-lg font-semibold text-slate-900">Live queue</h2>
            <p className="text-sm text-slate-500">Tap a row to seat quickly.</p>
          </div>

          <div className="overflow-hidden rounded-[14px] border border-slate-200 bg-white">
            <div className="grid grid-cols-[1.4fr_0.5fr_0.7fr_1fr_0.8fr] gap-3 border-b border-slate-200 bg-slate-100 px-5 py-3 text-xs font-medium uppercase tracking-[0.12em] text-slate-500">
              <span>Name</span>
              <span>Size</span>
              <span>Wait</span>
              <span>Notes</span>
              <span>Actions</span>
            </div>
            {isLoading ? (
              <div className="px-5 py-6 text-sm text-slate-500">
                Loading waitlist...
              </div>
            ) : parties.length === 0 ? (
              <div className="px-5 py-10 text-center text-sm text-slate-500">
                Queue is clear. Add a walk-in above to get started.
              </div>
            ) : (
              <div className="divide-y divide-slate-200">
                {parties.map((party) => {
                  const position = queuePosition.get(party.id) ?? 0;
                  const estimated =
                    party.status === "waiting"
                      ? estimateWaitMinutes(position)
                      : 0;
                  const isNoShow = 
                    party.status === "ready" && party.ready_at
                      ? new Date().getTime() - new Date(party.ready_at).getTime() > 5 * 60 * 1000
                      : false;

                  return (
                    <div
                      key={party.id}
                      className={`grid grid-cols-[1.4fr_0.5fr_0.7fr_1fr_0.8fr] gap-3 px-5 py-4 text-sm ${
                        isNoShow ? "bg-orange-50" : "bg-white"
                      } text-slate-700`}
                    >
                      <div>
                        <p className="font-semibold text-slate-900">
                          {party.name}
                          {isNoShow && <span className="ml-2 text-xs font-medium text-orange-600">⚠️ No-show?</span>}
                        </p>
                      </div>
                      <div>{party.size}</div>
                      <div>
                        {party.status === "waiting"
                          ? `${estimated} min`
                          : party.status === "ready"
                          ? "READY"
                          : "-"}
                      </div>
                      <div className="text-xs text-slate-500">
                        {party.notes ?? "-"}
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {party.status === "waiting" ? (
                          <button
                            type="button"
                            onClick={() => handleMarkReady(party)}
                            className="rounded-full border border-teal-200 bg-teal-50 px-3 py-1 text-xs font-semibold text-teal-700 hover:bg-teal-100"
                          >
                            Ready
                          </button>
                        ) : party.status === "ready" ? (
                          <>
                            <button
                              type="button"
                              onClick={() => handleSeatParty(party.id)}
                              className="rounded-full border border-green-200 bg-green-50 px-3 py-1 text-xs font-semibold text-green-700 hover:bg-green-100"
                            >
                              Seated
                            </button>
                            {isNoShow && (
                              <button
                                type="button"
                                onClick={() => handleMarkNoShow(party.id)}
                                className="rounded-full border border-orange-200 bg-orange-50 px-3 py-1 text-xs font-semibold text-orange-700 hover:bg-orange-100"
                              >
                                No-Show
                              </button>
                            )}
                          </>
                        ) : null}
                        {party.status !== "seated" && (
                          <button
                            type="button"
                            onClick={() => handleRemoveParty(party.id)}
                            className="rounded-full border border-rose-200 bg-white px-3 py-1 text-xs font-semibold text-rose-700 hover:bg-rose-50"
                          >
                            Remove
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
