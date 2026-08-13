"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { CURRENT_USER_ID } from "@/lib/constants";
import { ApiError, getUser } from "@/services/api";
import type { UserResponse } from "@/types/api";
import { StatCard } from "@/components/gamification/StatCard";
import {
  FlameIcon,
  GemIcon,
  HeartIcon,
  CrownIcon,
} from "@/components/learning-path/icons";

export default function ProfilePage() {
  const [user, setUser] = useState<UserResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    getUser(CURRENT_USER_ID)
      .then((data) => {
        if (!cancelled) {
          setUser(data);
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
        <p className="font-display text-ink-soft">Loading profile…</p>
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6 text-center">
        <p className="font-display text-lg font-bold text-ink">
          Couldn&apos;t load profile
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

  // Initials for the avatar circle — first letter of each word in name.
  const initials = user.name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

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
            Profile
          </h1>
          <div className="w-12" /> {/* spacer for centering */}
        </div>
      </header>

      <div className="mx-auto flex w-full max-w-md flex-1 flex-col items-center gap-8 px-6 py-10">
        {/* Avatar + name */}
        <div className="flex flex-col items-center gap-3">
          <div
            className="flex h-20 w-20 items-center justify-center rounded-full text-white shadow-md"
            style={{ background: "var(--indigo)" }}
          >
            <span className="font-display text-2xl font-bold">{initials}</span>
          </div>
          <div className="text-center">
            <h2 className="font-display text-xl font-bold text-ink">
              {user.name}
            </h2>
            <p className="text-sm text-ink-soft">{user.email}</p>
          </div>
        </div>

        {/* Stats grid */}
        <div className="grid w-full grid-cols-2 gap-4">
          <StatCard
            icon={<CrownIcon size={28} />}
            label="Total XP"
            value={user.xp_total.toLocaleString()}
            color="var(--gold)"
          />
          <StatCard
            icon={<FlameIcon size={28} />}
            label="Day streak"
            value={user.streak}
            color="var(--cinnabar)"
          />
          <StatCard
            icon={<HeartIcon size={28} />}
            label="Hearts"
            value={user.hearts}
            color="var(--cinnabar)"
          />
          <StatCard
            icon={<GemIcon size={28} />}
            label="Gems"
            value={user.gems}
            color="var(--indigo)"
          />
        </div>

        {/* Last active */}
        {user.last_active_date && (
          <p className="text-xs text-ink-soft">
            Last active:{" "}
            {new Date(user.last_active_date).toLocaleDateString(undefined, {
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </p>
        )}

        {/* CTA */}
        <Link
          href="/"
          className="rounded-full bg-celadon px-6 py-3 font-display text-sm font-bold text-white shadow-sm transition hover:brightness-110"
        >
          Continue learning
        </Link>
      </div>
    </div>
  );
}
