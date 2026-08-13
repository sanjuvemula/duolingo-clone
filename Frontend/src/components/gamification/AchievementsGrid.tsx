import type { AchievementResponse } from "@/types/api";

interface AchievementsGridProps {
  achievements: AchievementResponse[];
}

/** Badge wall for the profile page.
 *
 * Renders locked badges too, greyed out, rather than hiding them — an unearned
 * badge is a goal, and hiding it would remove the reason to keep playing. This
 * is why the endpoint returns the whole catalog instead of only earned rows. */
export function AchievementsGrid({ achievements }: AchievementsGridProps) {
  const earnedCount = achievements.filter((a) => a.earned).length;

  return (
    <section className="w-full" aria-label="Achievements">
      <div className="mb-4 flex items-baseline justify-between">
        <h3 className="font-display text-lg font-extrabold text-ink">Achievements</h3>
        <span className="font-display text-sm font-bold text-ink-soft">
          {earnedCount} / {achievements.length}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {achievements.map((achievement) => (
          <AchievementBadge key={achievement.code} achievement={achievement} />
        ))}
      </div>
    </section>
  );
}

function AchievementBadge({ achievement }: { achievement: AchievementResponse }) {
  const { earned, icon, title, description } = achievement;

  return (
    <div
      className="flex flex-col items-center gap-2 rounded-2xl border-2 px-3 py-4 text-center transition"
      style={{
        borderColor: earned ? "var(--gold)" : "var(--stone-light)",
        background: earned ? "var(--gold-light)" : "var(--paper-sunken)",
      }}
      title={description}
    >
      <span
        className="flex h-14 w-14 items-center justify-center rounded-full text-3xl"
        style={{
          background: earned ? "var(--gold)" : "var(--stone-light)",
          // Locked badges keep their glyph but drain to grey, so the shape is
          // still a hint at what the badge is without giving it away as earned.
          filter: earned ? "none" : "grayscale(1) opacity(0.55)",
        }}
        aria-hidden="true"
      >
        {icon}
      </span>

      <p
        className="font-display text-sm leading-tight font-bold"
        style={{ color: earned ? "var(--ink)" : "var(--stone)" }}
      >
        {title}
      </p>
      <p className="text-xs leading-tight text-ink-soft">{description}</p>

      <span className="sr-only">{earned ? "Earned" : "Not yet earned"}</span>
    </div>
  );
}
