"use client";

import { Sidebar } from "./Sidebar";

interface AppShellProps {
  children: React.ReactNode;
}

/** Wraps pages that need the persistent sidebar navigation.
 * The lesson player does NOT use this — it's a focused experience. */
export function AppShell({ children }: AppShellProps) {
  return (
    <div className="app-shell">
      <Sidebar />
      <main className="app-main">{children}</main>
    </div>
  );
}
