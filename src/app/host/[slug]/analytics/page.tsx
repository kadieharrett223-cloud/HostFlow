"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  AreaChart,
  Area,
} from "recharts";

type Party = {
  id: string;
  name: string;
  size: number;
  status: "waiting" | "seated" | "removed";
  created_at: string;
};

type DayData = {
  day: string;
  parties: number;
};

type HourData = {
  hour: string;
  parties: number;
};

type PartieSizeData = {
  name: string;
  value: number;
};

export default function AnalyticsDashboard() {
  const params = useParams<{ slug: string }>();
  const slug = params.slug;
  const [parties, setParties] = useState<Party[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // KPI data
  const [partiesToday, setPartiesToday] = useState(0);
  const [guestsToday, setGuestsToday] = useState(0);
  const [noShowRate, setNoShowRate] = useState(0);

  // Chart data
  const [busiestDaysData, setBusiestDaysData] = useState<DayData[]>([]);
  const [peakHoursData, setPeakHoursData] = useState<HourData[]>([]);
  const [partySizeData, setPartySizeData] = useState<PartieSizeData[]>([]);

  const restaurantName = slug
    ? slug
        .split("-")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ")
    : "Restaurant";

  useEffect(() => {
    const fetchAnalytics = async () => {
      setIsLoading(true);
      try {
        // Fetch last 30 days of data
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const { data, error } = await supabase
          .from("parties")
          .select("*")
          .eq("restaurant_slug", slug)
          .gte("created_at", thirtyDaysAgo.toISOString());

        if (error) throw error;
        setParties(data || []);

        // Calculate KPIs
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const todayString = today.toISOString().split("T")[0];

        const todayParties = (data || []).filter((p) =>
          p.created_at.startsWith(todayString)
        );

        setPartiesToday(todayParties.length);
        setGuestsToday(
          todayParties.reduce((sum, p) => sum + (p.size || 0), 0)
        );

        const removedToday = todayParties.filter(
          (p) => p.status === "removed"
        ).length;
        const noShowPercentage =
          todayParties.length > 0
            ? Math.round((removedToday / todayParties.length) * 100)
            : 0;
        setNoShowRate(noShowPercentage);

        // Busiest days (last 30 days)
        const dayMap: { [key: string]: number } = {};
        (data || []).forEach((p) => {
          const date = new Date(p.created_at);
          const dayName = date.toLocaleDateString("en-US", {
            weekday: "short",
          });
          dayMap[dayName] = (dayMap[dayName] || 0) + 1;
        });

        const daysOfWeek = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
        const busiestDays = daysOfWeek
          .map((day) => ({
            day,
            parties: dayMap[day] || 0,
          }))
          .sort((a, b) => b.parties - a.parties);

        setBusiestDaysData(busiestDays);

        // Peak hours
        const hourMap: { [key: string]: number } = {};
        (data || []).forEach((p) => {
          const date = new Date(p.created_at);
          const hour = date.getHours();
          const ampm = hour >= 12 ? 'PM' : 'AM';
          const displayHour = hour % 12 === 0 ? 12 : hour % 12;
          const hourLabel = `${displayHour}:00 ${ampm}`;
          hourMap[hour] = (hourMap[hour] || 0) + 1;
        });

        const peakHours = Array.from({ length: 12 }, (_, i) => {
          const hour = 11 + i;
          const ampm = hour >= 12 ? 'PM' : 'AM';
          const displayHour = hour % 12 === 0 ? 12 : hour % 12;
          const hourLabel = `${displayHour}:00 ${ampm}`;
          return {
            hour: hourLabel,
            parties: hourMap[hour] || 0,
          };
        });

        setPeakHoursData(peakHours);

        // Party size breakdown
        const sizeMap: { [key: string]: number } = {
          "1–2": 0,
          "3–4": 0,
          "5–6": 0,
          "7+": 0,
        };

        (data || []).forEach((p) => {
          const size = p.size || 0;
          if (size <= 2) sizeMap["1–2"]++;
          else if (size <= 4) sizeMap["3–4"]++;
          else if (size <= 6) sizeMap["5–6"]++;
          else sizeMap["7+"]++;
        });

        const sizeBreakdown = Object.entries(sizeMap).map(([name, value]) => ({
          name,
          value,
        }));

        setPartySizeData(sizeBreakdown);
      } catch (err) {
        console.error("Failed to fetch analytics:", err);
      } finally {
        setIsLoading(false);
      }
    };

    if (slug) fetchAnalytics();
  }, [slug]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <p className="text-slate-600">Loading analytics...</p>
      </div>
    );
  }

  const pieColors = ["#14B8A6", "#0891B2", "#06B6D4", "#22D3EE"];

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-7xl px-6 py-8">
        {/* Header */}
        <div className="mb-8 flex flex-wrap items-start justify-between gap-6">
          <div className="grid gap-2">
            <p className="text-xs uppercase tracking-[0.25em] text-teal-600">
              HostFlow
            </p>
            <h1 className="text-3xl font-semibold text-slate-900 sm:text-4xl">
              {restaurantName} Grill — Analytics
            </h1>
            <p className="max-w-2xl text-sm text-slate-600">
              Insights from the last 30 days of reservations.
            </p>
          </div>
        </div>

        {/* Tab Navigation */}
        <nav className="mb-8 flex gap-4 border-b border-slate-200">
          <a
            href={`/host/${slug}`}
            className="border-b-2 border-transparent px-4 py-3 text-sm font-medium text-slate-600 hover:text-slate-900"
          >
            Queue
          </a>
          <a
            href={`/host/${slug}/analytics`}
            className="border-b-2 border-teal-600 px-4 py-3 text-sm font-medium text-teal-600"
          >
            Analytics
          </a>
        </nav>

        <div className="mb-10">
          <p className="text-base text-slate-600">
            {restaurantName} — Last 30 days
          </p>
        </div>

        {/* KPI Cards */}
        <div className="mb-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {/* Parties Today */}
          <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-sm font-medium text-slate-600">Parties Today</p>
            <p className="mt-2 text-4xl font-bold text-slate-900">
              {partiesToday}
            </p>
            <p className="mt-3 text-xs text-slate-500">
              {guestsToday} total guests
            </p>
          </div>

          {/* Guests Today */}
          <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-sm font-medium text-slate-600">Guests Today</p>
            <p className="mt-2 text-4xl font-bold text-slate-900">
              {guestsToday}
            </p>
            <p className="mt-3 text-xs text-slate-500">
              Across {partiesToday} {partiesToday === 1 ? "party" : "parties"}
            </p>
          </div>

          {/* No-show Rate */}
          <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-sm font-medium text-slate-600">No-show Rate</p>
            <p className="mt-2 text-4xl font-bold text-slate-900">
              {noShowRate}%
            </p>
            <p className="mt-3 text-xs text-slate-500">
              Removed/canceled today
            </p>
          </div>
        </div>

        {/* Charts */}
        <div className="grid gap-8 lg:grid-cols-2">
          {/* Busiest Days */}
          <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="mb-6 text-lg font-semibold text-slate-900">
              Busiest Days
            </h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={busiestDaysData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="day" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#fff",
                    border: "1px solid #e2e8f0",
                    borderRadius: "8px",
                  }}
                />
                <Bar dataKey="parties" fill="#14B8A6" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Peak Hours */}
          <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="mb-6 text-lg font-semibold text-slate-900">
              Peak Hours
            </h2>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={peakHoursData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="hour" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#fff",
                    border: "1px solid #e2e8f0",
                    borderRadius: "8px",
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="parties"
                  fill="#14B8A6"
                  stroke="#0F766E"
                  fillOpacity={0.3}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Party Size Breakdown */}
          <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="mb-6 text-lg font-semibold text-slate-900">
              Party Size Distribution
            </h2>
            <ResponsiveContainer width="100%" height={350}>
              <PieChart>
                <Pie
                  data={partySizeData}
                  cx="45%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name}: ${value}`}
                  outerRadius={80}
                  fill="#14B8A6"
                  dataKey="value"
                >
                  {partySizeData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={pieColors[index % pieColors.length]}
                    />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#fff",
                    border: "1px solid #e2e8f0",
                    borderRadius: "8px",
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Total Parties Trend */}
          <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="mb-6 text-lg font-semibold text-slate-900">
              Parties by Hour
            </h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={peakHoursData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis
                  dataKey="hour"
                  stroke="#94a3b8"
                  fontSize={12}
                  interval={1}
                />
                <YAxis stroke="#94a3b8" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#fff",
                    border: "1px solid #e2e8f0",
                    borderRadius: "8px",
                  }}
                />
                <Bar
                  dataKey="parties"
                  fill="#0891B2"
                  radius={[8, 8, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Stats Summary */}
        <div className="mt-12 rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="mb-6 text-lg font-semibold text-slate-900">
            Summary (Last 30 Days)
          </h2>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <p className="text-sm text-slate-600">Total Parties</p>
              <p className="mt-2 text-3xl font-bold text-slate-900">
                {parties.length}
              </p>
            </div>
            <div>
              <p className="text-sm text-slate-600">Total Guests</p>
              <p className="mt-2 text-3xl font-bold text-slate-900">
                {parties.reduce((sum, p) => sum + (p.size || 0), 0)}
              </p>
            </div>
            <div>
              <p className="text-sm text-slate-600">Seated</p>
              <p className="mt-2 text-3xl font-bold text-slate-900">
                {parties.filter((p) => p.status === "seated").length}
              </p>
            </div>
            <div>
              <p className="text-sm text-slate-600">Removed/Canceled</p>
              <p className="mt-2 text-3xl font-bold text-slate-900">
                {parties.filter((p) => p.status === "removed").length}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
