"use client";

import { useEffect, useState } from "react";
import Footprint from "./Footprint";

const SPLASH_PENDING_KEY = "wrs_splash_pending";

/** Call right after a successful login, before redirecting, so the next page plays the splash. */
export function queueSplash() {
  try { sessionStorage.setItem(SPLASH_PENDING_KEY, "1"); } catch {}
}

// Walking trail: 8 steps left→right, offsets from the trail's centre.
// Right foot (y > 0) walks on the lower side, left foot (mirrored) on the upper side.
const STEPS = Array.from({ length: 8 }, (_, i) => ({
  x: -175 + i * 50,
  y: i % 2 === 0 ? 11 : -11,
  mirrored: i % 2 === 1,
  delay: 0.05 + i * 0.17,
}));

export default function SplashScreen() {
  const [show, setShow]       = useState(false);
  const [exiting, setExiting] = useState(false);

  useEffect(() => {
    try {
      if (!sessionStorage.getItem(SPLASH_PENDING_KEY)) return;
    } catch {
      return;
    }

    // Clear the flag only once the splash has actually finished — clearing it up front
    // left the overlay stuck forever under StrictMode's double-run (timers cleared, 2nd run bails).
    setShow(true);
    const t1 = setTimeout(() => setExiting(true), 1700);
    const t2 = setTimeout(() => {
      setShow(false);
      try { sessionStorage.removeItem(SPLASH_PENDING_KEY); } catch {}
    }, 2350);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  if (!show) return null;

  return (
    <div className={`splash-overlay${exiting ? " splash-exit" : ""}`}>
      {/* Ambient orbs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-72 bg-red-700/15 rounded-full blur-[110px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-80 h-64 bg-rose-600/10 rounded-full blur-[90px] pointer-events-none" />

      {/* ── Main brand ── */}
      <div className="flex flex-col items-center gap-5 z-10 select-none">
        <div className="w-20 h-14 rounded-2xl bg-white p-2 shadow-2xl shadow-black/60">
          <img src="/fujitsu.png" alt="Fujitsu" className="w-full h-full object-contain" />
        </div>

        <div className="text-center space-y-1">
          <h1 className="text-5xl font-black tracking-tight text-white">
            Walk<span className="text-red-500">Rank</span>
          </h1>
          <p className="text-slate-400 text-sm font-medium">FID Corporate Step Tracker</p>
        </div>

        {/* ── Walking footstep trail ── */}
        <div className="relative h-14 w-[400px] max-w-[90vw] overflow-hidden mt-1">
          {STEPS.map((step, i) => (
            // Outer div positions (centred on the offset); inner div owns the stamp animation's transform
            <div
              key={i}
              className="absolute left-1/2 top-1/2"
              style={{ transform: `translate(calc(-50% + ${step.x}px), calc(-50% + ${step.y}px))` }}
            >
              <div
                className="text-red-500/70 splash-footstep"
                style={{ animationDelay: `${step.delay}s` }}
              >
                <Footprint mirrored={step.mirrored} />
              </div>
            </div>
          ))}
        </div>

        {/* ── Progress bar ── */}
        <div className="w-44 h-[2px] bg-slate-800 rounded-full overflow-hidden">
          <div className="h-full w-0 bg-gradient-to-r from-red-500 via-rose-400 to-orange-400 rounded-full animate-splash-bar" />
        </div>
      </div>
    </div>
  );
}
