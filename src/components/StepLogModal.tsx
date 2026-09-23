"use client";

import { useState, useEffect, useRef } from "react";
import {
  X,
  Footprints,
  Flame,
  Navigation,
  Calendar,
  Check,
  AlertCircle,
  Camera,
  Upload,
  Image as ImageIcon,
  Trash2,
} from "lucide-react";
import confetti from "canvas-confetti";

interface StepLogModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  initialDate?: string;
  initialSteps?: number;
  initialNote?: string;
  initialEvidenceUrl?: string | null;
  dailyGoal?: number;
}

const getLocalTodayDate = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

export default function StepLogModal({
  isOpen,
  onClose,
  onSuccess,
  initialDate,
  initialSteps = 0,
  initialNote = "",
  initialEvidenceUrl = null,
  dailyGoal = 8000,
}: StepLogModalProps) {
  const [date, setDate] = useState(
    initialDate || getLocalTodayDate()
  );
  const [stepCount, setStepCount] = useState<number>(initialSteps);
  const [note, setNote] = useState(initialNote);
  const [evidenceUrl, setEvidenceUrl] = useState<string | null>(initialEvidenceUrl || null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setDate(initialDate || getLocalTodayDate());
      setStepCount(initialSteps || 0);
      setNote(initialNote || "");
      setEvidenceUrl(initialEvidenceUrl || null);
      setError("");
    }
  }, [isOpen, initialDate, initialSteps, initialNote, initialEvidenceUrl]);

  if (!isOpen) return null;

  const distanceKm = Number((stepCount * 0.00076).toFixed(2));
  const calories = Math.round(stepCount * 0.042);
  const isGoalReached = stepCount >= dailyGoal;

  const handleAddSteps = (amount: number) => {
    setStepCount((prev) => Math.max(0, prev + amount));
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setError("Evidence file size exceeds 5MB limit.");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === "string") {
        setEvidenceUrl(reader.result);
        setError("");
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!date) {
      setError("Please select a date.");
      return;
    }
    if (stepCount < 0) {
      setError("Step count cannot be negative.");
      return;
    }
    if (stepCount > 0 && !evidenceUrl) {
      setError("Photo evidence is mandatory. Please upload a screenshot/photo of your step count.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/steps", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date,
          stepCount,
          note,
          evidenceUrl,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to save steps");
      }

      // Celebrate if reached goal!
      if (isGoalReached) {
        try {
          confetti({
            particleCount: 80,
            spread: 60,
            origin: { y: 0.7 },
          });
        } catch {}
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg rounded-2xl bg-[#121826] border border-slate-700/80 shadow-2xl p-6 text-slate-100 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-red-500/10 text-red-500 border border-red-500/20">
              <Footprints className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-lg text-white">Log Step Activity</h3>
              <p className="text-xs text-slate-400">
                Record your steps to build consistency & track your progress
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="mt-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          {/* Date Picker */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Activity Date
            </label>
            <div className="relative">
              <input
                type="date"
                value={date}
                max={getLocalTodayDate()}
                onChange={(e) => setDate(e.target.value)}
                required
                className="w-full bg-slate-900/90 border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 focus:outline-none focus:ring-1 focus:ring-red-500"
              />
            </div>
          </div>

          {/* Step Count Input */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-slate-300">
                Number of Steps
              </label>
              {isGoalReached ? (
                <span className="text-[11px] font-bold text-emerald-400 flex items-center gap-1">
                  <Check className="w-3.5 h-3.5" /> Target Achieved!
                </span>
              ) : (
                <span className="text-[11px] text-slate-400">
                  Daily goal: {dailyGoal.toLocaleString("en-US")}
                </span>
              )}
            </div>
            <div className="relative">
              <input
                type="number"
                min="0"
                step="1"
                value={stepCount === 0 ? "" : stepCount}
                onChange={(e) => setStepCount(Math.max(0, parseInt(e.target.value) || 0))}
                placeholder="e.g. 10000"
                required
                className="w-full bg-slate-900/90 border border-slate-700/80 rounded-xl px-4 py-3 text-xl font-bold text-white focus:outline-none focus:ring-1 focus:ring-red-500 tracking-wider"
              />
            </div>

            {/* Quick Step Booster Buttons */}
            <div className="flex items-center gap-2 mt-2.5">
              <span className="text-[10px] uppercase font-bold text-slate-500">Quick Add:</span>
              {[500, 1000, 2500, 5000].map((amt) => (
                <button
                  key={amt}
                  type="button"
                  onClick={() => handleAddSteps(amt)}
                  className="px-2.5 py-1 text-xs font-medium rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-colors cursor-pointer"
                >
                  +{amt.toLocaleString("en-US")}
                </button>
              ))}
            </div>
          </div>

          {/* Auto Calculation Cards */}
          <div className="grid grid-cols-2 gap-3 p-3.5 rounded-xl bg-slate-900/60 border border-slate-800">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20">
                <Navigation className="w-4 h-4" />
              </div>
              <div>
                <p className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">
                  Est. Distance
                </p>
                <p className="text-base font-bold text-blue-300">
                  {distanceKm} <span className="text-xs font-normal text-slate-400">km</span>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
                <Flame className="w-4 h-4" />
              </div>
              <div>
                <p className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">
                  Calories Burned
                </p>
                <p className="text-base font-bold text-amber-300">
                  {calories.toLocaleString("en-US")}{" "}
                  <span className="text-xs font-normal text-slate-400">kcal</span>
                </p>
              </div>
            </div>
          </div>

          {/* Photo Evidence Upload (Mandatory) */}
          <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <Camera className="w-3.5 h-3.5 text-red-400" />
                <span>Photo Evidence <span className="text-red-400">*</span></span>
              </label>
              <span className="text-[10px] text-slate-400">Pedometer/Smartwatch Screenshot</span>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileUpload}
              className="hidden"
            />

            {evidenceUrl ? (
              <div className="relative rounded-xl overflow-hidden border border-slate-700 bg-slate-950/60 p-2 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5 overflow-hidden">
                  <img
                    src={evidenceUrl}
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

                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="px-2.5 py-1 text-[11px] font-semibold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg border border-slate-700 transition-colors cursor-pointer"
                  >
                    Change
                  </button>
                  <button
                    type="button"
                    onClick={() => setEvidenceUrl(null)}
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
                onClick={() => fileInputRef.current?.click()}
                className="w-full py-4 border-2 border-dashed border-slate-700 hover:border-red-500/60 rounded-xl flex flex-col items-center justify-center gap-1.5 bg-slate-950/40 hover:bg-slate-900/60 transition-all cursor-pointer group"
              >
                <Upload className="w-5 h-5 text-slate-500 group-hover:text-red-400 transition-colors" />
                <span className="text-xs font-semibold text-slate-300 group-hover:text-white transition-colors">
                  Upload Screenshot / Photo
                </span>
                <span className="text-[10px] text-slate-500">Supports JPG, PNG, WEBP (Max 5MB)</span>
              </button>
            )}
          </div>

          {/* Activity Note */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Activity Notes (Optional)
            </label>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="e.g. Morning walk around plant, evening jog..."
              maxLength={150}
              className="w-full bg-slate-900/90 border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-red-500"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2.5 text-xs font-bold text-white bg-red-600 hover:bg-red-500 rounded-xl shadow-lg shadow-red-600/20 transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
            >
              {loading ? "Saving..." : "Save Steps"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
