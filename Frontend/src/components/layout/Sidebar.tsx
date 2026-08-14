"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Mascot } from "@/components/mascot/Mascot";
import {
  LearnIcon,
  PracticeIcon,
  LeaderboardIcon,
  QuestsIcon,
  ShopIcon,
  ProfileIcon,
  MoreIcon,
} from "./NavIcons";

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
  { href: "/", label: "LEARN", mobile: true, icon: <LearnIcon /> },
  { href: "/practice", label: "PRACTICE", mobile: true, icon: <PracticeIcon /> },
  {
    href: "/leaderboard",
    label: "LEADERBOARDS",
    mobile: true,
    shortLabel: "LEAGUES",
    icon: <LeaderboardIcon />,
  },
  { href: "/quests", label: "QUESTS", icon: <QuestsIcon /> },
  { href: "/shop", label: "SHOP", mobile: true, icon: <ShopIcon /> },
  { href: "/profile", label: "PROFILE", mobile: true, icon: <ProfileIcon /> },
  { href: "/settings", label: "MORE", icon: <MoreIcon /> },
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
