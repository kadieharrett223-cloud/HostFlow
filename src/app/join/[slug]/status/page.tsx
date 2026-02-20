"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { estimateWaitMinutes } from "@/lib/waitlist";

type PartyStatus = "waiting" | "ready" | "seated" | "no_show";

type Party = {
  id: string;
  name: string;
  status: PartyStatus;
  size: number;
};

export default function WaitlistStatusPage() {
  const params = useParams<{ slug: string }>();
  const searchParams = useSearchParams();
  const partyId = searchParams.get("partyId");
  const slug = params.slug;

  const [party, setParty] = useState<Party | null>(null);
  const [waitingIds, setWaitingIds] = useState<string[]>([]);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!partyId) {
      return;
    }

    let isActive = true;

    const fetchParty = async () => {
      const { data, error } = await supabase
        .from("parties")
        .select("id,name,status,size")
        .eq("id", partyId)
        .eq("restaurant_slug", slug)
        .maybeSingle();

      if (!isActive) {
        return;
      }

      if (error || !data) {
        setNotFound(true);
        return;
      }

      setNotFound(false);
      setParty(data);
    };

    fetchParty();

    const channel = supabase
      .channel(`party-${partyId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "parties",
          filter: `id=eq.${partyId}`,
        },
        () => {
          fetchParty();
        }
      )
      .subscribe();

    return () => {
      isActive = false;
      supabase.removeChannel(channel);
    };
  }, [partyId, slug]);

  useEffect(() => {
    let isActive = true;

    const fetchWaiting = async () => {
      const { data, error } = await supabase
        .from("parties")
        .select("id,status")
        .eq("restaurant_slug", slug)
        .order("created_at", { ascending: true });

      if (!isActive) {
        return;
      }

      if (error) {
        return;
      }

      const waiting = (data ?? [])
        .filter((party) => party.status === "waiting")
        .map((party) => party.id);
      setWaitingIds(waiting);
    };

    fetchWaiting();

    const channel = supabase
      .channel(`queue-${slug}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "parties",
          filter: `restaurant_slug=eq.${slug}`,
        },
        () => {
          fetchWaiting();
        }
      )
      .subscribe();

    return () => {
      isActive = false;
      supabase.removeChannel(channel);
    };
  }, [slug]);

  const position = useMemo(() => {
    if (!partyId) {
      return null;
    }
    const index = waitingIds.indexOf(partyId);
    return index >= 0 ? index + 1 : null;
  }, [partyId, waitingIds]);

  const estimatedWait = position ? estimateWaitMinutes(position) : null;

  if (!partyId) {
    return (
      <div className="min-h-screen bg-slate-50 px-6 py-16 text-slate-600">
        Missing party ID.
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="min-h-screen bg-slate-50 px-6 py-16 text-slate-600">
        We could not find your entry. Please check with the host.
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <div className="mx-auto flex min-h-screen w-full max-w-3xl flex-col justify-center px-6 py-16">
        <p className="text-xs uppercase tracking-[0.3em] text-slate-500">
          {slug} waitlist
        </p>
        <h1 className="mt-4 text-4xl font-semibold text-slate-900 sm:text-5xl">
          {party?.status === "ready"
            ? "Your table is ready! 🎉"
            : party?.status === "seated"
            ? "You're up!"
            : party?.status === "no_show"
            ? "Your spot has been released"
            : "You're on the list"}
        </h1>
        <p className="mt-3 text-base text-slate-600">
          {party?.status === "ready"
            ? "Please proceed to the host stand."
            : party?.status === "seated"
            ? "Please check in with the host stand."
            : party?.status === "no_show"
            ? "We released your spot. Come back another time!"
            : "We'll keep your place updated in real time."}
        </p>

        {party?.status === "ready" && (
          <div className="mt-8 rounded-3xl border-2 border-teal-200 bg-teal-50 p-8">
            <div className="flex items-start gap-3">
              <p className="text-3xl">🔔</p>
              <div>
                <p className="font-semibold text-teal-900">Your table is ready!</p>
                <p className="mt-1 text-sm text-teal-700">Head to the host stand now</p>
              </div>
            </div>
          </div>
        )}

        <div className="mt-10 grid gap-5 rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
              Party
            </p>
            <p className="text-2xl font-semibold text-slate-900">
              {party?.name ?? "Loading"}
            </p>
          </div>
          {party?.status === "waiting" && (
            <>
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
                  Position in queue
                </p>
                <p className="text-2xl font-semibold text-slate-900">
                  {position ? `#${position}` : "Updating..."}
                </p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
                  Estimated wait
                </p>
                <p className="text-2xl font-semibold text-slate-900">
                  {estimatedWait ? `${estimatedWait} min` : "Updating..."}
                </p>
              </div>
            </>
          )}
          {party?.status === "ready" && (
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
                Party size
              </p>
              <p className="text-2xl font-semibold text-slate-900">
                {party?.size} {party?.size === 1 ? "person" : "people"}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
