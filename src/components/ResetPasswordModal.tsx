"use client";

import { useState, useEffect } from "react";
import {
  X,
  KeyRound,
  Eye,
  EyeOff,
  Sparkles,
  Copy,
  Check,
  AlertCircle,
  CheckCircle2,
  Lock,
} from "lucide-react";

interface ResetPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: {
    id: string;
    name: string;
    email: string;
    username?: string | null;
    role?: string;
  } | null;
  onSuccess?: () => void;
}

export default function ResetPasswordModal({
  isOpen,
  onClose,
  user,
  onSuccess,
}: ResetPasswordModalProps) {
  const [newPassword, setNewPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const [successResult, setSuccessResult] = useState<{
    password: string;
    message: string;
  } | null>(null);

  useEffect(() => {
    if (isOpen) {
      setNewPassword("");
      setShowPassword(false);
      setError("");
      setCopied(false);
      setSuccessResult(null);
    }
  }, [isOpen, user]);

  if (!isOpen || !user) return null;

  const generateRandomPassword = () => {
    const charset = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%";
    let generated = "Walk";
    for (let i = 0; i < 6; i++) {
      generated += charset.charAt(Math.floor(Math.random() * charset.length));
    }
    generated += "!";
    setNewPassword(generated);
    setShowPassword(true);
    setError("");
  };

  const handleApplyPreset = (presetPassword: string) => {
    setNewPassword(presetPassword);
    setShowPassword(true);
    setError("");
  };

  const handleCopy = async (textToCopy: string) => {
    if (!textToCopy) return;
    try {
      await navigator.clipboard.writeText(textToCopy);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!newPassword || newPassword.trim().length < 6) {
      setError("Password must be at least 6 characters long.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/admin/users/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.id,
          newPassword: newPassword.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to reset password.");
      }

      setSuccessResult({
        password: newPassword.trim(),
        message: data.message || "Password successfully reset.",
      });

      if (onSuccess) {
        onSuccess();
      }
    } catch (err: any) {
      setError(err.message || "An error occurred while resetting password.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-150">
      <div
        className="w-full max-w-md rounded-3xl bg-[#121826] border border-amber-500/30 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150 relative text-slate-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="p-5 sm:p-6 border-b border-slate-800 bg-amber-950/20 flex items-start gap-3.5">
          <div className="w-10 h-10 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center shrink-0">
            <KeyRound className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-base sm:text-lg font-bold text-white tracking-tight">
              Reset Employee Password
            </h3>
            <p className="text-xs text-amber-300/80 mt-0.5 truncate">
              Set a new temporary or permanent password for this account.
            </p>
          </div>
          <button
            onClick={onClose}
            disabled={loading}
            className="text-slate-400 hover:text-white p-1 rounded-lg transition-colors cursor-pointer shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-5 sm:p-6 space-y-4">
          {/* Target User Info Card */}
          <div className="p-3.5 rounded-2xl bg-slate-900/90 border border-slate-800 flex items-center justify-between text-xs">
            <div className="min-w-0 pr-2">
              <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                Target Employee
              </span>
              <p className="font-bold text-slate-100 truncate text-sm mt-0.5">
                {user.name}
              </p>
              <p className="text-slate-400 font-mono text-[11px] truncate">
                {user.email}
              </p>
            </div>
            {user.role && (
              <span
                className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase shrink-0 ${
                  user.role === "SUPER_ADMIN"
                    ? "bg-red-500/20 text-red-400 border border-red-500/30"
                    : "bg-slate-800 text-slate-300 border border-slate-700"
                }`}
              >
                {user.role}
              </span>
            )}
          </div>

          {error && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2 animate-in fade-in">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Success Result View */}
          {successResult ? (
            <div className="space-y-4 animate-in fade-in">
              <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 space-y-3">
                <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>Password Reset Successfully!</span>
                </div>
                <p className="text-xs text-slate-300">
                  Please share the new credentials with <strong>{user.name}</strong> securely.
                </p>

                {/* Monospace Password Display */}
                <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-emerald-500/40">
                  <div className="font-mono text-sm font-bold text-emerald-300 tracking-wider">
                    {successResult.password}
                  </div>
                  <button
                    type="button"
                    onClick={() => handleCopy(successResult.password)}
                    className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/30 transition-all cursor-pointer"
                  >
                    {copied ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="button"
                  onClick={onClose}
                  className="w-full sm:w-auto px-5 py-2 rounded-xl text-xs font-bold text-white bg-slate-800 hover:bg-slate-700 transition-colors cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          ) : (
            /* Reset Form */
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5 flex items-center justify-between">
                  <span>New Password</span>
                  <span className="text-[10px] text-slate-500 font-mono">min. 6 chars</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type={showPassword ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter new password..."
                    disabled={loading}
                    className="w-full bg-slate-900 border border-slate-700/80 rounded-xl pl-10 pr-10 py-2.5 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-amber-500 focus:border-amber-500 disabled:opacity-50"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    tabIndex={-1}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-200 cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Password Generator / Preset Helpers */}
              <div className="space-y-2 pt-1">
                <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                  Quick Actions
                </p>
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={generateRandomPassword}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 transition-colors cursor-pointer"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Generate Strong Password</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleApplyPreset("tmmin12345")}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors cursor-pointer"
                  >
                    <span>Use &quot;tmmin12345&quot;</span>
                  </button>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-3 border-t border-slate-800/80 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={loading}
                  className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white bg-slate-800/80 hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading || newPassword.length < 6}
                  className="px-4 py-2 text-xs font-bold text-black bg-amber-400 hover:bg-amber-300 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl transition-all shadow-md shadow-amber-500/20 cursor-pointer inline-flex items-center gap-1.5"
                >
                  {loading ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                      <span>Updating...</span>
                    </>
                  ) : (
                    <>
                      <KeyRound className="w-3.5 h-3.5" />
                      <span>Confirm Reset</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
