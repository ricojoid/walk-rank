"use client";

import { useState } from "react";
import Link from "next/link";
import {
  LogOut,
  UserCog,
} from "lucide-react";
import ProfileEditModal from "@/components/ProfileEditModal";

interface NavbarProps {
  user: {
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

export default function Navbar({ user }: NavbarProps) {
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      window.location.href = "/login";
    } catch (err) {
      console.error(err);
    }
  };

  const isSuperAdmin = user.role === "SUPER_ADMIN";

  return (
    <>
      <header className="sticky top-0 z-40 w-full bg-[#0B0F17]/85 backdrop-blur-xl navbar-glow">
      <div className="w-full max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
        {/* Brand Logo */}
        <div className="flex items-center gap-6">
          <Link href={isSuperAdmin ? "/admin" : "/dashboard"} className="flex items-center gap-2.5 group">
            <div className="w-12 h-10 rounded-xl bg-white p-1.5 flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform">
              <img src="/fujitsu.png" alt="Fujitsu" width={48} height={27} className="w-full h-full object-contain" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-xl tracking-tight text-white group-hover:text-red-400 transition-colors">
                  Walk<span className="text-red-500">Rank</span>
                </span>
                <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
              </div>
              <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">
                 FID Wellness
              </p>
            </div>
          </Link>


        </div>

        {/* Right Action Area */}
        <div className="flex items-center gap-3">
          {/* User Profile Badge (Clickable to Edit Profile) */}
          <div className="flex items-center gap-2 pl-2 border-l border-slate-800">
            <button
              type="button"
              onClick={() => setIsProfileModalOpen(true)}
              className="flex items-center gap-2.5 p-1.5 pr-2.5 rounded-xl hover:bg-slate-800/60 border border-transparent hover:border-slate-700/60 transition-all text-left group cursor-pointer"
              title="Click to Edit Profile & Photo"
            >
              <div className="relative">
                {user.avatarUrl ? (
                  <img
                    src={user.avatarUrl}
                    alt={user.name}
                    className="w-8 h-8 rounded-full object-cover border border-slate-700 group-hover:border-red-500/50 transition-colors"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center border border-slate-700 text-xs font-bold text-slate-300 group-hover:border-red-500/50 transition-colors">
                    {user.name.charAt(0)}
                  </div>
                )}
                <span
                  className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-[#0B0F17] ${
                    isSuperAdmin ? "bg-red-500" : "bg-emerald-500"
                  }`}
                />
              </div>

              <div className="hidden sm:block text-left">
                <div className="flex items-center gap-1.5">
                  <p className="text-xs font-bold text-slate-100 max-w-[140px] truncate group-hover:text-red-400 transition-colors">
                    {user.name}
                  </p>
                </div>
                <p className="text-[10px] text-slate-400 truncate max-w-[140px] font-mono">
                  {user.username ? `@${user.username}` : user.email}
                </p>
              </div>

              <UserCog className="w-3.5 h-3.5 text-slate-500 group-hover:text-slate-300 transition-colors ml-1 hidden md:block" />
            </button>

            {/* Logout Button */}
            <button
              onClick={handleLogout}
              className="p-2 text-slate-400 hover:text-rose-400 hover:bg-rose-950/20 rounded-lg transition-colors cursor-pointer ml-1"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </header>

    {/* Edit Profile Modal */}
    <ProfileEditModal
      isOpen={isProfileModalOpen}
      onClose={() => setIsProfileModalOpen(false)}
      user={user}
    />
  </>
  );
}
