"use client";

import { useEffect, useState } from "react";
import { CURRENT_USER_ID } from "@/lib/constants";
import { ApiError, getUser } from "@/services/api";
import type { UserResponse } from "@/types/api";
import { AppShell } from "@/components/layout/AppShell";
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
      <AppShell>
        <div className="flex flex-1 items-center justify-center">
          <p className="font-display text-ink-soft">Loading profile…</p>
        </div>
      </AppShell>
    );
  }

  if (error || !user) {
    return (
      <AppShell>
        <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6 text-center">
          <p className="font-display text-lg font-bold text-ink">
            Couldn&apos;t load profile
          </p>
          <p className="max-w-sm text-sm text-ink-soft">{error}</p>
        </div>
      </AppShell>
    );
  }

  const initials = user.name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <AppShell>
      {/* Page header */}
      <header className="border-b-2 border-stone-light bg-paper-raised px-6 py-5">
        <div className="mx-auto max-w-2xl">
          <h1 className="font-display text-lg font-bold text-ink">Profile</h1>
        </div>
      </header>

      <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col items-center gap-8 px-6 py-10">
        {/* Avatar + name */}
        <div className="flex flex-col items-center gap-3">
          <div
            className="flex h-24 w-24 items-center justify-center rounded-full text-white shadow-lg"
            style={{ background: "var(--blue)" }}
          >
            <span className="font-display text-3xl font-bold">{initials}</span>
          </div>
          <div className="text-center">
            <h2 className="font-display text-2xl font-bold text-ink">
              {user.name}
            </h2>
            <p className="text-sm text-ink-soft">{user.email}</p>
          </div>
        </div>

        {/* Stats grid */}
        <div className="grid w-full max-w-md grid-cols-2 gap-4">
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
            color="var(--red)"
          />
          <StatCard
            icon={<HeartIcon size={28} />}
            label="Hearts"
            value={user.hearts}
            color="var(--red)"
          />
          <StatCard
            icon={<GemIcon size={28} />}
            label="Gems"
            value={user.gems}
            color="var(--blue)"
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
      </div>
    </AppShell>
  );
}
