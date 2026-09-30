// Footprint SVG, rotated so toes point right (direction of travel). mirrored = left foot.
export default function Footprint({
  mirrored = false,
  className = "w-5 h-8",
}: {
  mirrored?: boolean;
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 20 32"
      fill="currentColor"
      className={className}
      aria-hidden="true"
      style={{ transform: mirrored ? "rotate(90deg) scaleX(-1)" : "rotate(90deg)" }}
    >
      {/* Heel */}
      <ellipse cx="10" cy="26" rx="6" ry="5" />
      {/* Arch */}
      <ellipse cx="8.5" cy="18" rx="4" ry="5.5" />
      {/* Ball */}
      <ellipse cx="10" cy="11" rx="5.5" ry="4" />
      {/* Toes */}
      <circle cx="5"   cy="6.5" r="2"   />
      <circle cx="8.5" cy="4.5" r="2.2" />
      <circle cx="12"  cy="5"   r="1.9" />
      <circle cx="15"  cy="7"   r="1.6" />
      <circle cx="6.5" cy="3"   r="1.5" />
    </svg>
  );
}
