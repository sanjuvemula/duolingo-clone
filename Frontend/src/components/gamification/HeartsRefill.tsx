"use client";

import { useEffect, useState } from "react";
import { ApiError, refillHearts } from "@/services/api";
import { GemIcon, HeartIcon } from "@/components/learning-path/icons";

interface HeartsRefillProps {
  userId: number;
  gems: number;
  /** Gem price of a full refill — comes from the backend, never hardcoded. */
  cost: number;
  /** Server's countdown at fetch time; ticked down locally from there. */
  secondsUntilNextHeart: number | null;
  onRefilled: () => void;
}

function formatCountdown(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

export function HeartsRefill({
  userId,
  gems,
  cost,
  secondsUntilNextHeart,
  onRefilled,
}: HeartsRefillProps) {
  const [remaining, setRemaining] = useState(secondsUntilNextHeart);
  const [refilling, setRefilling] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setRemaining(secondsUntilNextHeart);
  }, [secondsUntilNextHeart]);

  // The server sends a snapshot; this ticks it down so the countdown is live
  // without polling. When it hits zero a heart is due, so ask the parent to
  // refetch rather than guessing the new value client-side.
  useEffect(() => {
    if (remaining === null) return;

    if (remaining <= 0) {
      onRefilled();
      return;
    }

    const timer = setTimeout(() => {
      setRemaining((value) => (value === null ? null : value - 1));
    }, 1000);

    return () => clearTimeout(timer);
  }, [remaining, onRefilled]);

  const affordable = gems >= cost;

  function handleRefill() {
    setRefilling(true);
    setError(null);

    refillHearts(userId)
      .then(() => onRefilled())
      .catch((err: unknown) => {
        setError(
          err instanceof ApiError ? err.message : "Couldn't refill hearts."
        );
      })
      .finally(() => setRefilling(false));
  }

  return (
    <div className="flex flex-col items-center gap-3">
      <button
        type="button"
        onClick={handleRefill}
        disabled={!affordable || refilling}
        className="flex items-center gap-2 rounded-full bg-green px-6 py-3 font-display text-sm font-bold text-white shadow-sm transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
      >
        <HeartIcon size={18} />
        {refilling ? "Refilling…" : "Refill hearts"}
        <span className="flex items-center gap-1 opacity-90">
          <GemIcon size={16} />
          {cost}
        </span>
      </button>

      {!affordable && (
        <p className="text-xs text-ink-soft">
          You need {cost - gems} more gems for a refill.
        </p>
      )}

      {remaining !== null && remaining > 0 && (
        <p className="text-xs text-ink-soft" role="status">
          Next free heart in {formatCountdown(remaining)}
        </p>
      )}

      {error && (
        <p className="text-xs font-bold text-red" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
