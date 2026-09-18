"use client";

import { useState, useEffect } from "react";
import {
  X,
  Footprints,
  Flame,
  Navigation,
  Calendar,
  Target,
  Award,
  CheckCircle2,
  Clock,
  Shield,
  User,
  Image as ImageIcon,
  Trash2,
  KeyRound,
} from "lucide-react";
import EvidenceViewerModal from "@/components/EvidenceViewerModal";
import DeleteLogConfirmModal from "@/components/DeleteLogConfirmModal";

interface UserDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string | null;
  initialUser?: any;
  startDate?: string;
  endDate?: string;
  selectedDates?: string[];
  onUpdateRole?: (userId: string, newRole: "USER" | "SUPER_ADMIN", dailyGoal: number) => Promise<void>;
  onLogDeleted?: () => void;
  onResetPassword?: (user: any) => void;
}

export default function UserDetailModal({
  isOpen,
  onClose,
  userId,
  initialUser,
  startDate,
  endDate,
  selectedDates,
  onUpdateRole,
  onLogDeleted,
  onResetPassword,
}: UserDetailModalProps) {
  const [loading, setLoading] = useState(false);
  const [userData, setUserData] = useState<any>(initialUser || null);
  const [logs, setLogs] = useState<any[]>([]);
  const [editRole, setEditRole] = useState<"USER" | "SUPER_ADMIN">("USER");
  const [editGoal, setEditGoal] = useState<number>(10000);
  const [saveLoading, setSaveLoading] = useState(false);
  const [selectedEvidence, setSelectedEvidence] = useState<any>(null);
  const [deleteTargetLog, setDeleteTargetLog] = useState<any | null>(null);

  useEffect(() => {
    if (isOpen && userId) {
      if (initialUser) {
        setUserData(initialUser);
        setEditRole(initialUser.role || "USER");
        setEditGoal(initialUser.dailyGoal || 10000);
      } else {
        setUserData(null);
      }
      setLogs([]);
      fetchUserDetails();
    }
  }, [isOpen, userId, initialUser, startDate, endDate, selectedDates]);

  const fetchUserDetails = async () => {
    if (!userId) return;
    setLoading(true);
    try {
      let url = `/api/steps?userId=${userId}`;
      if (selectedDates && selectedDates.length > 0) {
        url += `&dates=${selectedDates.join(",")}`;
      } else {
        if (startDate) url += `&startDate=${startDate}`;
        if (endDate) url += `&endDate=${endDate}`;
      }

      const logsRes = await fetch(url);
      const logsData = await logsRes.json();

      if (logsData.user) {
        setUserData(logsData.user);
        setEditRole(logsData.user.role || "USER");
        setEditGoal(logsData.user.dailyGoal || 10000);
      } else {
        // Fallback fetch admin user list if needed
        const usersRes = await fetch("/api/admin/users");
        const usersData = await usersRes.json();
        const targetUser = usersData.users?.find((u: any) => u.id === userId);
        if (targetUser) {
          setUserData(targetUser);
          setEditRole(targetUser.role || "USER");
          setEditGoal(targetUser.dailyGoal || 10000);
        }
      }

      setLogs(logsData.logs || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProfile = async () => {
    if (!userId || !onUpdateRole) return;
    setSaveLoading(true);
    try {
      await onUpdateRole(userId, editRole, editGoal);
      if (userData) {
        setUserData({ ...userData, role: editRole, dailyGoal: editGoal });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSaveLoading(false);
    }
  };

  if (!isOpen) return null;

  const goal = userData?.dailyGoal || 8000;
  const totalActualSteps = logs.reduce((acc, l) => acc + l.stepCount, 0);
  const totalCountedSteps = logs.reduce((acc, l) => acc + Math.min(l.stepCount, 10000), 0);
  const totalExcessSteps = logs.reduce((acc, l) => acc + Math.max(0, l.stepCount - 10000), 0);
  const totalKm = Number((totalActualSteps * 0.00076).toFixed(2));
  const totalCalories = Math.round(totalActualSteps * 0.042);
  const score = logs.filter((l) => l.stepCount >= goal).length;
  const goalRate = logs.length > 0 ? Math.round((score / logs.length) * 100) : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl max-h-[90vh] flex flex-col rounded-2xl bg-[#121826] border border-slate-700/80 shadow-2xl text-slate-100 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-800 shrink-0 bg-slate-900/40">
          <div className="flex items-center gap-3">
            {userData?.avatarUrl ? (
              <img
                src={userData.avatarUrl}
                alt={userData.name}
                className="w-12 h-12 rounded-full object-cover border-2 border-red-500/40"
              />
            ) : (
              <div className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center border border-slate-700 text-lg font-bold text-red-400">
                {userData?.name?.charAt(0) || "U"}
              </div>
            )}
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-lg text-white">{userData?.name || "Participant Details"}</h3>
                <span
                  className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase ${
                    userData?.role === "SUPER_ADMIN"
                      ? "bg-red-500/20 text-red-400 border border-red-500/30"
                      : "bg-slate-800 text-slate-300 border border-slate-700"
                  }`}
                >
                  {userData?.role || "USER"}
                </span>
              </div>
              <p className="text-xs text-slate-400">
                {userData?.email}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Quick Metrics Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3.5 rounded-xl bg-slate-900/70 border border-slate-800">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                <Award className="w-3 h-3 text-amber-400" />
                Goal Days
              </p>
              <p className="text-lg font-black text-amber-400 mt-0.5">
                {score} {score === 1 ? "Day" : "Days"}
              </p>
              <p className="text-[10px] text-slate-400">{score}/{logs.length} days &ge; {goal.toLocaleString("en-US")} ({goalRate}%)</p>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-900/70 border border-slate-800">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                Counted Steps
              </p>
              <p className="text-lg font-black text-white mt-0.5">
                {totalCountedSteps.toLocaleString("en-US")}
              </p>
              <p className="text-[10px] text-slate-400">Max 10,000 / day</p>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-900/70 border border-slate-800">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                Excess Steps
              </p>
              <p className="text-lg font-bold text-slate-300 mt-0.5">
                +{totalExcessSteps.toLocaleString("en-US")}
              </p>
              <p className="text-[10px] text-slate-500">Bonus / info</p>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-900/70 border border-slate-800">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                Actual Steps
              </p>
              <p className="text-lg font-bold text-slate-300 mt-0.5">
                {totalActualSteps.toLocaleString("en-US")}
              </p>
              <p className="text-[10px] text-slate-400">{totalKm} km • {totalCalories.toLocaleString("en-US")} kcal</p>
            </div>
          </div>

          {/* Role & Goal Settings for Admin */}
          {onUpdateRole && (
            <div className="p-4 rounded-xl bg-slate-900/50 border border-slate-800/80 space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200 flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5 text-red-500" />
                Manage Permissions & Goal
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-medium text-slate-400 mb-1">
                    Account Role
                  </label>
                  <select
                    value={editRole}
                    onChange={(e) => setEditRole(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-red-500"
                  >
                    <option value="USER">Standard User</option>
                    <option value="SUPER_ADMIN">Super Admin</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-slate-400 mb-1">
                    Daily Step Goal
                  </label>
                  <input
                    type="number"
                    value={editGoal}
                    onChange={(e) => setEditGoal(Number(e.target.value))}
                    min={1000}
                    step={500}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-red-500"
                  />
                </div>
              </div>
              <div className="flex items-center justify-between pt-1">
                {onResetPassword && (
                  <button
                    type="button"
                    onClick={() =>
                      onResetPassword({
                        ...userData,
                        id: userData?.id || userData?.userId || userId,
                      })
                    }
                    className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 transition-colors inline-flex items-center gap-1.5 cursor-pointer"
                  >
                    <KeyRound className="w-3.5 h-3.5" />
                    <span>Reset Password</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={handleSaveProfile}
                  disabled={saveLoading}
                  className="px-4 py-1.5 text-xs font-bold rounded-lg bg-red-600 hover:bg-red-500 text-white transition-colors cursor-pointer shadow-sm disabled:opacity-50 ml-auto"
                >
                  {saveLoading ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </div>
          )}

          {/* Historical Log Table */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 mb-3 flex items-center justify-between">
              <span>Step Activity History ({logs.length} entries)</span>
              {selectedDates && selectedDates.length > 0 ? (
                <span className="text-[11px] text-red-400 font-semibold bg-red-500/10 px-2 py-0.5 rounded border border-red-500/20">
                  Filter: {selectedDates.length} Selected Dates
                </span>
              ) : startDate && endDate ? (
                <span className="text-[11px] text-slate-400 font-normal">
                  Period: {startDate} to {endDate}
                </span>
              ) : null}
            </h4>

            {loading ? (
              <div className="p-8 text-center text-slate-500 text-xs">Loading activity history...</div>
            ) : logs.length === 0 ? (
              <div className="p-8 text-center text-slate-500 text-xs bg-slate-900/30 rounded-xl border border-slate-800">
                No step logs recorded for this period.
              </div>
            ) : (
              <div className="overflow-x-auto rounded-xl border border-slate-800">
                <table className="w-full text-left text-xs text-slate-300">
                  <thead className="bg-slate-900/90 text-[11px] uppercase tracking-wider text-slate-400 border-b border-slate-800">
                    <tr>
                      <th className="px-3 py-2.5">Date</th>
                      <th className="px-3 py-2.5">Counted Steps</th>
                      <th className="px-3 py-2.5">Excess</th>
                      <th className="px-3 py-2.5">Target (8k) & Score</th>
                      <th className="px-3 py-2.5">Photo Evidence</th>
                      <th className="px-3 py-2.5">Notes</th>
                      <th className="px-3 py-2.5 text-right sticky right-0 bg-slate-900/95 z-20 shadow-[-6px_0_10px_-2px_rgba(0,0,0,0.5)]">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 bg-slate-900/30">
                    {logs.map((log) => {
                      const d = new Date(log.date);
                      const isMet = log.stepCount >= goal;
                      const counted = Math.min(log.stepCount, 10000);
                      const excess = Math.max(0, log.stepCount - 10000);

                      return (
                        <tr key={log.id} className="hover:bg-slate-800/40 transition-colors group">
                          <td className="px-3 py-2.5 font-medium text-slate-200 whitespace-nowrap">
                            {d.toLocaleDateString("en-US", {
                              weekday: "short",
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            })}
                          </td>
                          <td className="px-3 py-2.5">
                            <span className="font-black text-white">
                              {counted.toLocaleString("en-US")}
                            </span>
                            <span className="text-[10px] text-slate-400 ml-1">steps</span>
                          </td>
                          <td className="px-3 py-2.5">
                            {excess > 0 ? (
                              <span className="text-slate-300 font-semibold text-[11px]">
                                +{excess.toLocaleString("en-US")}
                              </span>
                            ) : (
                              <span className="text-slate-600">-</span>
                            )}
                          </td>
                          <td className="px-3 py-2.5 whitespace-nowrap">
                            {isMet ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                                <CheckCircle2 className="w-3 h-3" /> +1 Point (Achieved)
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                                {(goal - log.stepCount).toLocaleString("en-US")} remaining
                              </span>
                            )}
                          </td>
                          <td className="px-3 py-2.5 whitespace-nowrap">
                            {log.evidenceUrl ? (
                              <button
                                type="button"
                                onClick={() =>
                                  setSelectedEvidence({
                                    evidenceUrl: log.evidenceUrl,
                                    userName: userData?.name,
                                    date: log.date,
                                    stepCount: log.stepCount,
                                    note: log.note,
                                  })
                                }
                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 hover:border-red-500/50 transition-colors cursor-pointer"
                                title="Click to view full photo evidence"
                              >
                                <img
                                  src={log.evidenceUrl}
                                  alt="Evidence"
                                  className="w-4 h-4 rounded object-cover border border-slate-700"
                                />
                                <span>Inspect Photo</span>
                              </button>
                            ) : (
                              <span className="text-slate-600 text-[11px]">-</span>
                            )}
                          </td>
                          <td className="px-3 py-2.5 text-slate-400 italic max-w-xs truncate">
                            {log.note || "-"}
                          </td>
                          <td className="px-3 py-2.5 text-right whitespace-nowrap sticky right-0 bg-[#121826] group-hover:bg-[#1a2234] transition-colors z-10 shadow-[-6px_0_10px_-2px_rgba(0,0,0,0.5)]">
                            <button
                              type="button"
                              onClick={() =>
                                setDeleteTargetLog({
                                  id: log.id,
                                  date: log.date,
                                  stepCount: log.stepCount,
                                  userName: userData?.name,
                                  userEmail: userData?.email,
                                  avatarUrl: userData?.avatarUrl,
                                  evidenceUrl: log.evidenceUrl,
                                  note: log.note,
                                })
                              }
                              className="px-2.5 py-1 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 border border-transparent hover:border-rose-500/30 transition-colors inline-flex items-center gap-1 cursor-pointer text-[11px] font-semibold"
                              title="Delete this step log entry"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              <span>Delete</span>
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

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-900/60 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-xl transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>

      {/* Evidence Viewer Modal */}
      <EvidenceViewerModal
        isOpen={!!selectedEvidence}
        onClose={() => setSelectedEvidence(null)}
        {...selectedEvidence}
      />

      {/* Delete Log Confirmation Modal */}
      <DeleteLogConfirmModal
        isOpen={!!deleteTargetLog}
        onClose={() => setDeleteTargetLog(null)}
        log={deleteTargetLog}
        onLogDeleted={() => {
          fetchUserDetails();
          onLogDeleted?.();
        }}
      />
    </div>
  );
}
