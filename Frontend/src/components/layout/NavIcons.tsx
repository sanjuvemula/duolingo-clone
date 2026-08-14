/**
 * Full-colour icons for the sidebar and mobile tab bar.
 *
 * These deliberately do NOT use `currentColor`, unlike every other icon in the
 * app. Duolingo's nav rail keeps each destination's colour whether or not it's
 * the active tab — the trophy stays gold, the shop bag stays red — and that
 * constant colour is most of what makes the rail read as playful rather than
 * like an admin sidebar. Tinting them to match the label would undo it.
 *
 * Every fill is a theme token rather than a literal hex, so the icons shift
 * with the palette in dark mode instead of glowing at full saturation against
 * a dark panel.
 *
 * Kept in their own module rather than inline in Sidebar.tsx: seven
 * multi-path icons is far more markup than the twenty lines of nav logic they
 * would otherwise be buried in.
 */

interface NavIconProps {
  size?: number;
}

/** Shared frame. Every icon is drawn on the same 24x24 grid so they align in
 * the rail without per-icon nudging. */
function Icon({ size = 24, children }: NavIconProps & { children: React.ReactNode }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      {children}
    </svg>
  );
}

/** LEARN — a book, the course itself. */
export function LearnIcon({ size }: NavIconProps) {
  return (
    <Icon size={size}>
      <path d="M3 5.5A1.5 1.5 0 0 1 4.5 4H10a2.5 2.5 0 0 1 2 1v14a2.5 2.5 0 0 0-2-1H4.5A1.5 1.5 0 0 1 3 16.5v-11z" fill="var(--green)" />
      <path d="M21 5.5A1.5 1.5 0 0 0 19.5 4H14a2.5 2.5 0 0 0-2 1v14a2.5 2.5 0 0 1 2-1h5.5a1.5 1.5 0 0 0 1.5-1.5v-11z" fill="var(--green-dark)" />
    </Icon>
  );
}

/** PRACTICE — a lightning bolt, matching the XP bolt used elsewhere. */
export function PracticeIcon({ size }: NavIconProps) {
  return (
    <Icon size={size}>
      <path d="M13 2L4 14h6l-1 8 9-12h-6l1-8z" fill="var(--gold)" />
      <path d="M13 2L9 22l9-12h-6l1-8z" fill="var(--gold-dark)" />
    </Icon>
  );
}

/** LEADERBOARDS — a trophy, not bar charts: the page is a league table. */
export function LeaderboardIcon({ size }: NavIconProps) {
  return (
    <Icon size={size}>
      <path d="M6 3h12v6a6 6 0 0 1-12 0V3z" fill="var(--gold)" />
      <path d="M6 4H4a1 1 0 0 0-1 1v1a4 4 0 0 0 3.6 4M18 4h2a1 1 0 0 1 1 1v1a4 4 0 0 1-3.6 4" stroke="var(--gold-dark)" strokeWidth="1.8" strokeLinecap="round" fill="none" />
      <path d="M10 15h4v3h-4z" fill="var(--gold-dark)" />
      <rect x="7" y="18" width="10" height="3" rx="1" fill="var(--gold-dark)" />
    </Icon>
  );
}

/** QUESTS — a treasure chest. */
export function QuestsIcon({ size }: NavIconProps) {
  return (
    <Icon size={size}>
      <path d="M3 10a5 5 0 0 1 5-5h8a5 5 0 0 1 5 5v1H3v-1z" fill="var(--purple)" />
      <rect x="3" y="11" width="18" height="8" rx="1.5" fill="var(--purple-dark)" />
      <rect x="10.5" y="9" width="3" height="5" rx="1" fill="var(--gold)" />
    </Icon>
  );
}

/** SHOP — a shopping bag. */
export function ShopIcon({ size }: NavIconProps) {
  return (
    <Icon size={size}>
      <path d="M5 8h14l-1 12H6L5 8z" fill="var(--red)" />
      <path d="M9 8V6a3 3 0 0 1 6 0v2" stroke="var(--red-dark)" strokeWidth="2.2" strokeLinecap="round" fill="none" />
    </Icon>
  );
}

/** PROFILE — a person. */
export function ProfileIcon({ size }: NavIconProps) {
  return (
    <Icon size={size}>
      <circle cx="12" cy="8" r="4" fill="var(--blue)" />
      <path d="M4 20c0-3.3 3.6-6 8-6s8 2.7 8 6" fill="var(--blue-dark)" />
    </Icon>
  );
}

/** MORE — an overflow menu. The one intentionally neutral icon: it isn't a
 * destination with an identity, it's "everything else". */
export function MoreIcon({ size }: NavIconProps) {
  return (
    <Icon size={size}>
      <circle cx="5" cy="12" r="2" fill="var(--stone)" />
      <circle cx="12" cy="12" r="2" fill="var(--stone)" />
      <circle cx="19" cy="12" r="2" fill="var(--stone)" />
    </Icon>
  );
}
