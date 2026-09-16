"use client";

import { useState, useEffect } from "react";
import {
  ShieldCheck,
  Calendar,
  Footprints,
  TrendingUp,
  Users,
  Award,
  Search,
  CheckCircle2,
  UserCog,
  Maximize2,
  Minimize2,
  Trophy,
  Medal,
  UserPlus,
  Trash2,
  Eye,
  BarChart3,
  Filter,
  RefreshCw,
  KeyRound,
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
import CreateUserModal from "@/components/CreateUserModal";
import DeleteUserConfirmModal from "@/components/DeleteUserConfirmModal";
import ResetPasswordModal from "@/components/ResetPasswordModal";

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

  const [activeTab, setActiveTab] = useState<"analytics" | "users">("analytics");
  const [preset, setPreset] = useState<"today" | "7d" | "30d" | "month" | "custom">("7d");
  const [startDate, setStartDate] = useState<string>(last7DaysStr);
  const [endDate, setEndDate] = useState<string>(todayStr);
  const [showCustomDate, setShowCustomDate] = useState<boolean>(false);

  const [searchTerm, setSearchTerm] = useState<string>("");
  const [showAllInTable, setShowAllInTable] = useState<boolean>(false);

  const [analyticsData, setAnalyticsData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // User management state
  const [usersList, setUsersList] = useState<any[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [userSearchTerm, setUserSearchTerm] = useState("");
  const [userRoleFilter, setUserRoleFilter] = useState<"ALL" | "USER" | "SUPER_ADMIN">("ALL");
  const [isCreateUserOpen, setIsCreateUserOpen] = useState(false);
  const [deleteTargetUser, setDeleteTargetUser] = useState<any | null>(null);
  const [resetPasswordUser, setResetPasswordUser] = useState<any | null>(null);

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

  const fetchUsersList = async () => {
    setUsersLoading(true);
    try {
      const res = await fetch("/api/admin/users");
      if (res.ok) {
        const data = await res.json();
        setUsersList(data.users || []);
      }
    } catch (err) {
      console.error("Failed to fetch users list:", err);
    } finally {
      setUsersLoading(false);
    }
  };

  const fetchAnalytics = async (sDate: string, eDate: string, isSilent = false) => {
    if (!isSilent) setLoading(true);
    try {
      const res = await fetch(`/api/admin/analytics?startDate=${sDate}&endDate=${eDate}`);
      if (res.ok) {
        const data = await res.json();
        setAnalyticsData(data);
      }
    } catch (err) {
      console.error("Failed to fetch admin analytics:", err);
    } finally {
      if (!isSilent) setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics(startDate, endDate);
    fetchUsersList();
  }, []);

  // Smart Background Polling (15s interval + focus detection + visibility API)
  useEffect(() => {
    let intervalId: NodeJS.Timeout | null = null;

    const startPolling = () => {
      if (intervalId) clearInterval(intervalId);
      intervalId = setInterval(() => {
        if (!document.hidden && activeTab === "analytics") {
          fetchAnalytics(startDate, endDate, true);
        }
      }, 15000);
    };

    const handleVisibilityChange = () => {
      if (!document.hidden) {
        // Immediately fetch fresh data on tab return
        fetchAnalytics(startDate, endDate, true);
        startPolling();
      } else if (intervalId) {
        // Pause polling when tab is hidden to conserve server resources
        clearInterval(intervalId);
      }
    };

    const handleFocus = () => {
      if (!document.hidden && activeTab === "analytics") {
        fetchAnalytics(startDate, endDate, true);
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("focus", handleFocus);
    startPolling();

    return () => {
      if (intervalId) clearInterval(intervalId);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("focus", handleFocus);
    };
  }, [startDate, endDate, activeTab]);

  const handleQuickRoleChange = async (userId: string, newRole: "USER" | "SUPER_ADMIN") => {
    try {
      const res = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, role: newRole }),
      });
      if (res.ok) {
        await fetchUsersList();
        await fetchAnalytics(startDate, endDate);
      }
    } catch (err) {
      console.error("Failed to change role:", err);
    }
  };

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

  const handleUpdateRole = async (userId: string, newRole: "USER" | "SUPER_ADMIN", dailyGoal: number) => {
    try {
      const res = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, role: newRole, dailyGoal }),
      });
      if (res.ok) {
        await fetchUsersList();
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

  const rawTimeSeries = analyticsData?.timeSeriesData || [];
  const timeSeries = rawTimeSeries.map((item: any) => ({
    ...item,
    steps: Number(item.steps ?? item.totalSteps ?? 0),
    totalSteps: Number(item.totalSteps ?? item.steps ?? 0),
    dateFormatted: item.dateFormatted || item.displayDate || item.date || "",
  }));
  const rawLeaderboard = analyticsData?.leaderboard || [];

  // Filter leaderboard by search term (name or email)
  const filteredLeaderboard = rawLeaderboard.filter((u: any) => {
    return (
      u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  // Filter users for Employee Management tab
  const filteredUsersList = usersList.filter((u: any) => {
    const matchesSearch =
      u.name.toLowerCase().includes(userSearchTerm.toLowerCase()) ||
      u.email.toLowerCase().includes(userSearchTerm.toLowerCase()) ||
      (u.username && u.username.toLowerCase().includes(userSearchTerm.toLowerCase()));
    const matchesRole =
      userRoleFilter === "ALL" || u.role === userRoleFilter;
    return matchesSearch && matchesRole;
  });

  const totalAdminsCount = usersList.filter((u) => u.role === "SUPER_ADMIN").length;
  const totalRegularUsersCount = usersList.filter((u) => u.role === "USER").length;
  const totalLogsAcrossAllUsers = usersList.reduce((acc, u) => acc + (u._count?.stepLogs || 0), 0);

  // Top 3 Podium Walkers
  const top1 = rawLeaderboard[0];
  const top2 = rawLeaderboard[1];
  const top3 = rawLeaderboard[2];

  const hasPodium = rawLeaderboard.length >= 3 && !searchTerm;
  const tableDisplayList =
    hasPodium && !showAllInTable
      ? filteredLeaderboard.slice(3)
      : filteredLeaderboard;

  return (
    <div className="space-y-6 w-full">
      {/* 1. Executive Top Header with Ambient Glow */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 sm:p-7 rounded-3xl card-premium relative overflow-hidden group animate-fadeInUp bg-noise">
        {/* Subtle Ambient Decorative Glows */}
        <div className="absolute -top-16 -right-16 w-80 h-80 bg-red-600/12 rounded-full blur-[100px] pointer-events-none animate-orb-1" />
        <div className="absolute -bottom-16 -left-16 w-72 h-72 bg-rose-600/10 rounded-full blur-[100px] pointer-events-none animate-orb-2" />
        <div className="absolute top-1/2 left-1/3 w-96 h-96 bg-amber-500/5 rounded-full blur-[120px] pointer-events-none" />

        <div className="space-y-1.5 z-10">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-red-500/15 text-red-400 border border-red-500/30 flex items-center gap-1.5 uppercase tracking-wider">
              <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-ping" />
              <ShieldCheck className="w-3.5 h-3.5 text-red-500" />
              FID Super Admin
            </span>
            <span className="text-xs text-slate-400 font-medium">
              • {usersList.length || kpi.range.totalUsers} Registered Employees
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight gradient-text">
            Employee Activity & Analytics
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 max-w-2xl">
            Activity tracking with weighted scoring: 70% Counted Steps (max 10k/day) + 30% Target Consistency (8k/day goal).
          </p>
        </div>

        {/* Action Button: Add User */}
        <div className="flex flex-wrap items-center gap-3 z-10 shrink-0">
          <button
            onClick={() => setIsCreateUserOpen(true)}
            className="w-full sm:w-auto px-4 py-2.5 text-xs sm:text-sm font-bold rounded-xl text-white transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95 btn-primary"
          >
            <UserPlus className="w-4 h-4" />
            <span>Add New Employee</span>
          </button>
        </div>
      </div>

      {/* 2. Admin Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
        <button
          type="button"
          onClick={() => setActiveTab("analytics")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
            activeTab === "analytics"
              ? "bg-red-600 text-white shadow-lg shadow-red-600/20"
              : "bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800"
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          <span>Activity Analytics & Rankings</span>
        </button>

        <button
          type="button"
          onClick={() => {
            setActiveTab("users");
            fetchUsersList();
          }}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
            activeTab === "users"
              ? "bg-red-600 text-white shadow-lg shadow-red-600/20"
              : "bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800"
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Employee Directory & Access</span>
          <span className="ml-1 px-1.5 py-0.5 rounded-md text-[10px] bg-slate-800 text-slate-300 font-mono">
            {usersList.length}
          </span>
        </button>
      </div>

      {/* ========================================================= */}
      {/* TAB 1: ACTIVITY ANALYTICS & LEADERBOARD                   */}
      {/* ========================================================= */}
      {activeTab === "analytics" && (
        <div className="space-y-6 animate-in fade-in duration-150">
          {/* 3. Simplified Date Range Bar */}
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
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                    preset === "custom"
                      ? "bg-red-600 text-white shadow-sm"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  Custom
                </button>
              </div>
            </div>

            {/* Date Range Label & Live Status */}
            <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400">
              <div className="flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-red-400" />
                <span>
                  Active Range:{" "}
                  <strong className="text-slate-200">
                    {startDate} &rarr; {endDate}
                  </strong>
                </span>
              </div>

              {/* Live Polling Status Badge & Refresh Button */}
              <div className="flex items-center gap-1.5 pl-2 border-l border-slate-800">
                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Live Sync (15s)
                </span>
                <button
                  type="button"
                  onClick={() => fetchAnalytics(startDate, endDate)}
                  className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800 transition-colors cursor-pointer"
                  title="Force Refresh Data Now"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-red-400" : ""}`} />
                </button>
              </div>
            </div>
          </div>

          {/* Custom Date Picker Drawer */}
          {showCustomDate && (
            <form
              onSubmit={handleCustomDateSubmit}
              className="p-4 rounded-2xl bg-slate-900/90 border border-slate-700/80 flex flex-wrap items-center gap-3 animate-in fade-in duration-150"
            >
              <div className="flex items-center gap-2">
                <label className="text-xs text-slate-400 font-medium">From:</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-red-500"
                />
              </div>
              <div className="flex items-center gap-2">
                <label className="text-xs text-slate-400 font-medium">To:</label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-red-500"
                />
              </div>
              <button
                type="submit"
                className="px-3.5 py-1.5 rounded-lg bg-red-600 hover:bg-red-500 text-white text-xs font-bold transition-colors cursor-pointer"
              >
                Apply Range
              </button>
            </form>
          )}

          {/* 4. Overview KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Total Filtered Steps */}
            <div className="p-5 rounded-2xl card-premium card-accent-red animate-fadeInUp delay-1 group/card">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Total Range Steps
                </span>
                <div className="w-8 h-8 rounded-lg bg-red-500/10 text-red-400 flex items-center justify-center group-hover/card:bg-red-500/20 transition-colors">
                  <Footprints className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-3">
                <p className="text-2xl font-black text-white">
                  {kpi.range.totalSteps.toLocaleString("en-US")}
                </p>
                <p className="text-[11px] text-slate-400 mt-1">
                  Across all active employees
                </p>
              </div>
            </div>

            {/* Daily Average */}
            <div className="p-5 rounded-2xl card-premium card-accent-amber animate-fadeInUp delay-2 group/card">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Daily Step Avg
                </span>
                <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center group-hover/card:bg-amber-500/20 transition-colors">
                  <TrendingUp className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-3">
                <p className="text-2xl font-black text-white">
                  {kpi.range.avgStepsPerDay.toLocaleString("en-US")}
                </p>
                <p className="text-[11px] text-slate-400 mt-1">
                  Steps per day average
                </p>
              </div>
            </div>

            {/* Total Distance */}
            <div className="p-5 rounded-2xl card-premium card-accent-emerald animate-fadeInUp delay-3 group/card">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Total Distance
                </span>
                <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center group-hover/card:bg-emerald-500/20 transition-colors">
                  <Award className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-3">
                <p className="text-2xl font-black text-white">
                  {kpi.range.totalDistanceKm} <span className="text-sm font-semibold text-slate-400">km</span>
                </p>
                <p className="text-[11px] text-slate-400 mt-1">
                  ~{kpi.range.totalCalories.toLocaleString("en-US")} kcal burned
                </p>
              </div>
            </div>

            {/* Active Walkers */}
            <div className="p-5 rounded-2xl card-premium card-accent-teal animate-fadeInUp delay-4 group/card">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Active Walkers
                </span>
                <div className="w-8 h-8 rounded-lg bg-teal-500/10 text-teal-400 flex items-center justify-center group-hover/card:bg-teal-500/20 transition-colors">
                  <Users className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-3">
                <p className="text-2xl font-black text-white">
                  {kpi.range.uniqueWalkersCount} / {kpi.range.totalUsers}
                </p>
                <p className="text-[11px] text-slate-400 mt-1">
                  Logged activity in range
                </p>
              </div>
            </div>
          </div>

          {/* 5. Trend Chart */}
          <div className="p-6 rounded-3xl card-premium card-accent-rose animate-fadeInUp delay-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-base font-bold text-white tracking-tight">
                  Daily Step Trends
                </h2>
                <p className="text-xs text-slate-400">
                  Total collective steps logged across the company per day
                </p>
              </div>
              <span className="text-xs px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 font-mono">
                {timeSeries.length} Days Recorded
              </span>
            </div>

            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={timeSeries} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" vertical={false} />
                  <XAxis
                    dataKey="dateFormatted"
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
                    tickFormatter={(v) => (v >= 1000 ? `${(v / 1000).toFixed(0)}k` : `${v}`)}
                  />
                  <Tooltip
                    cursor={{ fill: "rgba(220, 38, 38, 0.08)" }}
                    content={({ active, payload, label }) => {
                      if (active && payload && payload.length) {
                        return (
                          <div className="p-3 rounded-xl bg-slate-900/95 border border-slate-700 shadow-xl text-xs text-slate-200">
                            <p className="font-bold text-white mb-1">{label}</p>
                            <p className="text-red-400 font-medium">
                              Total Steps: {Number(payload[0].value).toLocaleString("en-US")}
                            </p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Bar dataKey="steps" fill="#DC2626" radius={[6, 6, 0, 0]} maxBarSize={40} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* 6. Leaderboard & Rankings Section */}
          <div
            className={
              isLeaderboardMaximized
                ? "fixed inset-0 z-50 p-6 sm:p-8 bg-[#0B0F17]/98 backdrop-blur-2xl overflow-y-auto flex flex-col space-y-6 animate-in fade-in zoom-in-95 duration-200"
                : "p-6 sm:p-7 rounded-3xl bg-[#121826] border border-slate-800 shadow-xl space-y-6"
            }
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-800/80">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-bold text-white tracking-tight">
                    Leaderboard & Rankings
                  </h2>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-medium">
                    {rawLeaderboard.length} Participants
                  </span>
                  {isLeaderboardMaximized && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-500/20 text-red-300 border border-red-500/30 uppercase tracking-wider">
                      Fullscreen View
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  Ranked by 70% Counted Steps + 30% Target Consistency
                </p>
              </div>

              {/* Search and Maximize / Minimize Button */}
              <div className="flex items-center gap-3">
                <div className="relative flex-1 sm:w-64">
                  <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search participant..."
                    className="w-full bg-slate-900 border border-slate-700/80 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-red-500"
                  />
                </div>

                <button
                  type="button"
                  onClick={() => setIsLeaderboardMaximized(!isLeaderboardMaximized)}
                  className={`p-2 sm:px-3 sm:py-1.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-sm ${
                    isLeaderboardMaximized
                      ? "bg-red-500/20 text-red-300 border-red-500/40 hover:bg-red-500/30"
                      : "bg-slate-900 hover:bg-slate-800 border-slate-700/80 text-slate-300 hover:text-white"
                  }`}
                  title={isLeaderboardMaximized ? "Exit Fullscreen (ESC)" : "Maximize Leaderboard (Fullscreen View)"}
                >
                  {isLeaderboardMaximized ? (
                    <>
                      <Minimize2 className="w-4 h-4 text-red-400" />
                      <span className="hidden sm:inline">Exit Fullscreen (ESC)</span>
                    </>
                  ) : (
                    <>
                      <Maximize2 className="w-4 h-4 text-slate-300" />
                      <span className="hidden sm:inline">Maximize</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Podium (Top 3) */}
            {hasPodium && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                {/* 2nd Place */}
                {top2 && (
                  <div
                    onClick={() => openUserDetail(top2.userId, top2)}
                    className="p-5 rounded-2xl bg-slate-900/80 border border-slate-700/60 glass-card-hover cursor-pointer flex flex-col justify-between group shadow-md order-2 md:order-1"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <span className="w-7 h-7 rounded-lg bg-slate-800 text-slate-300 border border-slate-600 flex items-center justify-center text-xs font-black">
                          #2
                        </span>
                        <Medal className="w-4 h-4 text-slate-300" />
                      </div>
                      <span className="text-[10px] text-slate-400 font-semibold px-2 py-0.5 rounded bg-slate-800">
                        Silver
                      </span>
                    </div>
                    <div className="my-4 text-center">
                      <div className="w-14 h-14 mx-auto rounded-full bg-slate-800 border-2 border-slate-400 ring-silver flex items-center justify-center font-bold text-lg text-white mb-2 overflow-hidden shadow-sm">
                        {top2.avatarUrl ? (
                          <img src={top2.avatarUrl} alt={top2.name} className="w-full h-full object-cover" />
                        ) : (
                          top2.name.charAt(0)
                        )}
                      </div>
                      <h3 className="text-sm font-bold text-white group-hover:text-red-400 transition-colors truncate">
                        {top2.name}
                      </h3>
                      <p className="text-[11px] text-slate-400 truncate">{top2.email}</p>
                    </div>
                    <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800 text-center">
                      <p className="text-xs text-slate-400">Final Score</p>
                      <p className="text-xl font-black text-white">{Number(top2.finalScore || 0).toFixed(1)}</p>
                      <p className="text-[10px] text-slate-500 mt-0.5">
                        {Number(top2.totalCountedSteps || top2.countedSteps || 0).toLocaleString("en-US")} counted steps • {top2.goalsMetCount ?? top2.targetAchievedDays ?? 0} goal days
                      </p>
                    </div>
                  </div>
                )}

                {/* 1st Place (Gold Champion) */}
                {top1 && (
                  <div
                    onClick={() => {
                      triggerPodiumConfetti();
                      openUserDetail(top1.userId, top1);
                    }}
                    className="p-6 rounded-2xl bg-gradient-to-b from-amber-950/30 via-slate-900 to-slate-900 border border-amber-500/40 glass-card-hover cursor-pointer flex flex-col justify-between group shadow-xl relative order-1 md:order-2"
                  >
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-amber-500 text-slate-950 text-[10px] font-black tracking-wider uppercase shadow-md flex items-center gap-1">
                      <Trophy className="w-3 h-3" /> Champion
                    </div>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <span className="w-7 h-7 rounded-lg bg-amber-500 text-slate-950 flex items-center justify-center text-xs font-black shadow-sm">
                          #1
                        </span>
                        <Trophy className="w-4 h-4 text-amber-400" />
                      </div>
                      <span className="text-[10px] text-amber-300 font-bold px-2 py-0.5 rounded bg-amber-500/20 border border-amber-500/30">
                        Gold
                      </span>
                    </div>
                    <div className="my-4 text-center">
                      <div className="w-16 h-16 mx-auto rounded-full bg-slate-800 border-2 border-amber-400 ring-gold flex items-center justify-center font-bold text-xl text-white mb-2 overflow-hidden shadow-lg shadow-amber-500/20">
                        {top1.avatarUrl ? (
                          <img src={top1.avatarUrl} alt={top1.name} className="w-full h-full object-cover" />
                        ) : (
                          top1.name.charAt(0)
                        )}
                      </div>
                      <h3 className="text-base font-black text-white group-hover:text-amber-300 transition-colors truncate">
                        {top1.name}
                      </h3>
                      <p className="text-[11px] text-slate-400 truncate">{top1.email}</p>
                    </div>
                    <div className="p-3 rounded-xl bg-slate-950/80 border border-amber-500/30 text-center">
                      <p className="text-xs text-amber-300/80 font-medium">Final Score</p>
                      <p className="text-2xl font-black text-amber-400">{Number(top1.finalScore || 0).toFixed(1)}</p>
                      <p className="text-[10px] text-slate-400 mt-0.5">
                        {Number(top1.totalCountedSteps || top1.countedSteps || 0).toLocaleString("en-US")} counted steps • {top1.goalsMetCount ?? top1.targetAchievedDays ?? 0} goal days
                      </p>
                    </div>
                  </div>
                )}

                {/* 3rd Place */}
                {top3 && (
                  <div
                    onClick={() => openUserDetail(top3.userId, top3)}
                    className="p-5 rounded-2xl bg-slate-900/80 border border-amber-900/40 hover:border-amber-700/60 transition-all cursor-pointer flex flex-col justify-between group shadow-md order-3"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <span className="w-7 h-7 rounded-lg bg-amber-950 text-amber-400 border border-amber-800/60 flex items-center justify-center text-xs font-black">
                          #3
                        </span>
                        <Medal className="w-4 h-4 text-amber-500" />
                      </div>
                      <span className="text-[10px] text-amber-400 font-semibold px-2 py-0.5 rounded bg-amber-950/40">
                        Bronze
                      </span>
                    </div>
                    <div className="my-4 text-center">
                      <div className="w-14 h-14 mx-auto rounded-full bg-slate-800 border-2 border-amber-700/80 flex items-center justify-center font-bold text-lg text-white mb-2 overflow-hidden shadow-sm">
                        {top3.avatarUrl ? (
                          <img src={top3.avatarUrl} alt={top3.name} className="w-full h-full object-cover" />
                        ) : (
                          top3.name.charAt(0)
                        )}
                      </div>
                      <h3 className="text-sm font-bold text-white group-hover:text-red-400 transition-colors truncate">
                        {top3.name}
                      </h3>
                      <p className="text-[11px] text-slate-400 truncate">{top3.email}</p>
                    </div>
                    <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800 text-center">
                      <p className="text-xs text-slate-400">Final Score</p>
                      <p className="text-xl font-black text-white">{Number(top3.finalScore || 0).toFixed(1)}</p>
                      <p className="text-[10px] text-slate-500 mt-0.5">
                        {Number(top3.totalCountedSteps || top3.countedSteps || 0).toLocaleString("en-US")} counted steps • {top3.goalsMetCount ?? top3.targetAchievedDays ?? 0} goal days
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Leaderboard Table (Ranks 4+ or all) */}
            <div className="overflow-x-auto rounded-2xl border border-slate-800">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-900/90 text-slate-400 border-b border-slate-800">
                    <th className="px-4 py-3 font-bold uppercase tracking-wider w-14">Rank</th>
                    <th className="px-4 py-3 font-bold uppercase tracking-wider">Participant</th>
                    <th className="px-4 py-3 font-bold uppercase tracking-wider">Final Score</th>
                    <th className="px-4 py-3 font-bold uppercase tracking-wider">Counted Steps (70%)</th>
                    <th className="px-4 py-3 font-bold uppercase tracking-wider">Goal Consistency (30%)</th>
                    <th className="px-4 py-3 font-bold uppercase tracking-wider">Excess Steps</th>
                    <th className="px-4 py-3 font-bold uppercase tracking-wider text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {tableDisplayList.map((user: any) => (
                    <tr
                      key={user.userId}
                      onClick={() => openUserDetail(user.userId, user)}
                      className="table-row-hover transition-colors cursor-pointer border-b border-slate-800/40"
                    >
                      <td className="px-4 py-3.5 font-bold text-slate-300">
                        #{user.rank}
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-xs text-slate-200 shrink-0">
                            {user.name.charAt(0)}
                          </div>
                          <div>
                            <p className="font-bold text-slate-100">{user.name}</p>
                            <p className="text-[10px] text-slate-400">{user.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3.5">
                        <span className="font-black text-sm text-red-400">
                          {Number(user.finalScore || 0).toFixed(1)}
                        </span>
                      </td>
                      <td className="px-4 py-3.5">
                        <p className="font-semibold text-slate-200">
                          {Number(user.totalCountedSteps || user.countedSteps || 0).toLocaleString("en-US")} steps
                        </p>
                        <p className="text-[10px] text-slate-400">
                          {Number(user.stepScore || 0).toFixed(1)} / 70 pts
                        </p>
                      </td>
                      <td className="px-4 py-3.5">
                        <p className="font-semibold text-emerald-400">
                          {user.goalsMetCount ?? user.targetAchievedDays ?? 0} days ({Number(user.goalCompletionRate ?? user.consistencyRate ?? 0).toFixed(0)}%)
                        </p>
                        <p className="text-[10px] text-slate-400">
                          {Number(user.consistencyScore || 0).toFixed(1)} / 30 pts
                        </p>
                      </td>
                      <td className="px-4 py-3.5">
                        {user.totalExcessSteps > 0 ? (
                          <span className="text-xs font-semibold text-slate-400 bg-slate-800/60 px-2 py-0.5 rounded border border-slate-700">
                            +{Number(user.totalExcessSteps).toLocaleString("en-US")}
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
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 2: EMPLOYEE DIRECTORY & PRIVILEGE MANAGEMENT         */}
      {/* ========================================================= */}
      {activeTab === "users" && (
        <div className="space-y-6 animate-in fade-in duration-150">
          {/* Employee Directory Summary KPIs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-5 rounded-2xl bg-[#121826] border border-slate-800 shadow-md">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Total Employees
              </span>
              <p className="text-2xl font-black text-white mt-2">
                {usersList.length}
              </p>
              <p className="text-[11px] text-slate-400 mt-1">
                Registered in WalkRank system
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-[#121826] border border-slate-800 shadow-md">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Regular Users
              </span>
              <p className="text-2xl font-black text-teal-400 mt-2">
                {totalRegularUsersCount}
              </p>
              <p className="text-[11px] text-slate-400 mt-1">
                Standard participant privileges
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-[#121826] border border-slate-800 shadow-md">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Super Admins
              </span>
              <p className="text-2xl font-black text-red-400 mt-2">
                {totalAdminsCount}
              </p>
              <p className="text-[11px] text-slate-400 mt-1">
                Full executive & management access
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-[#121826] border border-slate-800 shadow-md">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Activity Records
              </span>
              <p className="text-2xl font-black text-amber-400 mt-2">
                {totalLogsAcrossAllUsers}
              </p>
              <p className="text-[11px] text-slate-400 mt-1">
                Total daily step entries logged
              </p>
            </div>
          </div>

          {/* Directory Toolbar */}
          <div className="p-5 rounded-2xl bg-[#121826] border border-slate-800 shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex flex-col sm:flex-row sm:items-center gap-3 flex-1">
              {/* Search Bar */}
              <div className="relative flex-1 max-w-md">
                <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                <input
                  type="text"
                  value={userSearchTerm}
                  onChange={(e) => setUserSearchTerm(e.target.value)}
                  placeholder="Filter by employee name or email..."
                  className="w-full bg-slate-900 border border-slate-700/80 rounded-xl pl-10 pr-3.5 py-2 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-red-500"
                />
              </div>

              {/* Role Filter */}
              <div className="flex items-center gap-1.5">
                <Filter className="w-4 h-4 text-slate-400" />
                <select
                  value={userRoleFilter}
                  onChange={(e) => setUserRoleFilter(e.target.value as any)}
                  className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-red-500 cursor-pointer"
                >
                  <option value="ALL">All Roles ({usersList.length})</option>
                  <option value="USER">Regular Users ({totalRegularUsersCount})</option>
                  <option value="SUPER_ADMIN">Super Admins ({totalAdminsCount})</option>
                </select>
              </div>
            </div>

            <button
              onClick={() => setIsCreateUserOpen(true)}
              className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-red-600 hover:bg-red-500 shadow-md shadow-red-600/20 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95 shrink-0"
            >
              <UserPlus className="w-4 h-4" />
              <span>+ Create Employee</span>
            </button>
          </div>

          {/* Employee Directory Table */}
          <div className="p-6 rounded-3xl bg-[#121826] border border-slate-800 shadow-xl overflow-hidden">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-bold text-white tracking-tight">
                  Employee Access & Records Directory
                </h3>
                <p className="text-xs text-slate-400">
                  Manage employee credentials, system roles, daily step targets, and account deletions
                </p>
              </div>
              <span className="text-xs font-mono text-slate-400 bg-slate-900 px-2.5 py-1 rounded-lg border border-slate-800">
                {filteredUsersList.length} Accounts Found
              </span>
            </div>

            <div className="overflow-x-auto rounded-2xl border border-slate-800">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-900/90 text-slate-400 border-b border-slate-800">
                    <th className="px-4 py-3.5 font-bold uppercase tracking-wider">Employee</th>
                    <th className="px-4 py-3.5 font-bold uppercase tracking-wider">System Role</th>
                    <th className="px-4 py-3.5 font-bold uppercase tracking-wider">Daily Goal</th>
                    <th className="px-4 py-3.5 font-bold uppercase tracking-wider">Activity Logs</th>
                    <th className="px-4 py-3.5 font-bold uppercase tracking-wider">Joined Date</th>
                    <th className="px-4 py-3.5 font-bold uppercase tracking-wider text-right">Privilege Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {filteredUsersList.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-8 text-center text-slate-500">
                        No employees found matching &quot;{userSearchTerm}&quot;
                      </td>
                    </tr>
                  ) : (
                    filteredUsersList.map((user: any) => {
                      const isCurrentUser = user.id === currentUser.id;
                      return (
                        <tr key={user.id} className="hover:bg-slate-800/40 transition-colors">
                          {/* Employee Info */}
                          <td className="px-4 py-3.5">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-xs text-slate-200 shrink-0">
                                {user.avatarUrl ? (
                                  <img
                                    src={user.avatarUrl}
                                    alt={user.name}
                                    className="w-full h-full object-cover rounded-full"
                                  />
                                ) : (
                                  user.name.charAt(0)
                                )}
                              </div>
                              <div>
                                <div className="flex items-center gap-1.5">
                                  <p className="font-bold text-slate-100">{user.name}</p>
                                  {isCurrentUser && (
                                    <span className="px-1.5 py-0.2 text-[9px] font-bold rounded bg-red-500/20 text-red-300 border border-red-500/30">
                                      YOU
                                    </span>
                                  )}
                                </div>
                                <p className="text-[11px] text-slate-400 font-mono">
                                  {user.username ? (
                                    <span className="text-slate-300 font-semibold">@{user.username} • </span>
                                  ) : null}
                                  {user.email}
                                </p>
                              </div>
                            </div>
                          </td>

                          {/* Role Selector */}
                          <td className="px-4 py-3.5">
                            <select
                              value={user.role}
                              disabled={isCurrentUser}
                              onChange={(e) =>
                                handleQuickRoleChange(user.id, e.target.value as "USER" | "SUPER_ADMIN")
                              }
                              className={`text-xs font-bold rounded-lg px-2.5 py-1 border transition-colors cursor-pointer ${
                                user.role === "SUPER_ADMIN"
                                  ? "bg-red-500/15 text-red-400 border-red-500/30"
                                  : "bg-slate-800 text-slate-300 border-slate-700"
                              } disabled:opacity-75 disabled:cursor-not-allowed`}
                            >
                              <option value="USER">USER</option>
                              <option value="SUPER_ADMIN">SUPER_ADMIN</option>
                            </select>
                          </td>

                          {/* Daily Goal */}
                          <td className="px-4 py-3.5">
                            <span className="font-semibold text-slate-200">
                              {Number(user.dailyGoal || 8000).toLocaleString("en-US")}{" "}
                              <span className="text-slate-400 text-[10px]">steps/day</span>
                            </span>
                          </td>

                          {/* Activity Logs Count */}
                          <td className="px-4 py-3.5">
                            <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono">
                              {user._count?.stepLogs || 0} days
                            </span>
                          </td>

                          {/* Joined Date */}
                          <td className="px-4 py-3.5 text-slate-400 font-mono text-[11px]">
                            {user.createdAt ? new Date(user.createdAt).toLocaleDateString("en-GB") : "-"}
                          </td>

                          {/* Actions */}
                          <td className="px-4 py-3.5 text-right">
                            <div className="inline-flex items-center gap-1.5">
                              {/* View Details Button */}
                              <button
                                type="button"
                                onClick={() => openUserDetail(user.id, user)}
                                className="px-2.5 py-1 text-[11px] font-semibold rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-colors inline-flex items-center gap-1 cursor-pointer"
                                title="View Step Logs & Activity"
                              >
                                <Eye className="w-3.5 h-3.5 text-slate-400" />
                                <span>Activity</span>
                              </button>

                              {/* Reset Password Button */}
                              <button
                                type="button"
                                onClick={() => setResetPasswordUser(user)}
                                className="px-2.5 py-1 text-[11px] font-semibold rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 hover:border-amber-400 transition-colors inline-flex items-center gap-1 cursor-pointer"
                                title="Reset Employee Password"
                              >
                                <KeyRound className="w-3.5 h-3.5 text-amber-400" />
                                <span>Reset Pwd</span>
                              </button>

                              {/* Delete User Button (with Confirmation Dialog) */}
                              <button
                                type="button"
                                disabled={isCurrentUser}
                                onClick={() => setDeleteTargetUser(user)}
                                className={`px-2.5 py-1 text-[11px] font-semibold rounded-lg border transition-colors inline-flex items-center gap-1 ${
                                  isCurrentUser
                                    ? "bg-slate-900 text-slate-600 border-slate-800 cursor-not-allowed"
                                    : "bg-rose-950/30 hover:bg-rose-900/50 text-rose-300 border-rose-500/30 hover:border-rose-400 cursor-pointer"
                                }`}
                                title={isCurrentUser ? "Cannot delete own account" : "Delete Employee Account"}
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                                <span>Delete</span>
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODALS                                                    */}
      {/* ========================================================= */}

      {/* 1. Create User Modal */}
      <CreateUserModal
        isOpen={isCreateUserOpen}
        onClose={() => setIsCreateUserOpen(false)}
        onUserCreated={() => {
          fetchUsersList();
          fetchAnalytics(startDate, endDate);
        }}
      />

      {/* 2. Delete User Confirmation Modal */}
      <DeleteUserConfirmModal
        isOpen={!!deleteTargetUser}
        onClose={() => setDeleteTargetUser(null)}
        user={deleteTargetUser}
        onUserDeleted={() => {
          fetchUsersList();
          fetchAnalytics(startDate, endDate);
        }}
      />

      {/* 3. User Detail & Activity Modal */}
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
        onResetPassword={(u) => setResetPasswordUser(u)}
      />

      {/* 4. Reset Password Modal */}
      <ResetPasswordModal
        isOpen={!!resetPasswordUser}
        onClose={() => setResetPasswordUser(null)}
        user={resetPasswordUser}
      />
    </div>
  );
}
