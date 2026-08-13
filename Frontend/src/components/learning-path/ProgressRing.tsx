interface ProgressRingProps {
  /** 0..1 fraction of the ring to fill. */
  progress: number;
  size: number;
  strokeWidth: number;
  trackColor: string;
  fillColor: string;
  children?: React.ReactNode;
}

/** A ring built from two overlaid SVG circles: a full-opacity track and a
 * fill circle whose visible arc length is controlled via stroke-dasharray.
 * This is the standard way to draw a progress ring in SVG without a
 * charting library — worth being able to explain stroke-dasharray/-dashoffset
 * math since it's easy to get backwards. */
export function ProgressRing({
  progress,
  size,
  strokeWidth,
  trackColor,
  fillColor,
  children,
}: ProgressRingProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const clamped = Math.max(0, Math.min(1, progress));
  const dashOffset = circumference * (1 - clamped);

  return (
    <div
      className="relative flex items-center justify-center"
      style={{ width: size, height: size }}
    >
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={trackColor}
          strokeWidth={strokeWidth}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={fillColor}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
          style={{ transition: "stroke-dashoffset 500ms ease-out" }}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        {children}
      </div>
    </div>
  );
}