"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { SkillWithProgress } from "@/types/api";
import { ProgressRing } from "./ProgressRing";
import { CrownIcon, LockIcon, PlayIcon } from "./icons";

interface SkillNodeProps {
  skill: SkillWithProgress;
  /** Horizontal offset in px — alternates left/right to make the path
   * wind down the page instead of running in a straight line. */
  offsetX: number;
}

/** Renders one skill's lock/available/completed state and progress ring.
 *
 * Clicking an available or completed skill navigates to the lesson player
 * at /lesson/{lesson_id}, where lesson_id is the first lesson (by order)
 * for that skill — resolved server-side in the skill-tree response.
 * Locked nodes get a shake animation for click feedback. */
export function SkillNode({ skill, offsetX }: SkillNodeProps) {
  const [shaking, setShaking] = useState(false);
  const router = useRouter();

  const handleClick = () => {
    if (skill.status === "locked") {
      setShaking(true);
      setTimeout(() => setShaking(false), 400);
      return;
    }
    if (skill.lesson_id !== null) {
      router.push(`/lesson/${skill.lesson_id}`);
    }
  };

  const isLocked = skill.status === "locked";
  const isCompleted = skill.status === "completed";
  const isCurrent = skill.status === "available";

  const trackColor = isCompleted
    ? "var(--gold-light)"
    : isCurrent
      ? "var(--green-light)"
      : "var(--stone-light)";
  const ringColor = isCompleted
    ? "var(--gold)"
    : isCurrent
      ? "var(--green)"
      : "var(--stone)";

  // Real crown fraction: the tree response carries crowns earned and the
  // skill's lesson count, so a part-finished skill shows a part-filled ring
  // rather than the all-or-nothing placeholder this used to render.
  const progress =
    skill.lesson_count > 0
      ? Math.min(skill.crowns / skill.lesson_count, 1)
      : isCompleted
        ? 1
        : 0;

  const nodeClass = isLocked
    ? "node node-locked"
    : isCompleted
      ? "node node-complete"
      : "node node-available";

  return (
    <div
      className="relative flex flex-col items-center"
      style={{ transform: `translateX(${offsetX}px)` }}
    >
      {isCurrent && (
        <span className="absolute -top-10 rounded-xl border-2 border-stone-light bg-white px-3 py-1 font-display text-xs font-extrabold tracking-wide text-green shadow-sm animate-bounce">
          START
        </span>
      )}

      <div className={shaking ? "animate-[shake_0.4s]" : ""}>
        <ProgressRing
          size={88}
          strokeWidth={7}
          progress={progress}
          trackColor={trackColor}
          fillColor={ringColor}
        >
          <button
            type="button"
            onClick={handleClick}
            aria-label={
              isLocked
                ? `${skill.title} — locked`
                : `${skill.title} — ${skill.crowns} of ${skill.lesson_count} crowns`
            }
            className={`${nodeClass} outline-none focus-visible:ring-4 focus-visible:ring-blue/40`}
          >
            {isLocked ? (
              <LockIcon size={28} />
            ) : isCompleted ? (
              <CrownIcon size={30} />
            ) : (
              <PlayIcon size={28} />
            )}
          </button>
        </ProgressRing>
      </div>

      <span
        className={[
          "mt-2 max-w-[6.5rem] text-center font-display text-sm font-bold leading-tight",
          isLocked ? "text-stone" : "text-ink",
        ].join(" ")}
      >
        {skill.title}
      </span>
    </div>
  );
}