"use client";

import { useState } from "react";
import {
  AlertTriangle,
  X,
  Trash2,
  AlertCircle,
} from "lucide-react";

interface DeleteUserConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
  } | null;
  onUserDeleted: () => void;
}

export default function DeleteUserConfirmModal({
  isOpen,
  onClose,
  user,
  onUserDeleted,
}: DeleteUserConfirmModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  if (!isOpen || !user) return null;

  const handleConfirmDelete = async () => {
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/admin/users", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.id }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to delete user.");
      }

      onUserDeleted();
      onClose();
    } catch (err: any) {
      setError(err.message || "An error occurred while deleting user.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-150">
      <div
        className="w-full max-w-md rounded-3xl bg-[#121826] border border-rose-500/30 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150 relative text-slate-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="p-6 border-b border-slate-800 bg-rose-950/20 flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-rose-500/20 text-rose-400 border border-rose-500/30 flex items-center justify-center shrink-0">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-bold text-white tracking-tight">
              Delete Employee Account?
            </h3>
            <p className="text-xs text-rose-300/80 mt-0.5">
              This action is permanent and cannot be undone.
            </p>
          </div>
          <button
            onClick={onClose}
            disabled={loading}
            className="text-slate-400 hover:text-white p-1 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-4">
          {error && (
            <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400">Employee Name:</span>
              <span className="font-bold text-slate-100">{user.name}</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400">Email Address:</span>
              <span className="font-mono text-slate-300">{user.email}</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400">Account Role:</span>
              <span className="px-2 py-0.5 rounded bg-slate-800 text-[10px] font-bold text-slate-300">
                {user.role}
              </span>
            </div>
          </div>

          <p className="text-xs text-slate-400 leading-relaxed">
            Deleting this user will permanently erase their account, login access, and all daily step history records from the database.
          </p>
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-end gap-3 p-6 pt-0">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirmDelete}
            disabled={loading}
            className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-rose-600 hover:bg-rose-500 shadow-lg shadow-rose-600/20 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
          >
            <Trash2 className="w-4 h-4" />
            {loading ? "Deleting..." : "Yes, Delete Account"}
          </button>
        </div>
      </div>
    </div>
  );
}
