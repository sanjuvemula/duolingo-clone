"use client";

import { CURRENT_USER_ID, DEFAULT_COURSE_ID } from "@/lib/constants";
import { useSkillTree } from "@/hooks/useSkillTree";
import { AppShell } from "@/components/layout/AppShell";
import { TopBar } from "@/components/layout/TopBar";
import { RightRail } from "@/components/layout/RightRail";
import { SkillPath } from "@/components/learning-path/SkillPath";

export default function Home() {
  const { course, user, loading, error, refetch } = useSkillTree(
    DEFAULT_COURSE_ID,
    CURRENT_USER_ID
  );

  if (loading) {
    return (
      <AppShell>
        <div className="flex flex-1 items-center justify-center">
          <p className="font-display text-ink-soft">Loading your path…</p>
        </div>
      </AppShell>
    );
  }

  if (error || !course || !user) {
    return (
      <AppShell>
        <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6 text-center">
          <p className="font-display text-lg font-bold text-ink">
            Couldn&apos;t load your path
          </p>
          <p className="max-w-sm text-sm text-ink-soft">{error}</p>
          <button
            type="button"
            onClick={refetch}
            className="rounded-full bg-green px-5 py-2 font-display text-sm font-bold text-white shadow-sm transition hover:brightness-110"
          >
            Try again
          </button>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <TopBar user={user} courseTitle={course.title} />
      <div className="app-content">
        <div className="app-column">
          <SkillPath course={course} />
        </div>
        <RightRail user={user} />
      </div>
    </AppShell>
  );
}