"use client";

import { useState, useEffect } from "react";
import {
  ShieldCheck,
  Calendar,
  Download,
  Footprints,
  TrendingUp,
  Users,
  Award,
  Search,
  ArrowUpRight,
  ArrowDownRight,
  Sparkles,
  Building2,
  CheckCircle2,
  UserCog,
  Maximize2,
  Minimize2,
  Crown,
  Trophy,
  Medal,
} from "lucide-react";
import confetti from "canvas-confetti";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import UserDetailModal from "@/components/UserDetailModal";

interface AdminDashboardClientProps {
  currentUser: {
    id: string;
    name: string;
    email: string;
    role: "USER" | "SUPER_ADMIN";
    department?: string | null;
  };
}

export default function AdminDashboardClient({ currentUser }: AdminDashboardClientProps) {
  const todayStr = new Date().toISOString().split("T")[0];
  const last7DaysStr = new Date(Date.now() - 6 * 86400000).toISOString().split("T")[0];
  const last30DaysStr = new Date(Date.now() - 29 * 86400000).toISOString().split("T")[0];
  const thisMonthStartStr = new Date(new Date().getFullYear(), new Date().getMonth(), 1)
    .toISOString()
    .split("T")[0];

  const [preset, setPreset] = useState<"today" | "7d" | "30d" | "month" | "custom">("7d");
  const [startDate, setStartDate] = useState<string>(last7DaysStr);
  const [endDate, setEndDate] = useState<string>(todayStr);
  const [showCustomDate, setShowCustomDate] = useState<boolean>(false);

  const [searchTerm, setSearchTerm] = useState<string>("");
  const [showAllInTable, setShowAllInTable] = useState<boolean>(false);

  const [analyticsData, setAnalyticsData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  // User inspection modal
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isLeaderboardMaximized, setIsLeaderboardMaximized] = useState(false);

  // Keyboard shortcut to close maximized view
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isLeaderboardMaximized) {
        setIsLeaderboardMaximized(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isLeaderboardMaximized]);

  const fetchAnalytics = async (sDate: string, eDate: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/analytics?startDate=${sDate}&endDate=${eDate}`);
      if (res.ok) {
        const data = await res.json();
        setAnalyticsData(data);
      }
    } catch (err) {
      console.error("Failed to fetch admin analytics:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics(startDate, endDate);
  }, []);

  const handleApplyPreset = (type: "today" | "7d" | "30d" | "month") => {
    setPreset(type);
    setShowCustomDate(false);
    let s = last7DaysStr;
    let e = todayStr;

    if (type === "today") {
      s = todayStr;
      e = todayStr;
    } else if (type === "7d") {
      s = last7DaysStr;
      e = todayStr;
    } else if (type === "30d") {
      s = last30DaysStr;
      e = todayStr;
    } else if (type === "month") {
      s = thisMonthStartStr;
      e = todayStr;
    }

    setStartDate(s);
    setEndDate(e);
    fetchAnalytics(s, e);
  };

  const handleCustomDateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchAnalytics(startDate, endDate);
  };

  const handleExportCSV = () => {
    setExporting(true);
    const url = `/api/admin/export?startDate=${startDate}&endDate=${endDate}`;
    window.location.href = url;
    setTimeout(() => setExporting(false), 2000);
  };

  const handleUpdateRole = async (userId: string, newRole: "USER" | "SUPER_ADMIN", dailyGoal: number) => {
    try {
      const res = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, role: newRole, dailyGoal }),
      });
      if (res.ok) {
        await fetchAnalytics(startDate, endDate);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const openUserDetail = (userId: string, userObj?: any) => {
    setSelectedUserId(userId);
    setSelectedUser(userObj || rawLeaderboard.find((u: any) => u.userId === userId) || null);
    setIsDetailOpen(true);
  };

  const triggerPodiumConfetti = () => {
    try {
      confetti({
        particleCount: 50,
        spread: 70,
        origin: { y: 0.6 },
        colors: ["#DC2626", "#EF4444", "#FFFFFF", "#F59E0B"],
      });
    } catch (e) {
      // ignore
    }
  };

  if (loading && !analyticsData) {
    return (
      <div className="py-24 flex flex-col items-center justify-center text-slate-400 gap-3">
        <div className="w-8 h-8 border-2 border-red-500/20 border-t-red-500 rounded-full animate-spin" />
        <p className="text-sm font-medium">Loading analytics dashboard...</p>
      </div>
    );
  }

  const kpi = analyticsData?.kpi || {
    today: { totalSteps: 0, activeUsers: 0, totalUsers: 0, activePercentage: 0, avgSteps: 0, topWalker: null },
    yesterday: { totalSteps: 0, activeUsers: 0 },
    range: { totalSteps: 0, totalDistanceKm: 0, totalCalories: 0, avgStepsPerDay: 0, uniqueWalkersCount: 0, totalUsers: 0 },
  };

  const timeSeries = analyticsData?.timeSeriesData || [];
  const rawLeaderboard = analyticsData?.leaderboard || [];
  const departmentStats = analyticsData?.departmentStats || [];

  // Filter leaderboard by search term (name or email)
  const filteredLeaderboard = rawLeaderboard.filter((u: any) => {
    return (
      u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  // Top 3 Podium Walkers
  const top1 = rawLeaderboard[0];
  const top2 = rawLeaderboard[1];
  const top3 = rawLeaderboard[2];

  // If search is active or showAllInTable is true, show all matching rows.
  // Otherwise, top 3 are on the podium and table shows rank 4 onwards!
  const hasPodium = rawLeaderboard.length >= 3 && !searchTerm;
  const tableDisplayList =
    hasPodium && !showAllInTable
      ? filteredLeaderboard.slice(3)
      : filteredLeaderboard;

  // Day-over-day delta
  const stepsDelta =
    kpi.yesterday.totalSteps > 0
      ? Math.round(((kpi.today.totalSteps - kpi.yesterday.totalSteps) / kpi.yesterday.totalSteps) * 100)
      : 0;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* 1. Executive Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 sm:p-7 rounded-3xl bg-[#121826] border border-slate-800 shadow-xl relative overflow-hidden">
        <div className="space-y-1.5 z-10">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-red-500/15 text-red-400 border border-red-500/30 flex items-center gap-1.5 uppercase tracking-wider">
              <ShieldCheck className="w-3.5 h-3.5 text-red-500" />
              TMMIN Super Admin
            </span>
            <span className="text-xs text-slate-400 font-medium">
              • {kpi.range.totalUsers} Registered Employees
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Employee Activity & Analytics
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 max-w-2xl">
            Activity tracking with weighted scoring: 70% Counted Steps (max 10k/day) + 30% Target Consistency (8k/day goal).
          </p>
        </div>

        {/* Action Button: Export CSV */}
        <div className="flex items-center gap-3 z-10 shrink-0">
          <button
            onClick={handleExportCSV}
            disabled={exporting}
            className="w-full sm:w-auto px-4 py-2.5 text-xs sm:text-sm font-bold rounded-xl bg-red-600 hover:bg-red-500 text-white transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-red-600/20 active:scale-95"
          >
            <Download className="w-4 h-4" />
            {exporting ? "Exporting CSV..." : "Export CSV Report"}
          </button>
        </div>
      </div>

      {/* 2. Simplified Date Range Bar */}
      <div className="p-4 rounded-2xl bg-[#121826] border border-slate-800 shadow-md flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Presets Segmented Buttons */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
          <div className="flex items-center gap-1.5 bg-slate-900/90 p-1 rounded-xl border border-slate-800">
            <button
              type="button"
              onClick={() => handleApplyPreset("today")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                preset === "today"
                  ? "bg-red-600 text-white shadow-sm"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              Today
            </button>
            <button
              type="button"
              onClick={() => handleApplyPreset("7d")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                preset === "7d"
                  ? "bg-red-600 text-white shadow-sm"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              7 Days
            </button>
            <button
              type="button"
              onClick={() => handleApplyPreset("30d")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                preset === "30d"
                  ? "bg-red-600 text-white shadow-sm"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              30 Days
            </button>
            <button
              type="button"
              onClick={() => handleApplyPreset("month")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                preset === "month"
                  ? "bg-red-600 text-white shadow-sm"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              This Month
            </button>
            <button
              type="button"
              onClick={() => {
                setPreset("custom");
                setShowCustomDate(!showCustomDate);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
                preset === "custom"
                  ? "bg-red-600 text-white shadow-sm"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>Custom</span>
            </button>
          </div>
        </div>

        {/* Date Info Summary */}
        <div className="text-xs text-slate-400 flex items-center gap-1.5">
          <span>Period:</span>
          <span className="font-bold text-slate-200">
            {startDate} to {endDate}
          </span>
          <span className="text-[11px] px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-semibold border border-slate-700">
            {analyticsData?.dateRange?.totalDays || 1} {analyticsData?.dateRange?.totalDays === 1 ? "Day" : "Days"}
          </span>
        </div>
      </div>

      {/* 2b. Expandable Custom Date Inputs */}
      {showCustomDate && (
        <form
          onSubmit={handleCustomDateSubmit}
          className="p-4 rounded-2xl bg-slate-900/90 border border-slate-700/80 shadow-lg flex flex-wrap items-center gap-3 animate-in fade-in duration-150"
        >
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400 font-medium">From:</span>
            <input
              type="date"
              value={startDate}
              max={endDate || todayStr}
              onChange={(e) => setStartDate(e.target.value)}
              className="bg-[#121826] border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-100 focus:outline-none focus:ring-1 focus:ring-red-500"
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400 font-medium">To:</span>
            <input
              type="date"
              value={endDate}
              min={startDate}
              max={todayStr}
              onChange={(e) => setEndDate(e.target.value)}
              className="bg-[#121826] border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-100 focus:outline-none focus:ring-1 focus:ring-red-500"
            />
          </div>
          <button
            type="submit"
            className="px-4 py-1.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold transition-colors cursor-pointer shadow-sm"
          >
            Apply Range
          </button>
        </form>
      )}

      {/* 3. 4 Clean Corporate KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Total Steps */}
        <div className="p-5 rounded-2xl bg-[#121826] border border-slate-800 shadow-md flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Total Steps ({analyticsData?.dateRange?.totalDays || 1}d)
            </span>
            <div className="p-2 rounded-xl bg-red-500/10 text-red-500">
              <Footprints className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <p className="text-2xl sm:text-3xl font-black text-white">
              {kpi.range.totalSteps.toLocaleString("en-US")}
            </p>
            <p className="text-xs text-slate-400 mt-1">
              {kpi.range.totalDistanceKm} km • {kpi.range.totalCalories.toLocaleString("en-US")} kcal
            </p>
          </div>
        </div>

        {/* KPI 2: Today's Steps */}
        <div className="p-5 rounded-2xl bg-[#121826] border border-slate-800 shadow-md flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Today's Steps
            </span>
            <div className="p-2 rounded-xl bg-red-500/10 text-red-500">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <p className="text-2xl sm:text-3xl font-black text-white">
              {kpi.today.totalSteps.toLocaleString("en-US")}
            </p>
            <div className="flex items-center gap-1.5 text-xs mt-1">
              {stepsDelta >= 0 ? (
                <span className="text-emerald-400 font-bold flex items-center">
                  <ArrowUpRight className="w-3.5 h-3.5" /> +{stepsDelta}%
                </span>
              ) : (
                <span className="text-rose-400 font-bold flex items-center">
                  <ArrowDownRight className="w-3.5 h-3.5" /> {stepsDelta}%
                </span>
              )}
              <span className="text-slate-400">vs yesterday ({kpi.yesterday.totalSteps.toLocaleString("en-US")})</span>
            </div>
          </div>
        </div>

        {/* KPI 3: Today's Participation */}
        <div className="p-5 rounded-2xl bg-[#121826] border border-slate-800 shadow-md flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Today's Participation
            </span>
            <div className="p-2 rounded-xl bg-slate-800 text-slate-300">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <p className="text-2xl sm:text-3xl font-black text-white">
              {kpi.today.activeUsers}{" "}
              <span className="text-xs font-normal text-slate-400">/ {kpi.range.totalUsers} users</span>
            </p>
            <p className="text-xs text-slate-400 mt-1">
              <span className="text-slate-200 font-bold">{kpi.today.activePercentage}%</span> active today
            </p>
          </div>
        </div>

        {/* KPI 4: Top Walker Today */}
        <div className="p-5 rounded-2xl bg-[#121826] border border-slate-800 shadow-md flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Top Walker Today
            </span>
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400">
              <Award className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            {kpi.today.topWalker ? (
              <div className="flex items-center gap-2.5">
                {kpi.today.topWalker.avatarUrl ? (
                  <img
                    src={kpi.today.topWalker.avatarUrl}
                    alt={kpi.today.topWalker.name}
                    className="w-9 h-9 rounded-full object-cover border-2 border-red-500/40 shrink-0"
                  />
                ) : (
                  <div className="w-9 h-9 rounded-full bg-slate-800 flex items-center justify-center font-bold text-xs text-slate-200 shrink-0">
                    {kpi.today.topWalker.name.charAt(0)}
                  </div>
                )}
                <div className="min-w-0">
                  <p className="text-sm font-bold text-white truncate">
                    {kpi.today.topWalker.name}
                  </p>
                  <p className="text-xs font-extrabold text-red-400">
                    {kpi.today.topWalker.steps.toLocaleString("en-US")} steps
                  </p>
                </div>
              </div>
            ) : (
              <p className="text-xs text-slate-500 mt-2">No activity logged today</p>
            )}
          </div>
        </div>
      </div>

      {/* 4. Chart: Daily Step Trend (Full Width) */}
      <div className="rounded-3xl bg-[#121826] border border-slate-800 p-6 shadow-md flex flex-col justify-between">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 mb-4 border-b border-slate-800">
          <div>
            <h3 className="font-bold text-base text-white flex items-center gap-2">
              <Footprints className="w-4 h-4 text-red-500" />
              Daily Step Trends
            </h3>
            <p className="text-xs text-slate-400">
              Cumulative employee step activity across the selected period
            </p>
          </div>
          <span className="text-xs font-bold text-slate-200 bg-slate-800 px-3 py-1 rounded-xl border border-slate-700 self-start sm:self-auto">
            Average: {kpi.range.avgStepsPerDay.toLocaleString("en-US")} steps/day
          </span>
        </div>

        <div className="h-64 sm:h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={timeSeries} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" vertical={false} />
              <XAxis
                dataKey="displayDate"
                stroke="#64748B"
                fontSize={11}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                stroke="#64748B"
                fontSize={11}
                tickLine={false}
                axisLine={false}
                tickFormatter={(val) => (val >= 1000 ? `${(val / 1000).toFixed(0)}k` : val)}
              />
              <Tooltip
                cursor={false}
                contentStyle={{
                  backgroundColor: "#0F172A",
                  borderColor: "#334155",
                  borderRadius: "12px",
                  color: "#F8FAFC",
                  fontSize: "12px",
                  boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.5)",
                }}
                formatter={(val: any) => [
                  `${Number(val).toLocaleString("id-ID")} langkah`,
                  "Total Langkah",
                ]}
              />
              <Bar
                dataKey="totalSteps"
                name="Total Langkah"
                fill="#DC2626"
                activeBar={{ fill: "#EF4444" }}
                radius={[6, 6, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 5. Complete Employee Leaderboard Container (Shows Podium + Rank 4+ List; Fullscreen on Maximize) */}
      <div
        className={
          isLeaderboardMaximized
            ? "fixed inset-0 z-50 p-4 sm:p-8 bg-[#0B0F17]/98 backdrop-blur-2xl overflow-y-auto flex flex-col space-y-6 animate-in fade-in zoom-in-95 duration-200"
            : "rounded-3xl bg-[#121826] border border-slate-800 p-6 sm:p-8 shadow-xl space-y-6"
        }
      >
        {/* Section Header with Controls */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-red-600/10 text-red-500 border border-red-500/20 flex items-center justify-center shrink-0">
              <Trophy className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-black text-lg sm:text-xl text-white tracking-tight">
                  Leaderboard & Rankings
                </h3>
                {isLeaderboardMaximized && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-500/15 text-red-400 border border-red-500/30 uppercase">
                    Maximized View
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400">
                Formula: (Counted Steps / Max × 70) + (Goal Days / Total Days × 30)
              </p>
            </div>
          </div>

          {/* Right Action Tools: Confetti, Search, Maximize */}
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={triggerPodiumConfetti}
              type="button"
              className="text-xs font-semibold px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
              title="Celebrate Top Performers"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Celebrate</span>
            </button>

            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by name or email..."
                className="bg-slate-900 border border-slate-700/80 rounded-xl pl-8 pr-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-red-500 w-44 sm:w-56"
              />
            </div>

            <button
              type="button"
              onClick={() => setIsLeaderboardMaximized(!isLeaderboardMaximized)}
              className="px-3.5 py-1.5 text-xs font-bold rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 flex items-center gap-1.5 transition-colors cursor-pointer shadow-sm"
              title={isLeaderboardMaximized ? "Minimize Screen (ESC)" : "Maximize Screen"}
            >
              {isLeaderboardMaximized ? (
                <>
                  <Minimize2 className="w-3.5 h-3.5 text-red-400" />
                  <span>Minimize (ESC)</span>
                </>
              ) : (
                <>
                  <Maximize2 className="w-3.5 h-3.5 text-slate-400" />
                  <span>Maximize</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Top 3 Podium (Always visible at top when not searching) */}
        {hasPodium && (
          <div className="relative pt-2 pb-4">
            <div className="grid grid-cols-3 gap-3 sm:gap-6 items-end max-w-4xl mx-auto pt-6 pb-2">
              {/* Rank 2 (Silver - Left) */}
              {top2 && (
                <div
                  onClick={() => openUserDetail(top2.userId, top2)}
                  className="flex flex-col items-center group cursor-pointer"
                >
                  <div className="relative mb-3 flex flex-col items-center">
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700 text-[11px] font-semibold mb-2 shadow-sm">
                      <Medal className="w-3.5 h-3.5 text-slate-400" />
                      2nd Place
                    </span>
                    {top2.avatarUrl ? (
                      <img
                        src={top2.avatarUrl}
                        alt={top2.name}
                        className="w-16 h-16 sm:w-20 sm:h-20 rounded-full object-cover border-2 border-slate-400 shadow-md group-hover:scale-105 transition-transform"
                      />
                    ) : (
                      <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-slate-800 flex items-center justify-center font-bold text-lg text-slate-300 border-2 border-slate-400 group-hover:scale-105 transition-transform">
                        {top2.name.charAt(0)}
                      </div>
                    )}
                  </div>

                  <p className="text-xs sm:text-sm font-bold text-white text-center truncate max-w-[130px] group-hover:text-red-400 transition-colors">
                    {top2.name}
                  </p>

                  {/* Podium Base Card */}
                  <div className="mt-3 w-full p-4 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-slate-700 text-center transition-all shadow-sm">
                    <div className="text-xl sm:text-2xl font-black text-white">
                      {Number(top2.finalScore ?? top2.score).toFixed(1)}
                      <span className="text-xs font-normal text-slate-400 ml-1">pts</span>
                    </div>
                    <div className="text-xs text-slate-300 font-semibold mt-1">
                      {(top2.totalCountedSteps || top2.totalSteps).toLocaleString("en-US")} steps
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1">
                      Steps: {Number(top2.stepScore ?? 0).toFixed(1)}/70 • Goal: {Number(top2.consistencyScore ?? 0).toFixed(1)}/30
                    </p>
                    {top2.totalExcessSteps > 0 && (
                      <p className="text-[10px] text-slate-500 mt-1 font-medium">
                        +{top2.totalExcessSteps.toLocaleString("en-US")} excess
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Rank 1 (Gold / Elevated - Center) */}
              {top1 && (
                <div
                  onClick={() => {
                    triggerPodiumConfetti();
                    openUserDetail(top1.userId, top1);
                  }}
                  className="flex flex-col items-center group cursor-pointer -mt-4 sm:-mt-6"
                >
                  <div className="relative mb-3 flex flex-col items-center">
                    <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/30 text-xs font-bold mb-2 shadow-sm">
                      <Trophy className="w-3.5 h-3.5 text-amber-400" />
                      1st Place
                    </span>
                    {top1.avatarUrl ? (
                      <img
                        src={top1.avatarUrl}
                        alt={top1.name}
                        className="w-20 h-20 sm:w-24 sm:h-24 rounded-full object-cover border-2 border-amber-400 shadow-xl group-hover:scale-105 transition-transform"
                      />
                    ) : (
                      <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-slate-800 flex items-center justify-center text-xl sm:text-2xl font-black text-amber-300 border-2 border-amber-400 group-hover:scale-105 transition-transform">
                        {top1.name.charAt(0)}
                      </div>
                    )}
                  </div>

                  <p className="text-sm sm:text-base font-black text-white text-center truncate max-w-[150px] group-hover:text-red-400 transition-colors">
                    {top1.name}
                  </p>

                  {/* Podium Base Card */}
                  <div className="mt-3 w-full p-5 rounded-2xl bg-gradient-to-b from-[#1A2234] to-[#111827] border border-amber-500/30 hover:border-amber-500/50 text-center transition-all shadow-md">
                    <div className="text-2xl sm:text-3xl font-black text-amber-300">
                      {Number(top1.finalScore ?? top1.score).toFixed(1)}
                      <span className="text-xs font-normal text-amber-400/80 ml-1">pts</span>
                    </div>
                    <div className="text-xs text-amber-200 font-bold mt-1">
                      {(top1.totalCountedSteps || top1.totalSteps).toLocaleString("en-US")} steps
                    </div>
                    <p className="text-[11px] text-amber-300/80 mt-1">
                      Steps: {Number(top1.stepScore ?? 0).toFixed(1)}/70 • Goal: {Number(top1.consistencyScore ?? 0).toFixed(1)}/30
                    </p>
                    {top1.totalExcessSteps > 0 && (
                      <p className="text-[10px] text-amber-200/60 mt-1 font-medium">
                        +{top1.totalExcessSteps.toLocaleString("en-US")} excess
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Rank 3 (Bronze - Right) */}
              {top3 && (
                <div
                  onClick={() => openUserDetail(top3.userId, top3)}
                  className="flex flex-col items-center group cursor-pointer"
                >
                  <div className="relative mb-3 flex flex-col items-center">
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-950/40 text-amber-500 border border-amber-800/50 text-[11px] font-semibold mb-2 shadow-sm">
                      <Medal className="w-3.5 h-3.5 text-amber-600" />
                      3rd Place
                    </span>
                    {top3.avatarUrl ? (
                      <img
                        src={top3.avatarUrl}
                        alt={top3.name}
                        className="w-14 h-14 sm:w-20 sm:h-20 rounded-full object-cover border-2 border-amber-700/80 shadow-md group-hover:scale-105 transition-transform"
                      />
                    ) : (
                      <div className="w-14 h-14 sm:w-20 sm:h-20 rounded-full bg-slate-800 flex items-center justify-center font-bold text-lg text-amber-600 border-2 border-amber-700/80 group-hover:scale-105 transition-transform">
                        {top3.name.charAt(0)}
                      </div>
                    )}
                  </div>

                  <p className="text-xs sm:text-sm font-bold text-white text-center truncate max-w-[130px] group-hover:text-red-400 transition-colors">
                    {top3.name}
                  </p>

                  {/* Podium Base Card */}
                  <div className="mt-3 w-full p-4 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-slate-700 text-center transition-all shadow-sm">
                    <div className="text-xl sm:text-2xl font-black text-white">
                      {Number(top3.finalScore ?? top3.score).toFixed(1)}
                      <span className="text-xs font-normal text-slate-400 ml-1">pts</span>
                    </div>
                    <div className="text-xs text-slate-300 font-semibold mt-1">
                      {(top3.totalCountedSteps || top3.totalSteps).toLocaleString("en-US")} steps
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1">
                      Steps: {Number(top3.stepScore ?? 0).toFixed(1)}/70 • Goal: {Number(top3.consistencyScore ?? 0).toFixed(1)}/30
                    </p>
                    {top3.totalExcessSteps > 0 && (
                      <p className="text-[10px] text-slate-500 mt-1 font-medium">
                        +{top3.totalExcessSteps.toLocaleString("en-US")} excess
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Rank 4 Onwards List (or Search Results) */}
        <div className="space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-2">
            <div className="flex items-center gap-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300">
                {searchTerm
                  ? `Search Results ("${searchTerm}")`
                  : hasPodium && !showAllInTable
                  ? "Rankings #4 and Below"
                  : "All Participant Rankings"}
              </h4>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 font-medium border border-slate-700">
                {tableDisplayList.length} Participants
              </span>
            </div>

            {hasPodium && (
              <button
                type="button"
                onClick={() => setShowAllInTable(!showAllInTable)}
                className="text-[11px] font-semibold text-slate-400 hover:text-white transition-colors cursor-pointer self-start sm:self-auto"
              >
                {showAllInTable
                  ? "← Show from #4 onwards"
                  : "Show all participants (including Top 3) →"}
              </button>
            )}
          </div>

          {tableDisplayList.length === 0 ? (
            <div className="py-12 text-center text-slate-500 text-xs rounded-2xl border border-slate-800/80 bg-slate-900/20">
              No participants match your search query.
            </div>
          ) : (
            <div className="overflow-x-auto rounded-2xl border border-slate-800">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-900/90 text-[11px] uppercase tracking-wider text-slate-400 border-b border-slate-800">
                  <tr>
                    <th className="px-4 py-3 text-center w-16">Rank</th>
                    <th className="px-4 py-3">Participant</th>
                    <th className="px-4 py-3">Final Score</th>
                    <th className="px-4 py-3">Step Score (70%)</th>
                    <th className="px-4 py-3">Consistency (30%)</th>
                    <th className="px-4 py-3">Excess Steps</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 bg-slate-900/20">
                  {tableDisplayList.map((user: any) => {
                    return (
                      <tr
                        key={user.userId}
                        className="hover:bg-slate-800/40 transition-colors group cursor-pointer"
                        onClick={() => openUserDetail(user.userId, user)}
                      >
                        <td className="px-4 py-3.5 text-center font-bold">
                          {user.rank === 1 ? (
                            <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-amber-500/20 text-amber-300 text-xs font-bold border border-amber-500/30">
                              1
                            </span>
                          ) : user.rank === 2 ? (
                            <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-slate-400/20 text-slate-300 text-xs font-bold border border-slate-500/30">
                              2
                            </span>
                          ) : user.rank === 3 ? (
                            <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-amber-800/20 text-amber-500 text-xs font-bold border border-amber-700/30">
                              3
                            </span>
                          ) : (
                            <span className="text-slate-400 font-mono text-xs font-semibold">
                              #{user.rank}
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-3">
                            {user.avatarUrl ? (
                              <img
                                src={user.avatarUrl}
                                alt={user.name}
                                className="w-8 h-8 rounded-full object-cover border border-slate-700"
                              />
                            ) : (
                              <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-xs font-bold text-slate-300">
                                {user.name.charAt(0)}
                              </div>
                            )}
                            <div>
                              <div className="flex items-center gap-1.5">
                                <p className="font-bold text-white group-hover:text-red-400 transition-colors">
                                  {user.name}
                                </p>
                                {user.role === "SUPER_ADMIN" && (
                                  <span className="text-[9px] px-1.5 py-0.2 rounded font-semibold bg-red-500/15 text-red-400 border border-red-500/30">
                                    ADMIN
                                  </span>
                                )}
                              </div>
                              <p className="text-[10px] text-slate-400">
                                {user.email}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3.5">
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-800 text-slate-200 border border-slate-700">
                            <Award className="w-3.5 h-3.5 text-amber-400" />
                            {Number(user.finalScore ?? user.score).toFixed(1)} pts
                          </span>
                          <p className="text-[10px] text-slate-400 mt-0.5">
                            {user.goalCompletionRate}% goal rate ({user.daysLogged}d active)
                          </p>
                        </td>
                        <td className="px-4 py-3.5">
                          <span className="text-sm font-bold text-white">
                            {(user.totalCountedSteps || user.totalSteps).toLocaleString("en-US")}
                          </span>
                          <p className="text-[10px] text-amber-400 font-medium">
                            {Number(user.stepScore ?? 0).toFixed(1)} / 70 pts
                          </p>
                        </td>
                        <td className="px-4 py-3.5">
                          <span className="text-sm font-bold text-slate-200">
                            {user.goalsMetCount || 0} {user.goalsMetCount === 1 ? "day" : "days"}
                          </span>
                          <p className="text-[10px] text-emerald-400 font-medium">
                            {Number(user.consistencyScore ?? 0).toFixed(1)} / 30 pts
                          </p>
                        </td>
                        <td className="px-4 py-3.5">
                          {user.totalExcessSteps > 0 ? (
                            <span className="text-xs font-semibold text-slate-400 bg-slate-800/60 px-2 py-0.5 rounded border border-slate-700">
                              +{user.totalExcessSteps.toLocaleString("en-US")}
                            </span>
                          ) : (
                            <span className="text-slate-600 text-xs">-</span>
                          )}
                        </td>
                        <td className="px-4 py-3.5 text-right" onClick={(e) => e.stopPropagation()}>
                          <button
                            type="button"
                            onClick={() => openUserDetail(user.userId, user)}
                            className="px-2.5 py-1 text-[11px] font-semibold rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-colors inline-flex items-center gap-1 cursor-pointer"
                          >
                            <UserCog className="w-3 h-3 text-slate-400" />
                            <span>Details</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* User Detail & Role/Goal Management Modal */}
      <UserDetailModal
        isOpen={isDetailOpen}
        onClose={() => {
          setIsDetailOpen(false);
          setSelectedUserId(null);
          setSelectedUser(null);
        }}
        userId={selectedUserId}
        initialUser={selectedUser}
        startDate={startDate}
        endDate={endDate}
        onUpdateRole={handleUpdateRole}
      />
    </div>
  );
}
