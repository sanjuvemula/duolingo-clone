"use client";

import { useEffect, useState } from "react";
import { CURRENT_USER_ID } from "@/lib/constants";
import { ApiError, getLeaderboard } from "@/services/api";
import type { LeaderboardEntry } from "@/types/api";
import { AppShell } from "@/components/layout/AppShell";
import { CrownIcon } from "@/components/learning-path/icons";

export default function LeaderboardPage() {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    getLeaderboard(CURRENT_USER_ID)
      .then((data) => {
        if (!cancelled) {
          setEntries(data);
          setLoading(false);
        }
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setError(
            err instanceof ApiError
              ? err.message
              : "Couldn't reach the server. Is the backend running?"
          );
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return (
      <AppShell>
        <div className="flex flex-1 items-center justify-center">
          <p className="font-display text-ink-soft">Loading leaderboard…</p>
        </div>
      </AppShell>
    );
  }

  if (error) {
    return (
      <AppShell>
        <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6 text-center">
          <p className="font-display text-lg font-bold text-ink">
            Couldn&apos;t load leaderboard
          </p>
          <p className="max-w-sm text-sm text-ink-soft">{error}</p>
        </div>
      </AppShell>
    );
  }

  // Every row carries the same league, so the first one identifies it.
  const league = entries[0];

  // Leagues reset at Monday 00:00 UTC, matching user_service.current_week_start.
  const daysUntilReset = 7 - ((new Date().getUTCDay() + 6) % 7);

  return (
    <AppShell>
      {/* League banner — the leaderboard is per-league and weekly, so the
          heading has to say which league and what the bands mean, or the
          promotion/relegation colouring is unexplained. */}
      <header className="border-b-2 border-stone-light bg-paper-raised px-6 py-6">
        <div className="mx-auto flex max-w-2xl flex-col items-center gap-1 text-center">
          <span className="text-4xl" aria-hidden="true">
            {league?.league_icon}
          </span>
          <h1 className="font-display text-xl font-extrabold text-ink">
            {league?.league_title ?? "Leaderboard"}
          </h1>
          <p className="text-sm text-ink-soft">
            Top 3 advance to the next league · bottom 2 drop down
          </p>
          <p className="mt-1 font-display text-xs font-bold text-ink-soft">
            Resets {daysUntilReset === 1 ? "in 1 day" : `in ${daysUntilReset} days`}
          </p>
        </div>
      </header>

      {/* List */}
      <div className="mx-auto flex w-full max-w-2xl flex-col gap-2 px-6 py-6">
        {entries.map((entry, index) => (
          <div key={entry.user_id}>
            {/* Divider marking where the promotion / relegation cut falls, so
                the bands read as boundaries rather than arbitrary colours. */}
            {zoneBoundary(entries, index) && (
              <div className="flex items-center gap-3 py-3">
                <span
                  className="h-0.5 flex-1 rounded"
                  style={{ background: zoneBoundary(entries, index)!.color }}
                />
                <span
                  className="font-display text-xs font-extrabold tracking-wide"
                  style={{ color: zoneBoundary(entries, index)!.color }}
                >
                  {zoneBoundary(entries, index)!.label}
                </span>
                <span
                  className="h-0.5 flex-1 rounded"
                  style={{ background: zoneBoundary(entries, index)!.color }}
                />
              </div>
            )}

            <div
              className={[
                "flex items-center gap-4 rounded-2xl px-5 py-4 transition",
                entry.is_current_user
                  ? "border-2 border-gold bg-gold-light shadow-md"
                  : "border-2 border-stone-light bg-paper-raised shadow-sm",
              ].join(" ")}
            >
              {/* Rank */}
              <div className="flex h-9 w-9 shrink-0 items-center justify-center">
                {entry.rank <= 3 ? (
                  <span
                    className="flex h-9 w-9 items-center justify-center rounded-full text-white shadow-sm"
                    style={{
                      background:
                        entry.rank === 1
                          ? "var(--gold)"
                          : entry.rank === 2
                            ? "var(--stone)"
                            : "#b87333",
                    }}
                  >
                    <CrownIcon size={18} />
                  </span>
                ) : (
                  <span className="font-display text-base font-bold text-ink-soft">
                    {entry.rank}
                  </span>
                )}
              </div>

              {/* Avatar initials — gives each row a face so the board reads as
                  people rather than a table of numbers. */}
              <span
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full font-display text-xs font-bold text-white"
                style={{ background: avatarColor(entry.name) }}
                aria-hidden="true"
              >
                {initials(entry.name)}
              </span>

              {/* Name */}
              <p
                className={[
                  "flex-1 text-sm",
                  entry.is_current_user
                    ? "font-display font-bold text-ink"
                    : "font-medium text-ink",
                ].join(" ")}
              >
                {entry.name}
                {entry.is_current_user && (
                  <span className="ml-1.5 text-xs text-ink-soft">(you)</span>
                )}
              </p>

              {/* Weekly XP is what the league ranks on, so it leads; lifetime
                  total sits underneath as context. */}
              <div className="text-right">
                <p className="font-display text-sm font-bold text-ink">
                  {entry.week_xp.toLocaleString()}{" "}
                  <span className="text-xs font-medium text-ink-soft">XP</span>
                </p>
                <p className="text-[11px] text-ink-soft">
                  {entry.xp_total.toLocaleString()} total
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </AppShell>
  );
}

/** Boundary marker to render *above* the row at `index`, or null. Derived from
 * where the zone changes, so it stays correct whatever the league's cutoffs
 * are — nothing here hardcodes "after rank 3". */
function zoneBoundary(
  entries: LeaderboardEntry[],
  index: number
): { label: string; color: string } | null {
  if (index === 0) return null;

  const previous = entries[index - 1].zone;
  const current = entries[index].zone;
  if (previous === current) return null;

  if (previous === "promotion") {
    return { label: "PROMOTION ZONE", color: "var(--green)" };
  }
  if (current === "relegation") {
    return { label: "RELEGATION ZONE", color: "var(--red)" };
  }
  return null;
}

function initials(name: string): string {
  return name
    .split(" ")
    .map((word) => word[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

/** Deterministic colour per name, so a given learner keeps the same avatar
 * colour across reloads without storing one. */
function avatarColor(name: string): string {
  const palette = [
    "var(--green)",
    "var(--blue)",
    "var(--purple)",
    "var(--gold-dark)",
    "var(--red)",
  ];
  const hash = [...name].reduce((sum, char) => sum + char.charCodeAt(0), 0);
  return palette[hash % palette.length];
}
