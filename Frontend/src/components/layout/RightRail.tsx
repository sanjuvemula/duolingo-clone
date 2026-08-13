import Link from "next/link";
import type { UserResponse } from "@/types/api";
import { DailyGoalCard } from "@/components/gamification/DailyGoalCard";
import { Mascot } from "@/components/mascot/Mascot";
import { FlameIcon } from "@/components/learning-path/icons";

interface RightRailProps {
  user: UserResponse;
}

/** The column beside the learning path. Duolingo fills this space with
 * progress widgets rather than leaving it empty, which is most of what stops
 * the page feeling like a bare list. Hidden below 1100px — the path itself
 * keeps priority on narrow screens. */
export function RightRail({ user }: RightRailProps) {
  return (
    <aside className="right-rail">
      <DailyGoalCard xpToday={user.xp_today} goal={user.daily_xp_goal} />

      <section className="rail-card" aria-label="Streak">
        <h2 className="rail-card-title">Your streak</h2>
        <div className="mt-3 flex items-center gap-3">
          <span
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full"
            style={{
              background: user.streak > 0 ? "var(--red)" : "var(--stone-light)",
              color: user.streak > 0 ? "#fff" : "var(--stone)",
            }}
          >
            <FlameIcon size={24} />
          </span>
          <div>
            <p className="font-display text-xl leading-none font-extrabold text-ink">
              {user.streak} {user.streak === 1 ? "day" : "days"}
            </p>
            <p className="mt-1 text-xs text-ink-soft">
              {user.streak > 0
                ? "Finish a lesson today to keep it."
                : "Finish a lesson to start your streak."}
            </p>
          </div>
        </div>
      </section>

      <section className="rail-card" aria-label="Timed practice">
        <h2 className="rail-card-title">Timed challenge</h2>
        <p className="mt-2 text-xs text-ink-soft">
          60 seconds of mixed review from everything you&apos;ve unlocked. Earns
          XP, costs no hearts.
        </p>
        <Link href="/practice" className="btn btn-green mt-3 w-full">
          Start practice
        </Link>
      </section>

      <section className="rail-card" aria-label="Leaderboard">
        <h2 className="rail-card-title">Leaderboard</h2>
        <p className="mt-2 text-xs text-ink-soft">
          You have {user.xp_total} XP. See how you rank against other learners.
        </p>
        <Link href="/leaderboard" className="btn btn-blue mt-3 w-full">
          View ranking
        </Link>
      </section>

      {/* Mascot anchors the rail visually and gives the page a character
          rather than only widgets. */}
      <section className="rail-card flex items-center gap-3" aria-label="Tip">
        <Mascot size={64} happy />
        <p className="text-xs text-ink-soft">
          Tip: a wrong answer costs a heart, but hearts come back over time —
          or spend gems to refill instantly.
        </p>
      </section>
    </aside>
  );
}
