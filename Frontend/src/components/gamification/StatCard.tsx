import type { ReactNode } from "react";

interface StatCardProps {
  icon: ReactNode;
  label: string;
  value: string | number;
  /** CSS color for the icon — keeps the component agnostic to which stat
   * it's rendering, so callers pick the palette color. */
  color: string;
}

/** A single stat tile used on the profile page. Same visual language as
 * TopBar's inline stats but in a larger card format suited to a full page. */
export function StatCard({ icon, label, value, color }: StatCardProps) {
  return (
    <div className="flex flex-col items-center gap-2 rounded-2xl bg-paper-raised px-5 py-5 shadow-sm">
      <span style={{ color }}>{icon}</span>
      <p className="font-display text-2xl font-bold text-ink">{value}</p>
      <p className="text-xs font-medium text-ink-soft">{label}</p>
    </div>
  );
}
