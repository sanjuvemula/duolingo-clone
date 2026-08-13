import Link from "next/link";
import { HeartIcon } from "@/components/learning-path/icons";
import { HeartsRefill } from "@/components/gamification/HeartsRefill";
import type { UserResponse } from "@/types/api";

interface LessonFailedScreenProps {
  /** "no-hearts": user had 0 hearts before a single exercise was shown.
   * "hearts-lost": a wrong answer during this lesson brought hearts to 0.
   * Same screen, slightly different copy — see useLessonPlayer's status. */
  reason: "no-hearts" | "hearts-lost";
  /** Null only while the user fetch is still in flight; the refill offer is
   * hidden until it lands rather than rendered with placeholder numbers. */
  user: UserResponse | null;
  /** Re-runs the lesson load, dropping the learner back in with fresh hearts. */
  onRefilled: () => void;
}

export function LessonFailedScreen({
  reason,
  user,
  onRefilled,
}: LessonFailedScreenProps) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-6 px-6 text-center">
      <div
        className="flex h-20 w-20 items-center justify-center rounded-full text-white shadow-md"
        style={{
          background: "var(--red)",
          animation: "celebrate-in 0.5s ease-out both",
        }}
      >
        <HeartIcon size={36} />
      </div>

      <div style={{ animation: "celebrate-in 0.5s 0.15s ease-out both" }}>
        <h1 className="font-display text-2xl font-bold text-ink">Out of hearts</h1>
        <p className="mt-1 max-w-xs text-sm text-ink-soft">
          {reason === "no-hearts"
            ? "You don't have any hearts left. Wait for them to refill, or spend gems to keep learning now."
            : "You ran out of hearts partway through this lesson. Wait for them to refill, or spend gems to try again now."}
        </p>
      </div>

      <div style={{ animation: "celebrate-in 0.5s 0.3s ease-out both" }}>
        {user && (
          <HeartsRefill
            userId={user.id}
            gems={user.gems}
            cost={user.heart_refill_gem_cost}
            secondsUntilNextHeart={user.seconds_until_next_heart}
            onRefilled={onRefilled}
          />
        )}
      </div>

      <Link
        href="/"
        className="rounded-full border-2 border-stone-light px-6 py-3 font-display text-sm font-bold text-ink-soft transition hover:bg-paper"
        style={{ animation: "celebrate-in 0.5s 0.45s ease-out both" }}
      >
        Back to path
      </Link>
    </div>
  );
}