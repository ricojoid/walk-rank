"use client";

import { useState, useEffect } from "react";
import {
  Award,
  X,
  Minimize2,
  Search,
  Footprints,
  Flame,
  Navigation,
  Sparkles,
  Building2,
  CheckCircle2,
  Trophy,
  Crown,
  Medal,
} from "lucide-react";

interface MaximizedLeaderboardModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUserId: string;
  initialPeriod?: "today" | "7d" | "30d";
}

export default function MaximizedLeaderboardModal({
  isOpen,
  onClose,
  currentUserId,
  initialPeriod = "today",
}: MaximizedLeaderboardModalProps) {
  const [period, setPeriod] = useState<"today" | "7d" | "30d">(initialPeriod);
  const [loading, setLoading] = useState(false);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");

  const fetchLeaderboardData = async (selectedPeriod: "today" | "7d" | "30d") => {
    setLoading(true);
    try {
      const res = await fetch(`/api/leaderboard?period=${selectedPeriod}`);
      if (res.ok) {
        const data = await res.json();
        setLeaderboard(data.leaderboard || []);
      }
    } catch (err) {
      console.error("Leaderboard fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchLeaderboardData(period);
    }
  }, [isOpen, period]);

  // Handle ESC key to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // Filter leaderboard
  const filtered = leaderboard.filter((u: any) => {
    return (
      u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  const top1 = leaderboard[0];
  const top2 = leaderboard[1];
  const top3 = leaderboard[2];

  const currentUserItem = leaderboard.find((u) => u.userId === currentUserId);
  const totalCompanySteps = leaderboard.reduce((acc, u) => acc + u.totalSteps, 0);

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-[#0B0F17]/98 backdrop-blur-2xl text-slate-100 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
      {/* Top Header Bar */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800/80 bg-[#121826]/80 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 font-bold">
            <Trophy className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-black text-white tracking-tight">
                Employee Leaderboard
              </h2>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/30 uppercase">
                Maximized View
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Office-wide step activity & competitive rankings
            </p>
          </div>
        </div>

        {/* Right Controls: Period Selector & Minimize Button */}
        <div className="flex items-center gap-3">
          {/* Period selector */}
          <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-900 border border-slate-800">
            <button
              onClick={() => setPeriod("today")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                period === "today"
                  ? "bg-red-600 text-white shadow"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              Today
            </button>
            <button
              onClick={() => setPeriod("7d")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                period === "7d"
                  ? "bg-red-600 text-white shadow"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              Last 7 Days
            </button>
            <button
              onClick={() => setPeriod("30d")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                period === "30d"
                  ? "bg-red-600 text-white shadow"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              Last 30 Days
            </button>
          </div>

          {/* Minimize / Exit button */}
          <button
            onClick={onClose}
            className="flex items-center gap-2 px-3.5 py-2 text-xs font-bold rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 hover:border-slate-600 transition-colors shadow-sm cursor-pointer"
            title="Minimize Screen (Esc)"
          >
            <Minimize2 className="w-4 h-4 text-slate-400" />
            <span className="hidden sm:inline">Minimize (Esc)</span>
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto w-full">
        {/* Top 3 Podium (Only when search is empty) */}
        {!searchTerm && leaderboard.length >= 3 && (
          <div className="relative pt-2 pb-4">
            <div className="grid grid-cols-3 gap-3 sm:gap-6 items-end max-w-3xl mx-auto pt-4 pb-2">
              {/* 2nd Place (Silver) */}
              {top2 && (
                <div className="flex flex-col items-center">
                  <div className="relative mb-3 flex flex-col items-center">
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700 text-[11px] font-semibold mb-2 shadow-sm">
                      <Medal className="w-3.5 h-3.5 text-slate-400" />
                      2nd Place
                    </span>
                    {top2.avatarUrl ? (
                      <img
                        src={top2.avatarUrl}
                        alt={top2.name}
                        className="w-16 h-16 sm:w-20 sm:h-20 rounded-full object-cover border-2 border-slate-400 shadow-md"
                      />
                    ) : (
                      <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-slate-800 flex items-center justify-center text-lg font-bold text-slate-300 border-2 border-slate-400">
                        {top2.name.charAt(0)}
                      </div>
                    )}
                  </div>
                  <p className="text-xs sm:text-sm font-bold text-white text-center truncate max-w-[120px]">
                    {top2.name}
                  </p>
                  <div className="mt-3 w-full p-4 rounded-2xl bg-slate-900/80 border border-slate-800 text-center shadow-sm">
                    <span className="text-base sm:text-xl font-black text-white">
                      {top2.totalSteps.toLocaleString("en-US")}
                    </span>
                    <p className="text-[10px] text-slate-400">steps</p>
                  </div>
                </div>
              )}

              {/* 1st Place (Gold - Elevated) */}
              {top1 && (
                <div className="flex flex-col items-center -mt-4 sm:-mt-6">
                  <div className="relative mb-3 flex flex-col items-center">
                    <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/30 text-xs font-bold mb-2 shadow-sm">
                      <Trophy className="w-3.5 h-3.5 text-amber-400" />
                      1st Place
                    </span>
                    {top1.avatarUrl ? (
                      <img
                        src={top1.avatarUrl}
                        alt={top1.name}
                        className="w-20 h-20 sm:w-24 sm:h-24 rounded-full object-cover border-2 border-amber-400 shadow-xl"
                      />
                    ) : (
                      <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-slate-800 flex items-center justify-center text-xl sm:text-2xl font-black text-amber-300 border-2 border-amber-400">
                        {top1.name.charAt(0)}
                      </div>
                    )}
                  </div>
                  <p className="text-sm sm:text-base font-black text-white text-center truncate max-w-[140px]">
                    {top1.name}
                  </p>
                  <div className="mt-3 w-full p-5 rounded-2xl bg-gradient-to-b from-[#1A2234] to-[#111827] border border-amber-500/30 text-center shadow-md">
                    <span className="text-lg sm:text-2xl font-black text-amber-300">
                      {top1.totalSteps.toLocaleString("en-US")}
                    </span>
                    <p className="text-xs text-amber-300/80 font-bold">Total Steps</p>
                  </div>
                </div>
              )}

              {/* 3rd Place (Bronze) */}
              {top3 && (
                <div className="flex flex-col items-center">
                  <div className="relative mb-3 flex flex-col items-center">
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-950/40 text-amber-500 border border-amber-800/50 text-[11px] font-semibold mb-2 shadow-sm">
                      <Medal className="w-3.5 h-3.5 text-amber-600" />
                      3rd Place
                    </span>
                    {top3.avatarUrl ? (
                      <img
                        src={top3.avatarUrl}
                        alt={top3.name}
                        className="w-14 h-14 sm:w-18 sm:h-18 rounded-full object-cover border-2 border-amber-700/80 shadow-md"
                      />
                    ) : (
                      <div className="w-14 h-14 sm:w-18 sm:h-18 rounded-full bg-slate-800 flex items-center justify-center text-lg font-bold text-amber-600 border-2 border-amber-700/80">
                        {top3.name.charAt(0)}
                      </div>
                    )}
                  </div>
                  <p className="text-xs sm:text-sm font-bold text-white text-center truncate max-w-[120px]">
                    {top3.name}
                  </p>
                  <div className="mt-3 w-full p-4 rounded-2xl bg-slate-900/80 border border-slate-800 text-center shadow-sm">
                    <span className="text-base sm:text-xl font-black text-white">
                      {top3.totalSteps.toLocaleString("en-US")}
                    </span>
                    <p className="text-[10px] text-slate-400">steps</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Search & Filter Controls */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-[#121826] border border-slate-800">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <Footprints className="w-4 h-4 text-emerald-400" />
            <span>
              Combined Total Steps:{" "}
              <strong className="text-emerald-400 font-bold">
                {totalCompanySteps.toLocaleString("en-US")}
              </strong>{" "}
              steps
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Search Input */}
            <div className="relative flex-1 sm:flex-initial">
              <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by name or email..."
                className="w-full sm:w-64 bg-slate-900 border border-slate-700 rounded-xl pl-8 pr-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:ring-2 focus:ring-red-500/50"
              />
            </div>
          </div>
        </div>

        {/* Detailed Fullscreen Table */}
        <div className="rounded-2xl bg-[#121826] border border-slate-800 overflow-hidden shadow-2xl">
          {loading ? (
            <div className="py-20 flex flex-col items-center justify-center text-slate-400 gap-2">
              <div className="w-8 h-8 border-2 border-red-500/20 border-t-red-500 rounded-full animate-spin" />
              <p className="text-xs">Loading leaderboard...</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-16 text-center text-slate-500 text-xs">
              No participants match your search query.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-900/90 text-[11px] uppercase tracking-wider text-slate-400 border-b border-slate-800 sticky top-0">
                  <tr>
                    <th className="px-5 py-3.5 text-center w-16">Rank</th>
                    <th className="px-5 py-3.5">Participant</th>
                    <th className="px-5 py-3.5">Total Steps</th>
                    <th className="px-5 py-3.5">Est. Distance & Calories</th>
                    <th className="px-5 py-3.5">Daily Average</th>
                    <th className="px-5 py-3.5 text-right">Goal Rate</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 bg-slate-900/20">
                  {filtered.map((item: any) => {
                    const isSelf = item.userId === currentUserId;
                    return (
                      <tr
                        key={item.userId}
                        className={`transition-colors ${
                          isSelf
                            ? "bg-red-500/10 hover:bg-red-500/15 border-l-4 border-red-500"
                            : "hover:bg-slate-800/40"
                        }`}
                      >
                        <td className="px-5 py-3.5 text-center font-bold">
                          {item.rank === 1 ? (
                            <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-amber-500/20 text-amber-300 text-xs font-bold border border-amber-500/30">
                              1
                            </span>
                          ) : item.rank === 2 ? (
                            <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-slate-400/20 text-slate-300 text-xs font-bold border border-slate-500/30">
                              2
                            </span>
                          ) : item.rank === 3 ? (
                            <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-amber-800/20 text-amber-500 text-xs font-bold border border-amber-700/30">
                              3
                            </span>
                          ) : (
                            <span className="font-mono text-slate-400 text-xs">#{item.rank}</span>
                          )}
                        </td>
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-3">
                            {item.avatarUrl ? (
                              <img
                                src={item.avatarUrl}
                                alt={item.name}
                                className="w-9 h-9 rounded-full object-cover border border-slate-700 shrink-0"
                              />
                            ) : (
                              <div className="w-9 h-9 rounded-full bg-slate-800 flex items-center justify-center font-bold text-xs text-slate-300 shrink-0">
                                {item.name.charAt(0)}
                              </div>
                            )}
                            <div>
                              <p
                                className={`font-bold text-sm flex items-center gap-1.5 ${
                                  isSelf ? "text-red-400" : "text-white"
                                }`}
                              >
                                {item.name}
                                {isSelf && (
                                  <span className="text-[10px] px-1.5 py-0.2 rounded bg-red-500/20 text-red-300 font-semibold border border-red-500/30">
                                    You
                                  </span>
                                )}
                              </p>
                              <p className="text-[10px] text-slate-400">{item.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-3.5">
                          <span className="text-base font-black text-white">
                            {item.totalSteps.toLocaleString("en-US")}
                          </span>
                          <span className="text-[10px] text-slate-400 ml-1">steps</span>
                        </td>
                        <td className="px-5 py-3.5 text-slate-400">
                          <span className="text-slate-300 font-medium">
                            {item.totalDistanceKm} km
                          </span>{" "}
                          •{" "}
                          <span className="text-slate-400 font-medium">
                            {item.totalCalories.toLocaleString("en-US")} kcal
                          </span>
                        </td>
                        <td className="px-5 py-3.5 text-slate-200 font-medium">
                          {item.avgSteps.toLocaleString("en-US")} / day
                        </td>
                        <td className="px-5 py-3.5 text-right">
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                              item.goalCompletionRate >= 70
                                ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                                : item.goalCompletionRate >= 40
                                ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                                : "bg-rose-500/20 text-rose-300 border border-rose-500/30"
                            }`}
                          >
                            {item.goalCompletionRate}% Reached
                          </span>
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

      {/* Footer / User Position Quick Bar */}
      {currentUserItem && (
        <div className="px-6 py-3.5 border-t border-slate-800 bg-[#121826] shrink-0 flex items-center justify-between text-xs">
          <div className="flex items-center gap-3">
            <span className="text-slate-400">Your Standing:</span>
            <span className="font-extrabold text-white text-sm">
              Rank #{currentUserItem.rank}
            </span>
            <span className="text-slate-500">•</span>
            <span className="text-slate-300">
              Total:{" "}
              <strong className="text-white">
                {currentUserItem.totalSteps.toLocaleString("en-US")}
              </strong>{" "}
              steps
            </span>
          </div>

          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      )}
    </div>
  );
}
