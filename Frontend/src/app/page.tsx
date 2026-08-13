"use client";

import { useEffect, useState } from "react";
import { CURRENT_USER_ID, DEFAULT_COURSE_ID } from "@/lib/constants";
import { useSkillTree } from "@/hooks/useSkillTree";
import { AppShell } from "@/components/layout/AppShell";
import { TopBar } from "@/components/layout/TopBar";
import { RightRail } from "@/components/layout/RightRail";
import { SkillPath } from "@/components/learning-path/SkillPath";
import { GuidedTour } from "@/components/tour/GuidedTour";

/** Marks that the tour has been shown once. Kept in localStorage rather than
 * on the user row because it's a client-side UI preference, not learner
 * progress — it shouldn't round-trip through the API or the database. */
const TOUR_SEEN_KEY = "duolingo-clone:tour-seen";

export default function Home() {
  const { course, user, loading, error, refetch } = useSkillTree(
    DEFAULT_COURSE_ID,
    CURRENT_USER_ID
  );
  const [tourOpen, setTourOpen] = useState(false);

  // Auto-open once for a first-time visitor. Waits for the data to land,
  // because the tour spotlights elements (path nodes, the rail) that don't
  // exist until the skill tree has rendered.
  useEffect(() => {
    if (loading || error || !course) return;
    if (localStorage.getItem(TOUR_SEEN_KEY)) return;

    const timer = window.setTimeout(() => setTourOpen(true), 600);
    return () => window.clearTimeout(timer);
  }, [loading, error, course]);

  function closeTour() {
    setTourOpen(false);
    localStorage.setItem(TOUR_SEEN_KEY, "1");
  }

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

      {/* Re-openable at any time — the auto-open only happens once, but a
          reviewer landing mid-session still needs a way in. */}
      <button
        type="button"
        onClick={() => setTourOpen(true)}
        className="fixed bottom-24 right-6 z-30 flex items-center gap-2 rounded-full border-2 border-stone-light bg-paper-raised px-4 py-3 font-display text-sm font-bold text-ink shadow-lg transition hover:brightness-95 md:bottom-6"
        aria-label="Open guided tour"
      >
        <span aria-hidden="true">💡</span>
        Guide
      </button>

      <GuidedTour open={tourOpen} onClose={closeTour} />
    </AppShell>
  );
}