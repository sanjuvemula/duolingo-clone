/**
 * Illustrations for the skill nodes on the learning path.
 *
 * The backend stores a short key on each skill ("greeting", "food", …) rather
 * than a URL, and this module is the only place that key becomes a picture.
 * Inline SVG rather than image files or emoji, for three reasons:
 *
 *   - every path uses `currentColor`, so a node's icon inherits whatever the
 *     node's state already sets (white on green, grey when locked) and works
 *     in dark mode without a second asset;
 *   - no image pipeline, no network request, nothing to 404 in production;
 *   - emoji would render as a different picture on every OS, which is exactly
 *     the kind of inconsistency the brief's UI criterion penalises.
 *
 * Unknown keys fall back to the star, so a typo in the seed data degrades to a
 * plain node instead of an empty hole in the path.
 */

interface SkillIconProps {
  /** The `icon` field from the skill-tree response. */
  name: string;
  size?: number;
  className?: string;
}

/** All paths are drawn on a 24x24 grid so they share one viewBox and read at
 * the same visual weight beside each other on the path. */
const PATHS: Record<string, React.ReactNode> = {
  // Basics
  greeting: (
    <>
      <path d="M12 3a9 9 0 0 1 9 9c0 4-3 7-9 7-1 0-2-.1-2.9-.3L4 21l1.4-3.6A8.7 8.7 0 0 1 3 12a9 9 0 0 1 9-9z" fill="currentColor" />
      <circle cx="9" cy="11.5" r="1.1" fill="var(--paper-raised)" />
      <circle cx="15" cy="11.5" r="1.1" fill="var(--paper-raised)" />
    </>
  ),
  number: (
    <>
      <path d="M9 3 7.5 21M16.5 3 15 21M4 8.5h16M3.5 15.5h16" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" fill="none" />
    </>
  ),
  chat: (
    <>
      <path d="M4 5h12a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2H9l-4 3v-3a2 2 0 0 1-1-2V7a2 2 0 0 1 0-2z" fill="currentColor" />
      <path d="M20 9v7a2 2 0 0 1-2 2h-1v2l-3-2" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </>
  ),
  star: (
    <path d="m12 3 2.7 5.6 6.1.8-4.5 4.2 1.2 6-5.5-3-5.5 3 1.2-6L3.2 9.4l6.1-.8L12 3z" fill="currentColor" />
  ),

  // Food
  food: (
    <>
      <path d="M6 3v8M6 11c-1.5 0-2.5-1-2.5-2.5V3M8.5 3v5.5C8.5 10 7.5 11 6 11M6 11v10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" fill="none" />
      <path d="M16.5 3c2 0 3.5 2.5 3.5 6s-1.5 4-3 4v8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </>
  ),
  drink: (
    <>
      <path d="M5 4h14l-1.6 5.5A6 6 0 0 1 12 14a6 6 0 0 1-5.4-4.5L5 4z" fill="currentColor" />
      <path d="M12 14v6M8.5 20h7" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" fill="none" />
    </>
  ),
  cart: (
    <>
      <path d="M3 4h2.2l2.3 10.5h9.6L19 7H7" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <circle cx="9" cy="19" r="1.7" fill="currentColor" />
      <circle cx="16.5" cy="19" r="1.7" fill="currentColor" />
    </>
  ),
  leaf: (
    <>
      <path d="M20 4C10 4 4 8 4 15a5 5 0 0 0 5 5c7 0 11-7 11-16z" fill="currentColor" />
      <path d="M17 7 6 19" stroke="var(--paper-raised)" strokeWidth="1.8" strokeLinecap="round" fill="none" />
    </>
  ),

  // Travel
  map: (
    <>
      <path d="m3 6 6-2.5v14L3 20V6z" fill="currentColor" />
      <path d="M9 3.5 15 6v14l-6-2.5v-14z" fill="currentColor" opacity="0.55" />
      <path d="M15 6l6-2.5v14L15 20V6z" fill="currentColor" />
    </>
  ),
  compass: (
    <>
      <circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" strokeWidth="2.2" />
      <path d="m15.5 8.5-2 5.2-5.2 2 2-5.2 5.2-2z" fill="currentColor" />
    </>
  ),
  bus: (
    <>
      <path d="M5 5h14a1 1 0 0 1 1 1v9H4V6a1 1 0 0 1 1-1z" fill="currentColor" />
      <path d="M6 8.5h12" stroke="var(--paper-raised)" strokeWidth="2" strokeLinecap="round" fill="none" />
      <circle cx="7.5" cy="18" r="1.8" fill="currentColor" />
      <circle cx="16.5" cy="18" r="1.8" fill="currentColor" />
    </>
  ),
  bag: (
    <>
      <path d="M5 8h14l-1 12H6L5 8z" fill="currentColor" />
      <path d="M9 8V6a3 3 0 0 1 6 0v2" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" fill="none" />
    </>
  ),

  // Family
  family: (
    <>
      <circle cx="8" cy="7.5" r="3" fill="currentColor" />
      <circle cx="16.5" cy="9" r="2.4" fill="currentColor" />
      <path d="M2.5 20c0-3.2 2.5-5.5 5.5-5.5s5.5 2.3 5.5 5.5" fill="currentColor" />
      <path d="M14.5 20c0-2.6 1.4-4.3 3.5-4.3s3.5 1.7 3.5 4.3" fill="currentColor" opacity="0.6" />
    </>
  ),
  sun: (
    <>
      <circle cx="12" cy="12" r="4.2" fill="currentColor" />
      <path d="M12 2.5v2.2M12 19.3v2.2M2.5 12h2.2M19.3 12h2.2M5.2 5.2l1.6 1.6M17.2 17.2l1.6 1.6M18.8 5.2l-1.6 1.6M6.8 17.2l-1.6 1.6" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" fill="none" />
    </>
  ),
  clock: (
    <>
      <circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" strokeWidth="2.2" />
      <path d="M12 6.8V12l3.4 2.2" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </>
  ),
  people: (
    <>
      <circle cx="12" cy="7.5" r="3.4" fill="currentColor" />
      <path d="M4.5 20c0-3.8 3.4-6.5 7.5-6.5s7.5 2.7 7.5 6.5" fill="currentColor" />
    </>
  ),
};

/** Key used when a skill's icon isn't in PATHS. Exported so tests and the
 * seed script's contract have one name to refer to rather than a loose "star"
 * string in three places. */
export const FALLBACK_SKILL_ICON = "star";

export function SkillIcon({ name, size = 30, className }: SkillIconProps) {
  const shape = PATHS[name] ?? PATHS[FALLBACK_SKILL_ICON];

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      {shape}
    </svg>
  );
}
