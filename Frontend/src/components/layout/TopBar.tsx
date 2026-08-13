import type { UserResponse } from "@/types/api";
import {
  BoltIcon,
  FlameIcon,
  GemIcon,
  HeartIcon,
} from "@/components/learning-path/icons";

interface TopBarProps {
  user: UserResponse;
  courseTitle: string;
}

function Stat({
  icon,
  value,
  color,
  label,
}: {
  icon: React.ReactNode;
  value: number;
  color: string;
  label: string;
}) {
  return (
    <div
      className="flex items-center gap-1.5 rounded-full bg-paper px-3 py-1.5"
      role="status"
      aria-label={`${label}: ${value}`}
    >
      <span style={{ color }}>{icon}</span>
      <span className="font-display text-sm font-bold text-ink">{value}</span>
    </div>
  );
}

export function TopBar({ user, courseTitle }: TopBarProps) {
  return (
    <header className="sticky top-0 z-10 border-b-2 border-stone-light bg-paper-raised">
      <div className="mx-auto flex max-w-2xl items-center justify-between px-6 py-3">
        <div>
          <p className="font-display text-base font-bold text-ink">
            {courseTitle}
          </p>
          <p className="text-xs text-ink-soft">{user.name}</p>
        </div>
        <div className="flex items-center gap-2">
          <Stat
            icon={<FlameIcon size={20} />}
            value={user.streak}
            color="var(--cinnabar)"
            label="Day streak"
          />
          <Stat
            icon={<BoltIcon size={20} />}
            value={user.xp_total}
            color="var(--gold)"
            label="Total XP"
          />
          <Stat
            icon={<GemIcon size={20} />}
            value={user.gems}
            color="var(--indigo)"
            label="Gems"
          />
          <Stat
            icon={<HeartIcon size={20} />}
            value={user.hearts}
            color="var(--cinnabar)"
            label="Hearts"
          />
        </div>
      </div>
    </header>
  );
}