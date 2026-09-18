"use client";

import { useState, useEffect } from "react";
import {
  X,
  Calendar as CalendarIcon,
  Check,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Info,
  Briefcase,
  CheckSquare,
} from "lucide-react";

interface SpecificDatePickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedDates: string[];
  onApplyDates: (dates: string[]) => void;
}

export default function SpecificDatePickerModal({
  isOpen,
  onClose,
  selectedDates,
  onApplyDates,
}: SpecificDatePickerModalProps) {
  const today = new Date();
  const todayStr = today.toISOString().split("T")[0];

  // Set initial month & year based on first selected date or today
  const [viewYear, setViewYear] = useState<number>(today.getFullYear());
  const [viewMonth, setViewMonth] = useState<number>(today.getMonth());
  const [activeDates, setActiveDates] = useState<Set<string>>(new Set(selectedDates));

  // Quick range inputs
  const [quickFrom, setQuickFrom] = useState<string>("");
  const [quickTo, setQuickTo] = useState<string>("");

  useEffect(() => {
    if (isOpen) {
      const initialSet = new Set(selectedDates);
      setActiveDates(initialSet);
      if (selectedDates.length > 0) {
        const sorted = [...selectedDates].sort();
        const first = new Date(sorted[0]);
        if (!isNaN(first.getTime())) {
          setViewYear(first.getFullYear());
          setViewMonth(first.getMonth());
        }
      } else {
        setViewYear(today.getFullYear());
        setViewMonth(today.getMonth());
      }
    }
  }, [isOpen, selectedDates]);

  // Close on ESC
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

  const toggleDate = (dateStr: string) => {
    setActiveDates((prev) => {
      const next = new Set(prev);
      if (next.has(dateStr)) {
        next.delete(dateStr);
      } else {
        next.add(dateStr);
      }
      return next;
    });
  };

  const handlePrevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear((y) => y - 1);
    } else {
      setViewMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear((y) => y + 1);
    } else {
      setViewMonth((m) => m + 1);
    }
  };

  // Preset 1: Weekdays only in viewed month (Senin - Jumat)
  const handleSelectWeekdaysMonth = () => {
    const next = new Set(activeDates);
    const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
    for (let day = 1; day <= daysInMonth; day++) {
      const d = new Date(viewYear, viewMonth, day);
      const dayOfWeek = d.getDay(); // 0 is Sunday, 6 is Saturday
      const dateStr = `${viewYear}-${String(viewMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
      if (dayOfWeek >= 1 && dayOfWeek <= 5) {
        next.add(dateStr);
      } else {
        next.delete(dateStr);
      }
    }
    setActiveDates(next);
  };

  // Preset 2: All days in viewed month
  const handleSelectAllMonth = () => {
    const next = new Set(activeDates);
    const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${viewYear}-${String(viewMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
      next.add(dateStr);
    }
    setActiveDates(next);
  };

  // Preset 3: Last 7 days
  const handleSelectLast7Days = () => {
    const next = new Set<string>();
    for (let i = 0; i < 7; i++) {
      const d = new Date(Date.now() - i * 86400000);
      next.add(d.toISOString().split("T")[0]);
    }
    setActiveDates(next);
  };

  // Preset 4: Last 14 days
  const handleSelectLast14Days = () => {
    const next = new Set<string>();
    for (let i = 0; i < 14; i++) {
      const d = new Date(Date.now() - i * 86400000);
      next.add(d.toISOString().split("T")[0]);
    }
    setActiveDates(next);
  };

  // Preset 5: Add date range
  const handleApplyQuickRange = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickFrom || !quickTo) return;
    const s = new Date(quickFrom);
    const eD = new Date(quickTo);
    if (s > eD) return;

    const next = new Set(activeDates);
    let curr = new Date(s);
    while (curr <= eD) {
      next.add(curr.toISOString().split("T")[0]);
      curr = new Date(curr.getTime() + 86400000);
    }
    setActiveDates(next);
  };

  const handleClearAll = () => {
    setActiveDates(new Set());
  };

  const handleApply = () => {
    const sorted = Array.from(activeDates).sort();
    onApplyDates(sorted);
    onClose();
  };

  // Month grid calculation
  const firstDayOfMonth = new Date(viewYear, viewMonth, 1).getDay(); // 0 = Sun
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const prevMonthDays = new Date(viewYear, viewMonth, 0).getDate();

  const monthNames = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  const sortedActiveDates = Array.from(activeDates).sort();

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-3xl max-h-[92vh] flex flex-col rounded-3xl bg-[#121826] border border-slate-700/80 shadow-2xl text-slate-100 overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Glow Top Accent */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-red-600 via-rose-500 to-amber-500" />

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-800 bg-slate-900/50 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-red-500/15 border border-red-500/30 flex items-center justify-center text-red-400 font-bold shadow-md shadow-red-950/40">
              <CalendarIcon className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-lg text-white">
                  Calculation Date Filter
                </h3>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-red-500/20 text-red-400 border border-red-500/30">
                  Custom Dates
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Select which dates are included in scoring, target consistency, and leaderboard rankings
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* Quick Presets Toolbar */}
          <div className="p-4 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                Quick Presets
              </span>
              <button
                type="button"
                onClick={handleClearAll}
                className="text-xs text-slate-400 hover:text-rose-400 font-medium flex items-center gap-1 transition-colors cursor-pointer"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Clear All</span>
              </button>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={handleSelectWeekdaysMonth}
                className="px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white border border-slate-700 hover:border-red-500/50 transition-all flex items-center gap-1.5 cursor-pointer shadow-sm active:scale-95"
                title="Select Monday through Friday only for this month (Weekends excluded)"
              >
                <Briefcase className="w-3.5 h-3.5 text-red-400" />
                <span>Weekdays Only (Mon-Fri)</span>
              </button>

              <button
                type="button"
                onClick={handleSelectAllMonth}
                className="px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white border border-slate-700 hover:border-red-500/50 transition-all flex items-center gap-1.5 cursor-pointer shadow-sm active:scale-95"
              >
                <CheckSquare className="w-3.5 h-3.5 text-amber-400" />
                <span>All Days This Month</span>
              </button>

              <button
                type="button"
                onClick={handleSelectLast7Days}
                className="px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white border border-slate-700 hover:border-red-500/50 transition-all cursor-pointer shadow-sm active:scale-95"
              >
                Last 7 Days
              </button>

              <button
                type="button"
                onClick={handleSelectLast14Days}
                className="px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white border border-slate-700 hover:border-red-500/50 transition-all cursor-pointer shadow-sm active:scale-95"
              >
                Last 14 Days
              </button>
            </div>

            {/* Quick Range Drawer */}
            <form
              onSubmit={handleApplyQuickRange}
              className="pt-2 border-t border-slate-800/80 flex flex-wrap items-center gap-2.5 text-xs"
            >
              <span className="text-slate-400 font-medium">Add Range:</span>
              <div className="flex items-center gap-1.5">
                <input
                  type="date"
                  value={quickFrom}
                  onChange={(e) => setQuickFrom(e.target.value)}
                  className="bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-red-500"
                />
                <span className="text-slate-500">&rarr;</span>
                <input
                  type="date"
                  value={quickTo}
                  onChange={(e) => setQuickTo(e.target.value)}
                  className="bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-red-500"
                />
              </div>
              <button
                type="submit"
                disabled={!quickFrom || !quickTo}
                className="px-3 py-1 rounded-lg bg-red-600/80 hover:bg-red-500 text-white font-semibold transition-colors disabled:opacity-40 cursor-pointer"
              >
                + Add to Selection
              </button>
            </form>
          </div>

          {/* Interactive Calendar Month Grid */}
          <div className="p-5 rounded-2xl bg-slate-900/50 border border-slate-800 space-y-4">
            {/* Month & Year Navigation Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <h4 className="text-base font-extrabold text-white">
                  {monthNames[viewMonth]} {viewYear}
                </h4>
                <span className="text-xs text-slate-400 font-medium">
                  • Click dates to toggle selection
                </span>
              </div>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={handlePrevMonth}
                  className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-colors cursor-pointer"
                  title="Previous Month"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={handleNextMonth}
                  className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-colors cursor-pointer"
                  title="Next Month"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Weekdays Header */}
            <div className="grid grid-cols-7 gap-1.5 text-center text-[11px] font-bold uppercase tracking-wider text-slate-400">
              <div className="text-rose-400/80 py-1">Sun</div>
              <div className="py-1">Mon</div>
              <div className="py-1">Tue</div>
              <div className="py-1">Wed</div>
              <div className="py-1">Thu</div>
              <div className="py-1">Fri</div>
              <div className="text-rose-400/80 py-1">Sat</div>
            </div>

            {/* Days Grid */}
            <div className="grid grid-cols-7 gap-1.5">
              {/* Prev Month Days */}
              {Array.from({ length: firstDayOfMonth }).map((_, idx) => {
                const dayNum = prevMonthDays - firstDayOfMonth + idx + 1;
                return (
                  <div
                    key={`prev-${idx}`}
                    className="h-10 sm:h-11 rounded-xl flex items-center justify-center text-xs font-medium text-slate-600 bg-slate-900/20 border border-slate-800/30 cursor-not-allowed select-none"
                  >
                    {dayNum}
                  </div>
                );
              })}

              {/* Current Month Days */}
              {Array.from({ length: daysInMonth }).map((_, idx) => {
                const dayNum = idx + 1;
                const dateStr = `${viewYear}-${String(viewMonth + 1).padStart(2, "0")}-${String(dayNum).padStart(2, "0")}`;
                const isSelected = activeDates.has(dateStr);
                const isToday = dateStr === todayStr;
                const dObj = new Date(viewYear, viewMonth, dayNum);
                const isWeekend = dObj.getDay() === 0 || dObj.getDay() === 6;

                return (
                  <button
                    key={dateStr}
                    type="button"
                    onClick={() => toggleDate(dateStr)}
                    className={`h-10 sm:h-11 rounded-xl flex flex-col items-center justify-center text-xs transition-all relative cursor-pointer select-none ${
                      isSelected
                        ? "bg-red-600 text-white font-black shadow-md shadow-red-600/30 border-2 border-red-400 scale-[1.03] z-10"
                        : isToday
                        ? "bg-slate-800/90 text-white font-bold border-2 border-red-500/50 hover:bg-slate-800"
                        : isWeekend
                        ? "bg-slate-950/60 text-slate-400 hover:text-slate-200 hover:bg-slate-800/70 border border-slate-800/80"
                        : "bg-slate-900/80 text-slate-200 hover:text-white hover:bg-slate-800 border border-slate-800"
                    }`}
                  >
                    <span>{dayNum}</span>
                    {isSelected && (
                      <Check className="w-2.5 h-2.5 text-white stroke-[3] -mt-0.5" />
                    )}
                    {isToday && !isSelected && (
                      <span className="w-1 h-1 rounded-full bg-red-500 -mt-0.5" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Selected Dates Summary Badge & Chips */}
          <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-white uppercase tracking-wider">
                  Selected Dates:
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-red-500/20 text-red-300 border border-red-500/40">
                  {activeDates.size} Days Included
                </span>
              </div>
              <span className="text-[11px] text-slate-400">
                The 30% consistency score will be evaluated across these {activeDates.size} dates.
              </span>
            </div>

            {activeDates.size === 0 ? (
              <div className="p-3 text-center text-xs text-amber-400/90 bg-amber-950/20 border border-amber-500/20 rounded-xl flex items-center justify-center gap-2">
                <Info className="w-4 h-4 shrink-0" />
                <span>
                  No dates selected yet. Please select at least 1 date to calculate scores.
                </span>
              </div>
            ) : (
              <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto pr-1 scrollbar-thin">
                {sortedActiveDates.map((dStr) => {
                  const [y, m, d] = dStr.split("-").map(Number);
                  const dObj = new Date(y, m - 1, d);
                  const dayName = dObj.toLocaleDateString("en-US", { weekday: "short" });
                  const monthName = dObj.toLocaleDateString("en-US", { month: "short" });

                  return (
                    <span
                      key={dStr}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-800 text-slate-200 border border-slate-700 hover:border-red-500/60 transition-colors"
                    >
                      <span className="text-red-400 font-bold">{dayName},</span>
                      <span>
                        {d} {monthName}
                      </span>
                      <button
                        type="button"
                        onClick={() => toggleDate(dStr)}
                        className="p-0.5 hover:text-rose-400 transition-colors cursor-pointer"
                        title="Remove this date"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-5 border-t border-slate-800 bg-slate-900/60 shrink-0 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
          >
            Cancel
          </button>

          <button
            type="button"
            disabled={activeDates.size === 0}
            onClick={handleApply}
            className="px-5 py-2 text-xs font-bold rounded-xl bg-red-600 hover:bg-red-500 text-white transition-all shadow-md shadow-red-600/30 flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer active:scale-95"
          >
            <Check className="w-4 h-4" />
            <span>Apply Filter ({activeDates.size} {activeDates.size === 1 ? "Day" : "Days"})</span>
          </button>
        </div>
      </div>
    </div>
  );
}
