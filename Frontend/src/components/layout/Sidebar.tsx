"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

interface NavItem {
  href: string;
  label: string;
  icon: React.ReactNode;
}

const NAV_ITEMS: NavItem[] = [
  {
    href: "/",
    label: "LEARN",
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M4 19V5a2 2 0 0 1 2-2h8l6 6v10a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2z" fill="currentColor" />
      </svg>
    ),
  },
  {
    href: "/leaderboard",
    label: "LEADERBOARDS",
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M6 9H2v12h4V9zm8-6H10v18h4V3zm8 10h-4v8h4v-8z" fill="currentColor" />
      </svg>
    ),
  },
  {
    href: "/profile",
    label: "PROFILE",
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <circle cx="12" cy="8" r="4" fill="currentColor" />
        <path d="M4 20c0-3.3 3.6-6 8-6s8 2.7 8 6" fill="currentColor" />
      </svg>
    ),
  },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="sidebar">
        <div className="sidebar-logo">
          <span className="sidebar-logo-icon">🇰🇷</span>
          <span className="sidebar-logo-text">duolingo</span>
        </div>
        <nav className="sidebar-nav">
          {NAV_ITEMS.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`sidebar-link ${isActive ? "sidebar-link-active" : ""}`}
              >
                <span className="sidebar-link-icon">{item.icon}</span>
                <span className="sidebar-link-label">{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* Mobile bottom tab bar */}
      <nav className="mobile-tabs">
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`mobile-tab ${isActive ? "mobile-tab-active" : ""}`}
            >
              <span className="mobile-tab-icon">{item.icon}</span>
              <span className="mobile-tab-label">{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </>
  );
}
