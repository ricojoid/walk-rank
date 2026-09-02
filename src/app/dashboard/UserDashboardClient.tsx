"use client";

import { useState, useEffect, useRef, useTransition } from "react";
import {
  Footprints,
  Flame,
  Navigation,
  Calendar,
  CheckCircle2,
  TrendingUp,
  Award,
  Plus,
  Trash2,
  Edit2,
  Clock,
  Sparkles,
  Zap,
  Target,
  ArrowUpRight,
  Filter,
  UserCog,
  Camera,
  Upload,
  Image as ImageIcon,
  AlertCircle,
  Check,
  RefreshCw,
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import StepLogModal from "@/components/StepLogModal";
import MaximizedLeaderboardModal from "@/components/MaximizedLeaderboardModal";
import ProfileEditModal from "@/components/ProfileEditModal";
import EvidenceViewerModal from "@/components/EvidenceViewerModal";
import confetti from "canvas-confetti";
import { Maximize2 } from "lucide-react";

interface UserDashboardClientProps {
  initialUser: {
    id: string;
    name: string;
    username?: string | null;
    email: string;
    role: "USER" | "SUPER_ADMIN";
    department?: string | null;
    avatarUrl?: string | null;
    dailyGoal: number;
  };
}

export default function UserDashboardClient({ initialUser }: UserDashboardClientProps) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [chartRange, setChartRange] = useState<"7d" | "30d">("7d");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [editLog, setEditLog] = useState<any>(null);
  const [todayInputSteps, setTodayInputSteps] = useState<number>(0);
  const [todayInputNote, setTodayInputNote] = useState<string>("");
  const [todayEvidenceUrl, setTodayEvidenceUrl] = useState<string | null>(null);
  const [quickSaveError, setQuickSaveError] = useState<string>("");
  const [quickSaveSuccess, setQuickSaveSuccess] = useState<string>("");
  const [selectedEvidence, setSelectedEvidence] = useState<any>(null);
  const [saveLoading, setSaveLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState<string | null>(null);
  const [isLeaderboardMaximized, setIsLeaderboardMaximized] = useState(false);
  const quickFileInputRef = useRef<HTMLInputElement>(null);

  const fetchDashboardData = async (isSilent = false) => {
    try {
      if (!isSilent) setLoading(true);
      const res = await fetch("/api/steps?limit=60");
      if (res.ok) {
        const json = await res.json();
        setData(json);
        // Only update today's input form fields on manual/initial load (not during silent background polling)
        if (json.today && !isSilent) {
          setTodayInputSteps(json.today.stepCount || 0);
          setTodayInputNote(json.today.note || "");
          setTodayEvidenceUrl(json.today.evidenceUrl || null);
        }
      }
    } catch (err) {
      console.error("Error fetching steps:", err);
    } finally {
      if (!isSilent) setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  // Smart Background Polling (15s interval + focus detection + visibility API)
  useEffect(() => {
    let intervalId: NodeJS.Timeout | null = null;

    const startPolling = () => {
      if (intervalId) clearInterval(intervalId);
      intervalId = setInterval(() => {
        if (!document.hidden) {
          fetchDashboardData(true);
        }
      }, 15000);
    };

    const handleVisibilityChange = () => {
      if (!document.hidden) {
        // Immediately fetch fresh rankings on tab focus
        fetchDashboardData(true);
        startPolling();
      } else if (intervalId) {
        // Pause polling when tab is hidden to conserve resources
        clearInterval(intervalId);
      }
    };

    const handleFocus = () => {
      if (!document.hidden) {
        fetchDashboardData(true);
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
  }, []);

  const handleQuickFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setQuickSaveError("Evidence file size exceeds 5MB limit.");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === "string") {
        setTodayEvidenceUrl(reader.result);
        setQuickSaveError("");
      }
    };
    reader.readAsDataURL(file);
  };

  const handleQuickSaveToday = async (e: React.FormEvent) => {
    e.preventDefault();
    setQuickSaveError("");
    setQuickSaveSuccess("");

    if (todayInputSteps > 0 && !todayEvidenceUrl) {
      setQuickSaveError("Photo evidence is mandatory. Please upload a screenshot/photo of your step count.");
      return;
    }

    setSaveLoading(true);
    try {
      const todayStr = new Date().toISOString().split("T")[0];
      const res = await fetch("/api/steps", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date: todayStr,
          stepCount: todayInputSteps,
          note: todayInputNote,
          evidenceUrl: todayEvidenceUrl,
        }),
      });

      const resData = await res.json();
      if (!res.ok) {
        throw new Error(resData.error || "Failed to save steps.");
      }

      setQuickSaveSuccess("Today's activity saved successfully!");
      if (todayInputSteps >= initialUser.dailyGoal) {
        try {
          confetti({ particleCount: 70, spread: 60, origin: { y: 0.6 } });
        } catch {}
      }
      await fetchDashboardData();
      setTimeout(() => setQuickSaveSuccess(""), 4000);
    } catch (err: any) {
      setQuickSaveError(err.message || "Failed to save step activity.");
    } finally {
      setSaveLoading(false);
    }
  };

  const handleDeleteLog = async (id: string) => {
    if (!confirm("Apakah Anda yakin ingin menghapus data langkah ini?")) return;
    setDeleteLoading(id);
    try {
      const res = await fetch(`/api/steps/${id}`, { method: "DELETE" });
      if (res.ok) {
        await fetchDashboardData();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setDeleteLoading(null);
    }
  };

  const handleOpenEdit = (log: any) => {
    setEditLog(log);
    setIsModalOpen(true);
  };

  const handleOpenNew = () => {
    setEditLog(null);
    setIsModalOpen(true);
  };

  if (loading && !data) {
    return (
      <div className="py-20 flex flex-col items-center justify-center text-slate-400 gap-3">
        <div className="w-10 h-10 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin" />
        <p className="text-sm font-medium">Memuat Dashboard Langkah...</p>
      </div>
    );
  }

  const todayLog = data?.today || { stepCount: 0 };
  const stats = {
    totalSteps: data?.stats?.totalSteps ?? 0,
    totalDistance: data?.stats?.totalDistance ?? 0,
    totalCalories: data?.stats?.totalCalories ?? 0,
    avgSteps: data?.stats?.avgSteps ?? 0,
    maxSteps: data?.stats?.maxSteps ?? 0,
    logDaysCount: data?.stats?.logDaysCount ?? 0,
    streak: data?.stats?.streak ?? 0,
    dailyGoal: data?.stats?.dailyGoal ?? initialUser?.dailyGoal ?? 8000,
  };
  const logs = data?.logs || [];
  const miniLeaderboard = data?.miniLeaderboard || [];

  const goal = Number(stats.dailyGoal) || 8000;
  const todayProgress = Math.min(100, Math.round((todayLog.stepCount / goal) * 100));
  const isGoalReached = todayLog.stepCount >= goal;

  // Prepare chart data
  const chartDays = chartRange === "7d" ? 7 : 30;
  const chartData = [];
  const now = new Date();

  for (let i = chartDays - 1; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split("T")[0];
    const displayLabel = d.toLocaleDateString("en-US", {
      weekday: chartDays === 7 ? "short" : undefined,
      day: "numeric",
      month: chartDays > 7 ? "short" : undefined,
    });

    const matchingLog = logs.find((l: any) => {
      const logDateStr = new Date(l.date).toISOString().split("T")[0];
      return logDateStr === dateStr;
    });

    chartData.push({
      date: dateStr,
      label: displayLabel,
      steps: matchingLog ? matchingLog.stepCount : 0,
      goal: goal,
    });
  }

  return (
    <div className="space-y-6">
      {/* Top Banner & Greeting with Ambient Glow */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 sm:p-7 rounded-3xl card-premium relative overflow-hidden shadow-xl group animate-fadeInUp bg-noise">
        {/* Subtle Ambient Decorative Glows */}
        <div className="absolute -top-16 -right-16 w-80 h-80 bg-red-600/12 rounded-full blur-[100px] pointer-events-none animate-orb-1" />
        <div className="absolute -bottom-16 -left-16 w-72 h-72 bg-amber-500/10 rounded-full blur-[100px] pointer-events-none animate-orb-2" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-rose-500/5 rounded-full blur-[120px] pointer-events-none" />

        <div className="space-y-1.5 z-10">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-slate-800/90 text-slate-300 border border-slate-700 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
              {new Date().toLocaleDateString("en-US", {
                weekday: "long",
                month: "long",
                day: "numeric",
                year: "numeric",
              })}
            </span>
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/30 flex items-center gap-1.5 shadow-sm shadow-amber-500/10 animate-float-slow">
              <Flame className="w-3.5 h-3.5 text-amber-400" />
              {stats.streak} Day Streak
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight gradient-text">
            Welcome back, {initialUser.name}
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 flex items-center gap-1.5">
            <span>Daily Target:</span>
            <span className="text-slate-200 font-bold px-2 py-0.5 rounded-md bg-slate-800/80 border border-slate-700/60 font-mono">
              {goal.toLocaleString("en-US")} Steps
            </span>
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 z-10">
          <button
            onClick={() => setIsProfileModalOpen(true)}
            className="px-3.5 py-2.5 text-xs sm:text-sm font-bold rounded-xl bg-slate-800/90 hover:bg-slate-700 text-slate-200 border border-slate-700 flex items-center gap-1.5 transition-all cursor-pointer shadow-sm hover:scale-[1.02] active:scale-95"
          >
            <UserCog className="w-4 h-4 text-slate-400" />
            <span>Edit Profile</span>
          </button>

          <button
            onClick={handleOpenNew}
            className="px-3.5 py-2.5 text-xs sm:text-sm font-bold rounded-xl bg-slate-800/90 hover:bg-slate-700 text-slate-200 border border-slate-700 flex items-center gap-1.5 transition-all cursor-pointer shadow-sm hover:scale-[1.02] active:scale-95"
          >
            <Calendar className="w-4 h-4 text-slate-400" />
            <span>Log Previous Day</span>
          </button>
        </div>
      </div>

      {/* Main Grid: Step Logger & Radial Goal Progress */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Step Logger Form Card */}
        <div className="lg:col-span-2 rounded-3xl card-premium card-accent-red p-6 relative overflow-hidden flex flex-col justify-between animate-fadeInUp delay-1">
          <div>
            <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-red-500/10 text-red-500 border border-red-500/20">
                  <Footprints className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="font-bold text-base sm:text-lg text-white">
                    Log Today's Steps
                  </h2>
                  <p className="text-xs text-slate-400">
                    Record your daily walking activity
                  </p>
                </div>
              </div>

              {isGoalReached && (
                <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                  <CheckCircle2 className="w-4 h-4" /> Goal Achieved Today!
                </span>
              )}
            </div>

            {quickSaveError && (
              <div className="mb-3 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2 animate-in fade-in duration-150">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{quickSaveError}</span>
              </div>
            )}

            {quickSaveSuccess && (
              <div className="mb-3 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2 animate-in fade-in duration-150">
                <Check className="w-4 h-4 shrink-0" />
                <span>{quickSaveSuccess}</span>
              </div>
            )}

            <form onSubmit={handleQuickSaveToday} className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold text-slate-300">
                    Today's Step Count
                  </label>
                  <span className="text-xs font-mono text-slate-400">
                    Logged: {todayLog.stepCount.toLocaleString("en-US")} steps
                  </span>
                </div>
                <div className="relative">
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={todayInputSteps === 0 ? "" : todayInputSteps}
                    onChange={(e) =>
                      setTodayInputSteps(Math.max(0, parseInt(e.target.value) || 0))
                    }
                    placeholder="e.g. 8500"
                    required
                    className="w-full bg-slate-900/90 border border-slate-700/80 rounded-2xl px-5 py-4 text-2xl sm:text-3xl font-black text-white tracking-wider focus:outline-none focus:ring-1 focus:ring-red-500"
                  />
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-1.5 text-xs text-slate-400 font-medium">
                    <span>steps</span>
                  </div>
                </div>

                {/* Booster Buttons */}
                <div className="flex flex-wrap items-center gap-2 mt-3">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    Quick Add:
                  </span>
                  {[500, 1000, 2500, 5000].map((val) => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => setTodayInputSteps((prev) => prev + val)}
                      className="px-3 py-1.5 text-xs font-semibold rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-all cursor-pointer"
                    >
                      +{val.toLocaleString("en-US")}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => setTodayInputSteps(0)}
                    className="px-2.5 py-1.5 text-xs font-medium rounded-xl text-slate-400 hover:text-rose-400 hover:bg-rose-950/20 transition-colors ml-auto cursor-pointer"
                  >
                    Reset
                  </button>
                </div>
              </div>

              {/* Dynamic conversion calculator */}
              <div className="grid grid-cols-2 sm:grid-cols-2 gap-3 p-3.5 rounded-2xl bg-slate-900/70 border border-slate-800">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
                    <Navigation className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-[10px] font-semibold text-slate-400 uppercase">
                      Est. Distance
                    </p>
                    <p className="text-base font-bold text-blue-300">
                      {(todayInputSteps * 0.00076).toFixed(2)}{" "}
                      <span className="text-xs font-normal text-slate-400">km</span>
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
                    <Flame className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-[10px] font-semibold text-slate-400 uppercase">
                      Calories Burned
                    </p>
                    <p className="text-base font-bold text-amber-300">
                      {Math.round(todayInputSteps * 0.042).toLocaleString("en-US")}{" "}
                      <span className="text-xs font-normal text-slate-400">kcal</span>
                    </p>
                  </div>
                </div>
              </div>

              {/* Photo Evidence Upload (Mandatory) */}
              <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                    <Camera className="w-3.5 h-3.5 text-red-400" />
                    <span>Photo Evidence <span className="text-red-400">*</span></span>
                  </label>
                  <span className="text-[10px] text-slate-400">Smartwatch / Pedometer Screenshot</span>
                </div>

                <input
                  ref={quickFileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleQuickFileUpload}
                  className="hidden"
                />

                {todayEvidenceUrl ? (
                  <div className="relative rounded-xl overflow-hidden border border-slate-700 bg-slate-950/70 p-2.5 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 overflow-hidden">
                      <img
                        src={todayEvidenceUrl}
                        alt="Evidence Preview"
                        className="w-12 h-12 rounded-lg object-cover border border-slate-700 shrink-0"
                      />
                      <div className="text-left truncate">
                        <p className="text-xs font-semibold text-emerald-400 flex items-center gap-1">
                          <Check className="w-3.5 h-3.5" /> Evidence Attached
                        </p>
                        <p className="text-[10px] text-slate-400 truncate">Ready for admin verification</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => quickFileInputRef.current?.click()}
                        className="px-2.5 py-1 text-[11px] font-semibold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg border border-slate-700 transition-colors cursor-pointer"
                      >
                        Change
                      </button>
                      <button
                        type="button"
                        onClick={() => setTodayEvidenceUrl(null)}
                        className="p-1 text-slate-400 hover:text-rose-400 rounded-lg hover:bg-rose-950/20 transition-colors cursor-pointer"
                        title="Remove Photo"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => quickFileInputRef.current?.click()}
                    className="w-full py-3.5 border-2 border-dashed border-slate-700 hover:border-red-500/60 rounded-xl flex flex-col items-center justify-center gap-1 bg-slate-950/40 hover:bg-slate-900/60 transition-all cursor-pointer group"
                  >
                    <Upload className="w-4 h-4 text-slate-500 group-hover:text-red-400 transition-colors" />
                    <span className="text-xs font-semibold text-slate-300 group-hover:text-white transition-colors">
                      Upload Step Count Photo / Screenshot
                    </span>
                    <span className="text-[10px] text-slate-500">Supports JPG, PNG, WEBP (Max 5MB)</span>
                  </button>
                )}
              </div>

              {/* Note input */}
              <div>
                <input
                  type="text"
                  value={todayInputNote}
                  onChange={(e) => setTodayInputNote(e.target.value)}
                  placeholder="Add notes (e.g., Morning walk, plant inspection)..."
                  className="w-full bg-slate-900/90 border border-slate-700/80 rounded-xl px-4 py-2.5 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-red-500"
                />
              </div>

              <button
                type="submit"
                disabled={saveLoading}
                className="w-full py-3 rounded-2xl font-bold text-sm text-white bg-red-600 hover:bg-red-500 shadow-lg shadow-red-600/20 transition-all active:scale-98 disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2"
              >
                <Footprints className="w-4 h-4" />
                {saveLoading ? "Saving Activity..." : "Save Today's Steps"}
              </button>
            </form>
          </div>
        </div>

        {/* Circular Progress & Goal Card */}
        <div className="rounded-3xl card-premium p-6 flex flex-col items-center justify-between text-center relative overflow-hidden animate-fadeInUp delay-2">
          <div className="w-full flex items-center justify-between pb-3 border-b border-slate-800">
            <h3 className="font-bold text-sm text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <Target className="w-4 h-4 text-red-500" />
              Daily Target
            </h3>
            <span className="text-xs font-bold text-slate-200">
              {goal.toLocaleString("en-US")} Steps
            </span>
          </div>

          {/* SVG Progress Circle */}
          <div className="relative my-4 flex items-center justify-center">
            <svg className={`w-44 h-44 transform -rotate-90 ${isGoalReached ? 'progress-glow-achieved' : 'progress-glow'}`}>
              <defs>
                <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#ef4444" />
                  <stop offset="50%" stopColor="#f43f5e" />
                  <stop offset="100%" stopColor="#f97316" />
                </linearGradient>
                <linearGradient id="achievedGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#10b981" />
                  <stop offset="50%" stopColor="#34d399" />
                  <stop offset="100%" stopColor="#6ee7b7" />
                </linearGradient>
              </defs>
              <circle
                cx="88"
                cy="88"
                r="72"
                stroke="currentColor"
                strokeWidth="12"
                className="text-slate-800/50"
                fill="transparent"
              />
              <circle
                cx="88"
                cy="88"
                r="72"
                stroke={isGoalReached ? 'url(#achievedGradient)' : 'url(#progressGradient)'}
                strokeWidth="12"
                strokeDasharray={452.39}
                strokeDashoffset={452.39 - (452.39 * todayProgress) / 100}
                strokeLinecap="round"
                className="transition-all duration-1000 ease-out"
                fill="transparent"
              />
            </svg>

            <div className="absolute flex flex-col items-center justify-center">
              <span className="text-3xl font-black text-white">
                {todayLog.stepCount.toLocaleString("en-US")}
              </span>
              <span className="text-xs text-slate-400 font-medium">of {goal.toLocaleString("en-US")}</span>
              <span className="text-xs font-extrabold text-red-400 mt-1">
                {todayProgress}%
              </span>
            </div>
          </div>

          <div className="w-full p-3 rounded-2xl bg-slate-900/80 border border-slate-800 text-xs">
            {isGoalReached ? (
              <p className="text-emerald-300 font-bold flex items-center justify-center gap-1">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                Great job! Today's goal achieved!
              </p>
            ) : (
              <p className="text-slate-400">
                <span className="text-white font-bold">
                  {(goal - todayLog.stepCount).toLocaleString("en-US")}
                </span>{" "}
                more steps to reach today's target.
              </p>
            )}
          </div>
        </div>
      </div>

      {/* 4 KPI Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl card-premium card-accent-red animate-fadeInUp delay-3 group/card">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Total Steps
            </span>
            <div className="p-2 rounded-xl bg-red-500/10 text-red-500 group-hover/card:bg-red-500/20 transition-colors">
              <Footprints className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-white mt-2">
            {stats.totalSteps.toLocaleString("en-US")}
          </p>
          <p className="text-[11px] text-slate-500 mt-1">{stats.logDaysCount} days active</p>
        </div>

        <div className="p-5 rounded-2xl card-premium card-accent-blue animate-fadeInUp delay-4 group/card">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Total Distance
            </span>
            <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400 group-hover/card:bg-blue-500/20 transition-colors">
              <Navigation className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-blue-300 mt-2">{stats.totalDistance} km</p>
          <p className="text-[11px] text-slate-500 mt-1">Cumulative mileage</p>
        </div>

        <div className="p-5 rounded-2xl card-premium card-accent-amber animate-fadeInUp delay-5 group/card">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Total Calories
            </span>
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 group-hover/card:bg-amber-500/20 transition-colors">
              <Flame className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-amber-300 mt-2">
            {stats.totalCalories.toLocaleString("en-US")} kcal
          </p>
          <p className="text-[11px] text-slate-500 mt-1">Energy burned</p>
        </div>

        <div className="p-5 rounded-2xl card-premium card-accent-teal animate-fadeInUp delay-6 group/card">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Daily Average
            </span>
            <div className="p-2 rounded-xl bg-teal-500/10 text-teal-400 group-hover/card:bg-teal-500/20 transition-colors">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-teal-300 mt-2">
            {stats.avgSteps.toLocaleString("en-US")}
          </p>
          <p className="text-[11px] text-slate-500 mt-1">
            Peak: {stats.maxSteps.toLocaleString("en-US")} steps
          </p>
        </div>
      </div>

      {/* Chart & Mini Leaderboard Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Step Trend Chart */}
        <div className="lg:col-span-2 rounded-3xl card-premium card-accent-rose p-6 flex flex-col justify-between animate-fadeInUp delay-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 mb-4 border-b border-slate-800">
            <div>
              <h3 className="font-bold text-base text-white flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-red-500" />
                My Step Trend
              </h3>
              <p className="text-xs text-slate-400">
                Visualization of your daily walking consistency
              </p>
            </div>

            <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-900 border border-slate-800">
              <button
                type="button"
                onClick={() => setChartRange("7d")}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  chartRange === "7d"
                    ? "bg-red-600 text-white shadow"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                Last 7 Days
              </button>
              <button
                type="button"
                onClick={() => setChartRange("30d")}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  chartRange === "30d"
                    ? "bg-red-600 text-white shadow"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                Last 30 Days
              </button>
            </div>
          </div>

          <div className="h-64 sm:h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="stepGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#EF4444" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#EF4444" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <XAxis
                  dataKey="label"
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
                  tickFormatter={(val) => `${val / 1000}k`}
                />
                <Tooltip
                  cursor={false}
                  contentStyle={{
                    backgroundColor: "#0F172A",
                    borderColor: "#334155",
                    borderRadius: "12px",
                    color: "#F8FAFC",
                    fontSize: "12px",
                  }}
                  formatter={(val: any) => [`${Number(val).toLocaleString("en-US")} steps`, "Steps"]}
                />
                <ReferenceLine
                  y={goal}
                  stroke="#EF4444"
                  strokeDasharray="3 3"
                  label={{
                    value: `Goal: ${goal / 1000}k`,
                    fill: "#EF4444",
                    fontSize: 10,
                    position: "insideTopRight",
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="steps"
                  stroke="#EF4444"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#stepGradient)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Mini Community Leaderboard Today */}
        <div className="rounded-3xl bg-[#121826] border border-slate-800 p-6 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-sm text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                  <Award className="w-4 h-4 text-amber-400" />
                  Today's Leaderboard
                </h3>
                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Live (15s)
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => fetchDashboardData(false)}
                  className="p-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer"
                  title="Refresh Leaderboard"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-red-400" : ""}`} />
                </button>
                <button
                  type="button"
                  onClick={() => setIsLeaderboardMaximized(true)}
                  className="p-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
                  title="Maximize Leaderboard"
                >
                  <Maximize2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            <div className="space-y-2 mt-3">
              {miniLeaderboard.length === 0 ? (
                <div className="p-6 text-center text-xs text-slate-500">
                  No activity logged today yet. Be the first!
                </div>
              ) : (
                miniLeaderboard.map((item: any, idx: number) => {
                  return (
                    <div
                      key={item.userId}
                      onClick={() => setIsLeaderboardMaximized(true)}
                      className={`p-2.5 rounded-xl border flex items-center justify-between transition-all cursor-pointer ${
                        item.isCurrentUser
                          ? "bg-red-950/30 border-red-500/40 text-red-200"
                          : "bg-slate-900/60 border-slate-800/80 text-slate-300 hover:border-slate-700"
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <span className="w-5 text-center text-xs font-bold">
                          {idx === 0 ? (
                            <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-amber-500/20 text-amber-300 text-[10px]">1</span>
                          ) : idx === 1 ? (
                            <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-slate-400/20 text-slate-300 text-[10px]">2</span>
                          ) : idx === 2 ? (
                            <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-amber-800/20 text-amber-500 text-[10px]">3</span>
                          ) : (
                            <span className="text-slate-500">#{item.rank}</span>
                          )}
                        </span>
                        {item.avatarUrl ? (
                          <img
                            src={item.avatarUrl}
                            alt={item.name}
                            className="w-7 h-7 rounded-full object-cover border border-slate-700"
                          />
                        ) : (
                          <div className="w-7 h-7 rounded-full bg-slate-800 flex items-center justify-center text-[10px] font-bold text-slate-300">
                            {item.name.charAt(0)}
                          </div>
                        )}
                        <div>
                          <p className="text-xs font-bold truncate max-w-[130px]">
                            {item.name}{" "}
                            {item.isCurrentUser && (
                              <span className="text-[9px] text-red-400 font-normal">(You)</span>
                            )}
                          </p>
                        </div>
                      </div>

                      <div className="text-right">
                        <p className="text-xs font-black text-white">
                          {item.stepCount.toLocaleString("en-US")}
                        </p>
                        <p className="text-[9px] text-slate-400">steps</p>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setIsLeaderboardMaximized(true)}
              className="w-full py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
            >
              <Maximize2 className="w-3.5 h-3.5 text-slate-400" />
              View Full Leaderboard
            </button>
          </div>
        </div>
      </div>

      {/* Historical Log Table */}
      <div className="rounded-3xl bg-[#121826] border border-slate-800 p-6 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 mb-4 border-b border-slate-800">
          <div>
            <h3 className="font-bold text-base text-white flex items-center gap-2">
              <Calendar className="w-4 h-4 text-red-500" />
              Recent Activity History
            </h3>
            <p className="text-xs text-slate-400">
              Complete record of all your logged walking sessions
            </p>
          </div>

          <button
            type="button"
            onClick={handleOpenNew}
            className="px-3.5 py-1.5 text-xs font-bold rounded-xl bg-red-600 hover:bg-red-500 text-white flex items-center gap-1.5 transition-colors cursor-pointer self-start sm:self-auto shadow-sm"
          >
            <Plus className="w-3.5 h-3.5" /> Log New Date
          </button>
        </div>

        {logs.length === 0 ? (
          <div className="py-12 text-center text-slate-500 text-xs">
            No activity history recorded yet.
          </div>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-slate-800">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-900/90 text-[11px] uppercase tracking-wider text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Steps</th>
                  <th className="px-4 py-3">Goal Status</th>
                  <th className="px-4 py-3">Est. Distance & Calories</th>
                  <th className="px-4 py-3">Evidence</th>
                  <th className="px-4 py-3">Notes</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 bg-slate-900/30">
                {logs.map((log: any) => {
                  const d = new Date(log.date);
                  const isMet = log.stepCount >= goal;
                  return (
                    <tr key={log.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="px-4 py-3 font-semibold text-slate-200">
                        {d.toLocaleDateString("en-US", {
                          weekday: "short",
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </td>
                      <td className="px-4 py-3 font-black text-white text-sm">
                        {log.stepCount.toLocaleString("en-US")}
                      </td>
                      <td className="px-4 py-3">
                        {isMet ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                            <CheckCircle2 className="w-3 h-3" /> Achieved
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                            {(goal - log.stepCount).toLocaleString("en-US")} remaining
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-slate-400">
                        {log.distanceKm} km • {log.calories.toLocaleString("en-US")} kcal
                      </td>
                      <td className="px-4 py-3">
                        {log.evidenceUrl ? (
                          <button
                            type="button"
                            onClick={() =>
                              setSelectedEvidence({
                                evidenceUrl: log.evidenceUrl,
                                userName: initialUser.name,
                                date: log.date,
                                stepCount: log.stepCount,
                                note: log.note,
                              })
                            }
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 hover:border-red-500/40 transition-colors cursor-pointer"
                            title="Click to inspect photo evidence"
                          >
                            <img
                              src={log.evidenceUrl}
                              alt="Evidence"
                              className="w-4 h-4 rounded object-cover border border-slate-700"
                            />
                            <span>View Photo</span>
                          </button>
                        ) : (
                          <span className="text-slate-600 text-[11px]">-</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-slate-400 italic max-w-xs truncate">
                        {log.note || "-"}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(log)}
                            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                            title="Edit Entry"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteLog(log.id)}
                            disabled={deleteLoading === log.id}
                            className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-950/20 rounded-lg transition-colors cursor-pointer"
                            title="Delete Entry"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Step Log Modal for Add/Edit */}
      <StepLogModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={fetchDashboardData}
        initialDate={
          editLog
            ? new Date(editLog.date).toISOString().split("T")[0]
            : new Date().toISOString().split("T")[0]
        }
        initialSteps={editLog ? editLog.stepCount : 0}
        initialNote={editLog ? editLog.note || "" : ""}
        initialEvidenceUrl={editLog ? editLog.evidenceUrl : null}
        dailyGoal={goal}
      />

      {/* Fullscreen Maximized Leaderboard Modal */}
      <MaximizedLeaderboardModal
        isOpen={isLeaderboardMaximized}
        onClose={() => setIsLeaderboardMaximized(false)}
        currentUserId={initialUser.id}
        initialPeriod="today"
      />

      {/* Profile Edit Modal */}
      <ProfileEditModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        user={initialUser}
      />

      {/* Evidence Viewer Modal */}
      <EvidenceViewerModal
        isOpen={!!selectedEvidence}
        onClose={() => setSelectedEvidence(null)}
        {...selectedEvidence}
      />
    </div>
  );
}
