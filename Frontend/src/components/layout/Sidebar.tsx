"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Mascot } from "@/components/mascot/Mascot";

interface NavItem {
  href: string;
  label: string;
  icon: React.ReactNode;
  /** Whether this destination also earns a slot in the mobile tab bar.
   * Seven items fit a 240px-wide sidebar comfortably; seven 60px-wide tabs on
   * a 375px phone do not, so the bar takes the five that matter most and the
   * rest stay reachable from More. */
  mobile?: boolean;
  /** Label for the mobile tab bar when the sidebar's wording is too wide to
   * fit five abreast — "LEADERBOARDS" alone is most of a phone's width. */
  shortLabel?: string;
}

const NAV_ITEMS: NavItem[] = [
  {
    href: "/",
    label: "LEARN",
    mobile: true,
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M4 19V5a2 2 0 0 1 2-2h8l6 6v10a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2z" fill="currentColor" />
      </svg>
    ),
  },
  {
    href: "/practice",
    label: "PRACTICE",
    mobile: true,
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M13 2L4 14h6l-1 8 9-12h-6l1-8z" fill="currentColor" />
      </svg>
    ),
  },
  {
    href: "/leaderboard",
    label: "LEADERBOARDS",
    mobile: true,
    shortLabel: "LEAGUES",
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M6 9H2v12h4V9zm8-6H10v18h4V3zm8 10h-4v8h4v-8z" fill="currentColor" />
      </svg>
    ),
  },
  {
    href: "/quests",
    label: "QUESTS",
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M5 3h14a1 1 0 0 1 1 1v16l-8-4-8 4V4a1 1 0 0 1 1-1z" fill="currentColor" />
      </svg>
    ),
  },
  {
    href: "/shop",
    label: "SHOP",
    mobile: true,
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M5 8h14l-1 12H6L5 8z" fill="currentColor" />
        <path
          d="M9 8V6a3 3 0 0 1 6 0v2"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinecap="round"
          fill="none"
        />
      </svg>
    ),
  },
  {
    href: "/profile",
    label: "PROFILE",
    mobile: true,
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <circle cx="12" cy="8" r="4" fill="currentColor" />
        <path d="M4 20c0-3.3 3.6-6 8-6s8 2.7 8 6" fill="currentColor" />
      </svg>
    ),
  },
  {
    href: "/settings",
    label: "MORE",
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <circle cx="5" cy="12" r="2" fill="currentColor" />
        <circle cx="12" cy="12" r="2" fill="currentColor" />
        <circle cx="19" cy="12" r="2" fill="currentColor" />
      </svg>
    ),
  },
];

const MOBILE_ITEMS = NAV_ITEMS.filter((item) => item.mobile);

export function Sidebar() {
  const pathname = usePathname();

  // "/" would prefix-match every route, so it alone compares exactly. The rest
  // match their subtree, which keeps LEARN highlighted while a lesson at
  // /lesson/3 is open — a lesson is somewhere you go *from* Learn, not a
  // seventh destination.
  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="sidebar">
        <div className="sidebar-logo">
          <Mascot size={36} />
          <span className="sidebar-logo-text">duolingo</span>
        </div>
        <nav className="sidebar-nav">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              aria-current={isActive(item.href) ? "page" : undefined}
              className={`sidebar-link ${isActive(item.href) ? "sidebar-link-active" : ""}`}
            >
              <span className="sidebar-link-icon">{item.icon}</span>
              <span className="sidebar-link-label">{item.label}</span>
            </Link>
          ))}
        </nav>
      </aside>

      {/* Mobile bottom tab bar */}
      <nav className="mobile-tabs">
        {MOBILE_ITEMS.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            aria-current={isActive(item.href) ? "page" : undefined}
            className={`mobile-tab ${isActive(item.href) ? "mobile-tab-active" : ""}`}
          >
            <span className="mobile-tab-icon">{item.icon}</span>
            <span className="mobile-tab-label">{item.shortLabel ?? item.label}</span>
          </Link>
        ))}
      </nav>
    </>
  );
}
