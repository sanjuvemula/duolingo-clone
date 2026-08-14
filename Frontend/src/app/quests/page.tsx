import { AppShell } from "@/components/layout/AppShell";
import { Mascot } from "@/components/mascot/Mascot";

/** Quests page — a placeholder, which the brief permits ("a simple Coming
 * Soon is sufficient") for social and challenge features.
 *
 * The quests below are inert copy rather than live progress bars on purpose.
 * Every other number in this app is real and server-owned, and a bar that
 * animated to a made-up percentage would be the one place the UI lies about
 * state. Showing the shape of the feature and labelling it SOON is the honest
 * version. A real implementation would need a quests table, per-quest progress
 * rows, and a daily reset — the same lazy-rollover trick the daily goal
 * already uses.
 *
 * Server component: nothing here is interactive, so the page ships no JS. */
export default function QuestsPage() {
  return (
    <AppShell>
      <header className="border-b-2 border-stone-light bg-paper-raised px-6 py-5">
        <div className="mx-auto max-w-2xl">
          <h1 className="font-display text-lg font-extrabold text-ink">Quests</h1>
        </div>
      </header>

      <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-8 px-6 py-10">
        <div className="flex flex-col items-center gap-3 text-center">
          <Mascot size={88} />
          <h2 className="font-display text-2xl font-extrabold text-ink">Coming soon</h2>
          <p className="max-w-sm text-sm text-ink-soft">
            Daily and weekly quests aren&apos;t wired up in this build. Your daily XP
            goal on the Learn tab is the part that&apos;s real — these are what would
            sit alongside it.
          </p>
        </div>

        <section aria-label="Planned quests" className="flex flex-col gap-3">
          {PLANNED_QUESTS.map((quest) => (
            <div
              key={quest.title}
              className="flex items-center gap-4 rounded-2xl border-2 border-stone-light px-5 py-4"
            >
              <span className="text-2xl" aria-hidden="true">
                {quest.icon}
              </span>
              <div className="flex-1">
                <p className="font-display text-sm font-bold text-ink">{quest.title}</p>
                <p className="text-xs text-ink-soft">{quest.description}</p>
              </div>
              <span
                className="rounded-full px-3 py-1 font-display text-xs font-bold"
                style={{ background: "var(--stone-light)", color: "var(--badge-ink)" }}
              >
                SOON
              </span>
            </div>
          ))}
        </section>
      </div>
    </AppShell>
  );
}

const PLANNED_QUESTS = [
  {
    icon: "⚡",
    title: "Earn 50 XP",
    description: "The daily goal, as a quest you can tick off.",
  },
  {
    icon: "🔥",
    title: "Extend your streak",
    description: "Finish a lesson before midnight.",
  },
  {
    icon: "🎯",
    title: "Score 100% in a lesson",
    description: "Complete a lesson without losing a single heart.",
  },
  {
    icon: "👑",
    title: "Earn 3 crowns this week",
    description: "A weekly quest that resets with the league.",
  },
];
