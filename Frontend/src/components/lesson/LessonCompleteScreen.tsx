import Link from "next/link";
import type { LessonCompleteResponse } from "@/types/api";
import { CrownIcon } from "@/components/learning-path/icons";

interface LessonCompleteScreenProps {
  result: LessonCompleteResponse;
  /** XP earned during this lesson run specifically (see useLessonPlayer's
   * sessionXp) — result.xp_total is the account's lifetime total, which
   * isn't the number a "you just earned" screen should headline. */
  sessionXp: number;
}

export function LessonCompleteScreen({ result, sessionXp }: LessonCompleteScreenProps) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-6 px-6 text-center">
      <div
        className="flex h-20 w-20 items-center justify-center rounded-full text-white shadow-md"
        style={{ background: "var(--gold)" }}
      >
        <CrownIcon size={40} />
      </div>

      <div>
        <h1 className="font-display text-2xl font-bold text-ink">Lesson complete!</h1>
        <p className="mt-1 text-sm text-ink-soft">
          {result.skill_status === "completed"
            ? "Skill completed — nice work."
            : `${result.crowns} crown${result.crowns === 1 ? "" : "s"} on this skill so far.`}
        </p>
      </div>

      <div className="flex gap-8">
        <Stat label="XP earned" value={`+${sessionXp}`} />
        <Stat label="Hearts left" value={String(result.hearts)} />
      </div>

      {result.newly_unlocked_skill_id !== null && (
        <p className="rounded-2xl bg-gold-light px-4 py-2 font-display text-sm font-bold text-ink">
          New skill unlocked!
        </p>
      )}

      <Link
        href="/"
        className="rounded-full bg-celadon px-6 py-3 font-display text-sm font-bold text-white shadow-sm transition hover:brightness-110"
      >
        Continue
      </Link>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="font-display text-xl font-bold text-ink">{value}</p>
      <p className="text-xs text-ink-soft">{label}</p>
    </div>
  );
}