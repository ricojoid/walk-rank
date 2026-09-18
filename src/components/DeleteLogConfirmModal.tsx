"use client";

import { useState, useEffect } from "react";
import { AlertTriangle, Trash2, X, Calendar, Footprints, Image as ImageIcon } from "lucide-react";

interface DeleteLogConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  log: {
    id: string;
    date: string | Date;
    stepCount: number;
    userName?: string;
    userEmail?: string;
    avatarUrl?: string;
    evidenceUrl?: string | null;
    note?: string | null;
  } | null;
  onLogDeleted: () => void;
}

export default function DeleteLogConfirmModal({
  isOpen,
  onClose,
  log,
  onLogDeleted,
}: DeleteLogConfirmModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Close on ESC
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen && !loading) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, loading, onClose]);

  if (!isOpen || !log) return null;

  const dateObj = new Date(log.date);
  const formattedDate = dateObj.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  const handleConfirmDelete = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/steps/${log.id}`, {
        method: "DELETE",
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to delete step activity log.");
      }

      onLogDeleted();
      onClose();
    } catch (err: any) {
      console.error(err);
      setError(err.message || "An error occurred while deleting the log.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="relative w-full max-w-md rounded-2xl bg-[#121826] border border-red-500/30 shadow-2xl shadow-red-950/50 text-slate-100 overflow-hidden animate-in zoom-in-95 duration-150">
        {/* Glow Header */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-red-600 via-rose-500 to-amber-500" />

        <div className="p-6">
          {/* Top Title & Close Button */}
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-red-500/15 border border-red-500/30 flex items-center justify-center text-red-400 shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-base text-white">Delete Activity Log?</h3>
                <p className="text-xs text-slate-400">This action cannot be undone</p>
              </div>
            </div>
            <button
              type="button"
              disabled={loading}
              onClick={onClose}
              className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors disabled:opacity-50 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Details Card */}
          <div className="mt-5 p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2.5">
            {log.userName && (
              <div className="flex items-center justify-between text-xs pb-2 border-b border-slate-800/80">
                <span className="text-slate-400 font-medium">Employee:</span>
                <span className="text-white font-bold">{log.userName}</span>
              </div>
            )}

            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400 font-medium flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-red-400" />
                Date:
              </span>
              <span className="text-slate-200 font-semibold">{formattedDate}</span>
            </div>

            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400 font-medium flex items-center gap-1.5">
                <Footprints className="w-3.5 h-3.5 text-emerald-400" />
                Step Count:
              </span>
              <span className="text-emerald-400 font-black text-sm">
                {log.stepCount.toLocaleString("en-US")} steps
              </span>
            </div>

            {log.note && (
              <div className="pt-2 border-t border-slate-800/80 text-xs text-slate-400 italic truncate">
                Note: &ldquo;{log.note}&rdquo;
              </div>
            )}

            {log.evidenceUrl && (
              <div className="pt-2 border-t border-slate-800/80 flex items-center gap-2 text-xs text-slate-400">
                <ImageIcon className="w-3.5 h-3.5 text-amber-400" />
                <span>Photo evidence attached</span>
              </div>
            )}
          </div>

          {error && (
            <div className="mt-4 p-3 rounded-xl bg-red-950/40 border border-red-500/40 text-xs text-red-300 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <p className="mt-4 text-xs text-slate-400 leading-relaxed">
            This activity entry will be <strong className="text-red-400">permanently deleted</strong>. The employee&apos;s total steps, target consistency rate, and leaderboard standings will automatically be updated.
          </p>

          {/* Action Buttons */}
          <div className="mt-6 flex items-center justify-end gap-2.5">
            <button
              type="button"
              disabled={loading}
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors disabled:opacity-50 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={loading}
              onClick={handleConfirmDelete}
              className="px-4 py-2 text-xs font-bold rounded-xl bg-red-600 hover:bg-red-500 text-white transition-all shadow-md shadow-red-600/30 flex items-center gap-1.5 disabled:opacity-50 cursor-pointer active:scale-95"
            >
              {loading ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                  <span>Deleting...</span>
                </>
              ) : (
                <>
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Yes, Delete Log</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
