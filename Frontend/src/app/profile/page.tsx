"use client";

import { useEffect, useState } from "react";
import { CURRENT_USER_ID } from "@/lib/constants";
import { ApiError, getAchievements, getUser } from "@/services/api";
import type { AchievementResponse, UserResponse } from "@/types/api";
import { AppShell } from "@/components/layout/AppShell";
import { StatCard } from "@/components/gamification/StatCard";
import { AchievementsGrid } from "@/components/gamification/AchievementsGrid";
import {
  ProfileEditModal,
  avatarColorVar,
} from "@/components/gamification/ProfileEditModal";
import {
  BoltIcon,
  CrownIcon,
  FlameIcon,
} from "@/components/learning-path/icons";

export default function ProfilePage() {
  const [user, setUser] = useState<UserResponse | null>(null);
  const [achievements, setAchievements] = useState<AchievementResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    let cancelled = false;

    // Both requests are independent, so they go out together rather than
    // waterfalling — the page needs both before it can render anyway.
    Promise.all([getUser(CURRENT_USER_ID), getAchievements(CURRENT_USER_ID)])
      .then(([userData, achievementData]) => {
        if (!cancelled) {
          setUser(userData);
          setAchievements(achievementData);
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
        <div className="mx-auto flex max-w-2xl items-center justify-between">
          <h1 className="font-display text-lg font-bold text-ink">Profile</h1>
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="rounded-full border-2 border-stone-light px-4 py-1.5 font-display text-xs font-bold uppercase tracking-wide text-ink-soft transition hover:bg-stone-light hover:text-ink"
          >
            Edit profile
          </button>
        </div>
      </header>

      <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col items-center gap-8 px-6 py-10">
        {/* Avatar + name */}
        <div className="flex flex-col items-center gap-3">
          <div
            className="flex h-24 w-24 items-center justify-center rounded-full text-white shadow-lg"
            style={{ background: avatarColorVar(user.avatar_color) }}
          >
            <span className="font-display text-3xl font-bold">{initials}</span>
          </div>
          <div className="text-center">
            <h2 className="font-display text-2xl font-bold text-ink">
              {user.name}
            </h2>
            <p className="text-sm text-ink-soft">{user.email}</p>
            {user.created_at && (
              <p className="mt-1 text-sm text-ink-soft">
                Joined{" "}
                {new Date(user.created_at).toLocaleDateString(undefined, {
                  year: "numeric",
                  month: "long",
                })}
              </p>
            )}
          </div>
        </div>

        {/* Followers / following. Mocked — there is no social graph in this
            build, and the brief allows friends features to be placeholders.
            Shown as zeroes rather than invented numbers: a fake follower count
            would be the one figure on this page that isn't real. */}
        <div className="flex items-center gap-8">
          {[
            { label: "Followers", value: 0 },
            { label: "Following", value: 0 },
          ].map((item) => (
            <div key={item.label} className="text-center">
              <p className="font-display text-lg font-extrabold text-ink">
                {item.value}
              </p>
              <p className="text-xs text-ink-soft">{item.label}</p>
            </div>
          ))}
        </div>

        {/* Statistics — the four Duolingo shows. Streak and XP are earned,
            league comes from the weekly leaderboard the learner is actually
            ranked in, and top-3 finishes is seeded (see the README). */}
        <section className="w-full max-w-md">
          <h3 className="mb-3 font-display text-sm font-extrabold uppercase tracking-wide text-ink-soft">
            Statistics
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <StatCard
              icon={<FlameIcon size={28} />}
              label="Day streak"
              value={user.streak}
              color="var(--red)"
            />
            <StatCard
              icon={<BoltIcon size={28} />}
              label="Total XP"
              value={user.xp_total.toLocaleString()}
              color="var(--gold)"
            />
            <StatCard
              icon={<span className="text-2xl leading-none">{user.league_icon}</span>}
              label="Current league"
              value={user.league_title.replace(" League", "")}
              color="var(--gold)"
            />
            <StatCard
              icon={<CrownIcon size={28} />}
              label="Top 3 finishes"
              value={user.top_3_finishes}
              color="var(--gold)"
            />
          </div>
        </section>

        {/* Achievements — required by the brief's "learner profile page with
            stats (streak, total XP, achievements)". */}
        <AchievementsGrid achievements={achievements} />
      </div>

      {editing && (
        <ProfileEditModal
          user={user}
          onClose={() => setEditing(false)}
          onSaved={setUser}
        />
      )}
    </AppShell>
  );
}
