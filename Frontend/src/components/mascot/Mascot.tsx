interface MascotProps {
  size?: number;
  className?: string;
  /** Closed, curved eyes instead of open ones — used on celebration screens. */
  happy?: boolean;
}

/**
 * The app's owl mascot, drawn inline as SVG.
 *
 * Original artwork built from primitive shapes (circles, paths, ellipses) so
 * the project ships no third-party image assets and the mascot inherits the
 * palette's CSS variables — meaning it restyles automatically if the theme
 * changes, which a raster asset could not do.
 */
export function Mascot({ size = 96, className, happy = false }: MascotProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 120 120"
      fill="none"
      className={className}
      role="img"
      aria-label="Owl mascot"
    >
      {/* Body */}
      <ellipse cx="60" cy="70" rx="40" ry="42" fill="var(--green)" />
      {/* Belly */}
      <ellipse cx="60" cy="80" rx="27" ry="29" fill="var(--green-light)" />

      {/* Ear tufts */}
      <path d="M26 38 L34 12 L50 30 Z" fill="var(--green)" />
      <path d="M94 38 L86 12 L70 30 Z" fill="var(--green)" />

      {/* Eye whites */}
      <circle cx="45" cy="52" r="17" fill="#ffffff" />
      <circle cx="75" cy="52" r="17" fill="#ffffff" />

      {happy ? (
        <>
          {/* Closed, upward-curved eyes */}
          <path
            d="M36 54 Q45 44 54 54"
            stroke="var(--ink)"
            strokeWidth="4"
            strokeLinecap="round"
            fill="none"
          />
          <path
            d="M66 54 Q75 44 84 54"
            stroke="var(--ink)"
            strokeWidth="4"
            strokeLinecap="round"
            fill="none"
          />
        </>
      ) : (
        <>
          <circle cx="45" cy="53" r="7" fill="var(--ink)" />
          <circle cx="75" cy="53" r="7" fill="var(--ink)" />
          {/* Catchlights — the small offset highlight is what stops the eyes
              reading as flat dots. */}
          <circle cx="47.5" cy="50.5" r="2.4" fill="#ffffff" />
          <circle cx="77.5" cy="50.5" r="2.4" fill="#ffffff" />
        </>
      )}

      {/* Beak */}
      <path d="M60 60 L69 71 L60 78 L51 71 Z" fill="var(--gold)" />
      <path d="M60 71 L69 71 L60 78 Z" fill="var(--gold-dark)" />

      {/* Feet */}
      <path
        d="M46 108 l0 6 M52 108 l0 6 M40 108 l0 6"
        stroke="var(--gold-dark)"
        strokeWidth="4"
        strokeLinecap="round"
      />
      <path
        d="M74 108 l0 6 M80 108 l0 6 M68 108 l0 6"
        stroke="var(--gold-dark)"
        strokeWidth="4"
        strokeLinecap="round"
      />
    </svg>
  );
}
