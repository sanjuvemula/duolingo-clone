import { AppShell } from "@/components/layout/AppShell";
import { Mascot } from "@/components/mascot/Mascot";
import { ThemeToggle } from "@/components/layout/ThemeToggle";

/** Settings page.
 *
 * Appearance is real and works; everything below it is a placeholder, which
 * the brief explicitly allows ("a simple Coming Soon is sufficient"). The
 * inert rows show the shape a full settings page would take without
 * pretending to persist anything.
 *
 * Still a server component — the only interactive part is ThemeToggle, which
 * is a client component in its own right, so the page itself ships no JS. */
export default function SettingsPage() {
  return (
    <AppShell>
      <header className="border-b-2 border-stone-light bg-paper-raised px-6 py-5">
        <div className="mx-auto max-w-2xl">
          <h1 className="font-display text-lg font-extrabold text-ink">Settings</h1>
        </div>
      </header>

      <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-8 px-6 py-10">
        <div className="flex flex-col items-center gap-3 text-center">
          <Mascot size={88} />
          <h2 className="font-display text-2xl font-extrabold text-ink">Coming soon</h2>
          <p className="max-w-sm text-sm text-ink-soft">
            Account and preference settings aren&apos;t wired up in this build. The
            sections below show what would live here.
          </p>
        </div>

        {/* Appearance — the one section that actually does something. */}
        <section aria-label="Appearance">
          <div className="mb-3 flex items-center gap-3">
            <span className="text-2xl" aria-hidden="true">
              🌙
            </span>
            <div>
              <p className="font-display text-sm font-bold text-ink">Appearance</p>
              <p className="text-xs text-ink-soft">
                Auto follows your device setting.
              </p>
            </div>
          </div>
          <ThemeToggle />
        </section>

        <div className="flex flex-col gap-3">
          {SETTINGS_SECTIONS.map((section) => (
            <div
              key={section.title}
              className="flex items-center gap-4 rounded-2xl border-2 border-stone-light px-5 py-4"
            >
              <span className="text-2xl" aria-hidden="true">
                {section.icon}
              </span>
              <div className="flex-1">
                <p className="font-display text-sm font-bold text-ink">{section.title}</p>
                <p className="text-xs text-ink-soft">{section.description}</p>
              </div>
              <span
                className="rounded-full px-3 py-1 font-display text-xs font-bold"
                style={{ background: "var(--stone-light)", color: "var(--stone)" }}
              >
                SOON
              </span>
            </div>
          ))}
        </div>
      </div>
    </AppShell>
  );
}

const SETTINGS_SECTIONS = [
  {
    icon: "👤",
    title: "Account",
    description: "Name, email and password — requires real authentication first.",
  },
  {
    icon: "🔔",
    title: "Notifications",
    description: "Daily reminders to keep your streak alive.",
  },
  {
    icon: "🔊",
    title: "Sound effects",
    description: "Exercise audio and feedback sounds.",
  },
  {
    icon: "🌍",
    title: "Courses",
    description: "Add a language — only Korean is seeded in this build.",
  },
];
