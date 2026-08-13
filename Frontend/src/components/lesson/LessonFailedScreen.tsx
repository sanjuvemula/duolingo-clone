import Link from "next/link";
import { HeartIcon } from "@/components/learning-path/icons";

interface LessonFailedScreenProps {
  /** "no-hearts": user had 0 hearts before a single exercise was shown.
   * "hearts-lost": a wrong answer during this lesson brought hearts to 0.
   * Same screen, slightly different copy — see useLessonPlayer's status. */
  reason: "no-hearts" | "hearts-lost";
}

export function LessonFailedScreen({ reason }: LessonFailedScreenProps) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-6 px-6 text-center">
      <div
        className="flex h-20 w-20 items-center justify-center rounded-full text-white shadow-md"
        style={{
          background: "var(--cinnabar)",
          animation: "celebrate-in 0.5s ease-out both",
        }}
      >
        <HeartIcon size={36} />
      </div>

      <div style={{ animation: "celebrate-in 0.5s 0.15s ease-out both" }}>
        <h1 className="font-display text-2xl font-bold text-ink">Out of hearts</h1>
        <p className="mt-1 max-w-xs text-sm text-ink-soft">
          {reason === "no-hearts"
            ? "You don't have any hearts left. Come back once they refill to keep learning."
            : "You ran out of hearts partway through this lesson. Come back once they refill and try again."}
        </p>
      </div>

      <Link
        href="/"
        className="rounded-full bg-indigo px-6 py-3 font-display text-sm font-bold text-white shadow-sm transition hover:brightness-110"
        style={{ animation: "celebrate-in 0.5s 0.3s ease-out both" }}
      >
        Back to path
      </Link>
    </div>
  );
}