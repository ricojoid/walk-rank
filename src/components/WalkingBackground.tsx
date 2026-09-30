import Footprint from "./Footprint";

// Decorative footprints that keep "walking" across the page background.
// Pure CSS (opacity/transform only), so it stays on the compositor and costs almost nothing.
// Each trail is a line of footprints that light up one after another, then fade out.

const STEP_SPACING = 58; // px between consecutive footprints
const STEP_INTERVAL = 0.42; // s between consecutive footprints appearing
const FOOTPRINTS_PER_TRAIL = 30;
const CYCLE = FOOTPRINTS_PER_TRAIL * STEP_INTERVAL + 4; // s, incl. a short pause before the next lap

// top/left in %, angle in deg (0 = walking right), offset in s so trails don't move in sync
const TRAILS = [
  { top: 16, left: -6, angle: 7, offset: 0, color: "text-red-500" },
  { top: 58, left: -8, angle: -9, offset: -5, color: "text-rose-400" },
  { top: 92, left: 106, angle: 186, offset: -9, color: "text-amber-400" },
  { top: -4, left: 78, angle: 112, offset: -2.5, color: "text-slate-300" },
];

export default function WalkingBackground() {
  return (
    <div aria-hidden="true" className="walking-bg">
      {TRAILS.map((trail, t) => (
        <div
          key={t}
          className={`walking-bg-trail ${trail.color}`}
          style={{
            top: `${trail.top}%`,
            left: `${trail.left}%`,
            transform: `rotate(${trail.angle}deg)`,
          }}
        >
          {Array.from({ length: FOOTPRINTS_PER_TRAIL }, (_, i) => (
            <div
              key={i}
              className="walking-bg-step"
              style={{
                left: i * STEP_SPACING,
                top: i % 2 === 0 ? 12 : -12, // right foot lower, left foot upper
                animationDuration: `${CYCLE}s`,
                animationDelay: `${trail.offset + i * STEP_INTERVAL}s`,
              }}
            >
              <Footprint mirrored={i % 2 === 1} className="w-6 h-9" />
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
