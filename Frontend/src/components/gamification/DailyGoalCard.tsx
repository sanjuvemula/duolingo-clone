import { BoltIcon } from "@/components/learning-path/icons";

interface DailyGoalCardProps {
  /** Today's XP tally and the goal, both from GET /users/{id} — the backend
   * owns the rule, the same way it owns the heart-economy constants. */
  xpToday: number;
  goal: number;
}

/** Daily XP goal progress. Fills as the learner earns XP and flips to a
 * completed state once the goal is met. */
export function DailyGoalCard({ xpToday, goal }: DailyGoalCardProps) {
  const capped = Math.min(xpToday, goal);
  const percent = goal > 0 ? Math.round((capped / goal) * 100) : 0;
  const met = xpToday >= goal;

  return (
    <section className="rail-card" aria-label="Daily goal">
      <div className="flex items-center justify-between">
        <h2 className="rail-card-title">Daily goal</h2>
        <span className="font-display text-sm font-bold text-ink-soft">
          {capped} / {goal} XP
        </span>
      </div>

      <div className="mt-3 flex items-center gap-3">
        <span
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full"
          style={{
            background: met ? "var(--gold)" : "var(--gold-light)",
            color: met ? "#fff" : "var(--gold-dark)",
          }}
        >
          <BoltIcon size={20} />
        </span>

        <div
          className="h-4 flex-1 overflow-hidden rounded-full"
          style={{ background: "var(--stone-light)" }}
          role="progressbar"
          aria-valuenow={capped}
          aria-valuemin={0}
          aria-valuemax={goal}
        >
          <div
            className="h-full rounded-full transition-[width] duration-500"
            style={{ width: `${percent}%`, background: "var(--gold)" }}
          />
        </div>
      </div>

      <p className="mt-3 text-xs text-ink-soft">
        {met
          ? "Goal complete — nice work today!"
          : `Earn ${goal - capped} more XP to hit today's goal.`}
      </p>
    </section>
  );
}
