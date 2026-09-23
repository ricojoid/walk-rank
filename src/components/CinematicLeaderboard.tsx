"use client";

import { useEffect, useReducer, useRef, useState } from "react";
import { Crown, Play, Trophy, X } from "lucide-react";
import confetti from "canvas-confetti";

export interface RevealParticipant {
  userId: string;
  name: string;
  rank: number;
  finalScore: number;
  totalCountedSteps: number;
  goalsMetCount: number;
  department?: string | null;
  avatarUrl?: string | null;
}

export function getRevealParticipants(participants: readonly RevealParticipant[]): RevealParticipant[] {
  // Include every top-10 rank, preserving the server's rankings and tie-breaks.
  return participants.filter((person) => person.rank <= 10 && person.rank >= 1)
    .map((person) => ({ ...person })).sort((a, b) => b.rank - a.rank);
}

export function getRevealScenes(participants: readonly RevealParticipant[]) {
  return getRevealParticipants(participants).flatMap((winner) => winner.rank <= 3
    ? [{ winner, suspense: true, duration: 3000 }, { winner, suspense: false, duration: 6000 }]
    : [{ winner, suspense: false, duration: 3000 }]);
}

interface RevealState { scene: number; lastScene: number; playing: boolean }
type RevealAction = "start" | "next" | "back" | "tick" | "toggle" | "pause" | "replay";

export function revealReducer(state: RevealState, action: RevealAction): RevealState {
  switch (action) {
    case "start": return { ...state, scene: Math.min(1, state.lastScene), playing: state.lastScene > 0 };
    case "pause": return { ...state, playing: false };
    case "toggle": return { ...state, playing: state.scene < state.lastScene && !state.playing };
    case "replay": return { ...state, scene: 0, playing: false };
    case "back": return { ...state, scene: Math.max(0, state.scene - 1), playing: false };
    case "tick":
      if (!state.playing) return state;
    case "next": {
      const scene = Math.min(state.lastScene, state.scene + 1);
      return { ...state, scene, playing: action === "tick" && state.scene < state.lastScene };
    }
  }
}

interface CinematicLeaderboardProps {
  participants: readonly RevealParticipant[];
  period: string;
  onClose: () => void;
}

export default function CinematicLeaderboard({ participants, period, onClose }: CinematicLeaderboardProps) {
  // Freeze the ceremony at launch so live polling cannot swap a winner mid-reveal.
  const [scenes] = useState(() => getRevealScenes(participants));
  const [periodLabel] = useState(period);
  const [state, dispatch] = useReducer(revealReducer, { scene: 0, lastScene: scenes.length, playing: false });
  const dialogRef = useRef<HTMLDialogElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const currentScene = scenes[state.scene - 1];
  const winner = currentScene?.winner;
  const duration = currentScene?.duration ?? 3000;

  useEffect(() => {
    const dialog = dialogRef.current;
    dialog?.showModal();
    return () => dialog?.close();
  }, []);

  useEffect(() => {
    if (!state.playing) return;
    const timeout = window.setTimeout(() => dispatch("tick"), duration);
    return () => window.clearTimeout(timeout);
  }, [state.scene, state.playing, duration]);

  useEffect(() => {
    const pauseWhenHidden = () => { if (document.hidden) dispatch("pause"); };
    const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
    const pauseForReducedMotion = () => { if (preference.matches) dispatch("pause"); };
    document.addEventListener("visibilitychange", pauseWhenHidden);
    preference.addEventListener("change", pauseForReducedMotion);
    return () => {
      document.removeEventListener("visibilitychange", pauseWhenHidden);
      preference.removeEventListener("change", pauseForReducedMotion);
    };
  }, []);

  useEffect(() => {
    if (winner?.rank !== 1 || currentScene?.suspense || !canvasRef.current) return;
    // Render inside the dialog's top layer, above the stage instead of behind it.
    const celebrate = confetti.create(canvasRef.current, { resize: true });
    try {
      void celebrate({ particleCount: 110, spread: 90, origin: { y: 0.6 },
        colors: ["#e6c88a", "#ffffff", "#ed2939", "#5eead4"], disableForReducedMotion: true });
    } catch (error) {
      console.error("Cinematic celebration failed:", error);
    }
    return () => celebrate.reset();
  }, [currentScene, winner]);

  return (
    <dialog ref={dialogRef} className="cinema-dialog" aria-labelledby="cinema-title" aria-describedby="cinema-shortcuts"
      onCancel={(event) => { event.preventDefault(); onClose(); }}
      onKeyDown={(event) => {
        if (event.key === "Escape") event.stopPropagation();
        if (event.code === "Space" && scenes.length && !(event.target instanceof HTMLElement && event.target.closest("button"))) {
          event.preventDefault();
          dispatch(state.scene === 0 ? "start" : "toggle");
        }
        if (scenes.length && (event.key === "ArrowRight" || event.key === "ArrowLeft")) {
          event.preventDefault();
          dispatch(event.key === "ArrowRight" ? "next" : "back");
        }
      }}>
      <div className="cinema-shell">
        <p id="cinema-shortcuts" className="sr-only">Space to pause or resume. Left and right arrows to navigate. Escape to close.</p>
        <div className="cinema-spotlight" aria-hidden="true" />
        <div className="cinema-orbit" aria-hidden="true" />
        <canvas ref={canvasRef} className="pointer-events-none absolute inset-0 h-full w-full z-20" aria-hidden="true" />
        <header className="relative z-30 flex items-center justify-between gap-4 p-4 sm:px-8 sm:py-6">
          <div className="flex items-center gap-3 min-w-0">
            <img src="/fujitsu.png" alt="Fujitsu" width={56} height={36} className="h-9 w-14 rounded-lg bg-white p-1.5 object-contain" />
            <div className="min-w-0">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-white">WalkRank <span className="text-amber-200">Awards</span></p>
              <p className="text-xs text-slate-400 truncate max-w-[55vw]" title={periodLabel}>{periodLabel}</p>
            </div>
          </div>
          <button type="button" onClick={onClose} autoFocus className="cinema-control" aria-label="Close cinematic mode (Escape)"><X className="h-5 w-5" /></button>
        </header>

        <main className="relative z-10 flex flex-1 items-center justify-center px-5 py-8 sm:px-12" aria-live="polite" aria-atomic="true">
          <div key={state.scene} className="cinema-reveal w-full max-w-5xl text-center">
            {state.scene === 0 ? (
              <>
                <span className="cinema-eyebrow">The effort. The consistency. The recognition.</span>
                <div className="cinema-emblem mx-auto my-8"><Trophy className="h-12 w-12 sm:h-16 sm:w-16" /></div>
                <h1 id="cinema-title" className="cinema-title">Every step deserves<br /><span className="cinema-gold">a moment.</span></h1>
                <p className="mt-5 text-sm sm:text-base text-slate-400">{scenes.length ? "Meet the top 10 walkers leading the way." : "No participants found for this period yet."}</p>
                {scenes.length > 0 && <button type="button" onClick={() => dispatch("start")} className="btn-primary mt-8 inline-flex items-center gap-2 rounded-full px-7 py-3 text-sm font-bold text-white"><Play className="h-4 w-4" /> Begin the reveal</button>}
              </>
            ) : currentScene?.suspense ? (
              <>
                <span className="cinema-eyebrow">{winner.rank === 1 ? "One final moment" : "The podium awaits"}</span>
                <div className="cinema-emblem mx-auto my-8"><Trophy className="h-16 w-16" /></div>
                <h1 id="cinema-title" className="cinema-title">{winner.rank === 1 ? "And our champion is…" : <>Taking the spotlight<br /><span className="cinema-gold">Rank #{winner.rank}</span></>}</h1>
                <p className="mt-6 text-sm text-slate-400">A moment worth waiting for.</p>
              </>
            ) : winner ? (
              <>
                <span className="cinema-eyebrow">{winner.rank === 1 ? "The moment we’ve been waiting for" : "Celebrating dedication"}</span>
                <div className="cinema-rank" aria-hidden="true">{String(winner.rank).padStart(2, "0")}</div>
                <div className="relative">
                  <div className="cinema-emblem mx-auto mt-7 mb-5" data-rank={winner.rank}>
                    {winner.avatarUrl ? <img src={winner.avatarUrl} alt="" className="h-full w-full rounded-full object-cover" /> : <span className="text-5xl font-bold">{winner.name.charAt(0)}</span>}
                    <span className="absolute -bottom-3 rounded-full bg-amber-200 px-4 py-1 text-xs font-black text-slate-950">#{winner.rank}</span>
                  </div>
                  <p className="mb-3 mt-7 inline-flex items-center gap-2 text-xs uppercase tracking-[0.25em] text-amber-200"><Crown className="w-4 h-4" /> {winner.rank === 1 ? "Our champion" : winner.rank === 2 ? "Silver spotlight" : winner.rank === 3 ? "Bronze spotlight" : "Top 10 spotlight"}</p>
                  <h1 id="cinema-title" className="cinema-title break-words">{winner.name}</h1>
                  <p className="mt-3 text-slate-400">{winner.department || "Team WalkRank"}</p>
                  <div className="mx-auto mt-8 grid max-w-xl grid-cols-3 gap-2 sm:gap-6 border-t border-white/10 pt-6">
                    <div><p className="cinema-gold text-3xl sm:text-5xl font-black tabular-nums">{winner.finalScore.toFixed(1)}</p><p className="mt-2 text-xs text-slate-400">Final score / 100</p></div>
                    <div><p className="text-xl sm:text-3xl font-bold tabular-nums">{winner.totalCountedSteps.toLocaleString("en-US")}</p><p className="mt-2 text-xs text-slate-400">Counted steps</p></div>
                    <div><p className="text-xl sm:text-3xl font-bold tabular-nums text-teal-200">{winner.goalsMetCount}</p><p className="mt-2 text-xs text-slate-400">Goal days</p></div>
                  </div>
                </div>
              </>
            ) : null}
          </div>
        </main>

      </div>
    </dialog>
  );
}
