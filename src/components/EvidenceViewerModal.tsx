"use client";

import { X, ExternalLink, Calendar, Footprints, User, Image as ImageIcon } from "lucide-react";

interface EvidenceViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  evidenceUrl?: string | null;
  userName?: string;
  date?: string;
  stepCount?: number;
  note?: string | null;
}

export default function EvidenceViewerModal({
  isOpen,
  onClose,
  evidenceUrl,
  userName,
  date,
  stepCount,
  note,
}: EvidenceViewerModalProps) {
  if (!isOpen || !evidenceUrl) return null;

  const formattedDate = date
    ? new Date(date).toLocaleDateString("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : "Activity Date";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-3xl rounded-3xl bg-[#121826] border border-slate-700/80 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150 flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-slate-800 bg-slate-900/70 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-red-500/10 text-red-400 border border-red-500/20">
              <ImageIcon className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
                <span>Step Count Evidence Photo</span>
                {stepCount !== undefined && (
                  <span className="text-xs px-2 py-0.5 rounded-md bg-red-500/20 text-red-300 border border-red-500/30 font-mono font-bold">
                    {stepCount.toLocaleString("en-US")} Steps
                  </span>
                )}
              </h3>
              <p className="text-xs text-slate-400 flex items-center gap-2">
                {userName && (
                  <span className="flex items-center gap-1 font-medium text-slate-300">
                    <User className="w-3.5 h-3.5 text-slate-500" />
                    {userName}
                  </span>
                )}
                <span>•</span>
                <span className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-slate-500" />
                  {formattedDate}
                </span>
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Image Preview Body */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 flex flex-col items-center justify-center bg-slate-950/60 min-h-[300px]">
          <div className="relative max-h-[55vh] rounded-2xl overflow-hidden border border-slate-800 shadow-2xl bg-black/40 flex items-center justify-center group">
            <img
              src={evidenceUrl}
              alt="Step Evidence"
              className="max-h-[55vh] max-w-full object-contain rounded-xl"
            />
          </div>

          {note && (
            <div className="mt-4 w-full p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 text-xs text-slate-300">
              <span className="font-semibold text-slate-400">Activity Note: </span>
              <span className="italic">{note}</span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-900/80 flex items-center justify-between shrink-0">
          <a
            href={evidenceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-slate-400 hover:text-red-400 flex items-center gap-1.5 transition-colors"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span>Open in Fullscreen Tab</span>
          </a>

          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold rounded-xl bg-slate-800 hover:bg-slate-700 text-white transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
