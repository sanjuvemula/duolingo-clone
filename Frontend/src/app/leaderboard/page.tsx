"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { CURRENT_USER_ID } from "@/lib/constants";
import { ApiError, getLeaderboard } from "@/services/api";
import type { LeaderboardEntry } from "@/types/api";
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
      <div className="flex flex-1 items-center justify-center">
        <p className="font-display text-ink-soft">Loading leaderboard…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6 text-center">
        <p className="font-display text-lg font-bold text-ink">
          Couldn&apos;t load leaderboard
        </p>
        <p className="max-w-sm text-sm text-ink-soft">{error}</p>
        <Link
          href="/"
          className="rounded-full bg-celadon px-5 py-2 font-display text-sm font-bold text-white shadow-sm transition hover:brightness-110"
        >
          Back to path
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col">
      {/* Header */}
      <header className="sticky top-0 z-10 border-b border-stone-light bg-paper/95 backdrop-blur">
        <div className="mx-auto flex max-w-md items-center justify-between px-6 py-4">
          <Link
            href="/"
            className="font-display text-sm font-bold text-ink-soft transition hover:text-ink"
          >
            ← Back
          </Link>
          <h1 className="font-display text-base font-bold text-ink">
            Leaderboard
          </h1>
          <div className="w-12" />
        </div>
      </header>

      {/* List */}
      <div className="mx-auto flex w-full max-w-md flex-col gap-2 px-6 py-6">
        {entries.map((entry) => (
          <div
            key={entry.user_id}
            className={[
              "flex items-center gap-4 rounded-2xl px-4 py-3 shadow-sm transition",
              entry.is_current_user
                ? "border-2 border-gold bg-gold-light"
                : "border border-stone-light bg-paper-raised",
            ].join(" ")}
          >
            {/* Rank */}
            <div className="flex h-8 w-8 shrink-0 items-center justify-center">
              {entry.rank <= 3 ? (
                <span
                  className="flex h-8 w-8 items-center justify-center rounded-full text-white shadow-sm"
                  style={{
                    background:
                      entry.rank === 1
                        ? "var(--gold)"
                        : entry.rank === 2
                          ? "var(--stone)"
                          : "#b87333",
                  }}
                >
                  <CrownIcon size={16} />
                </span>
              ) : (
                <span className="font-display text-sm font-bold text-ink-soft">
                  {entry.rank}
                </span>
              )}
            </div>

            {/* Name */}
            <p
              className={[
                "flex-1 text-sm font-medium",
                entry.is_current_user
                  ? "font-display font-bold text-ink"
                  : "text-ink",
              ].join(" ")}
            >
              {entry.name}
              {entry.is_current_user && (
                <span className="ml-1.5 text-xs text-ink-soft">(you)</span>
              )}
            </p>

            {/* XP */}
            <p className="font-display text-sm font-bold text-ink">
              {entry.xp_total.toLocaleString()}{" "}
              <span className="text-xs font-medium text-ink-soft">XP</span>
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
