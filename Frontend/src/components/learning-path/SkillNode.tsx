"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { SkillWithProgress } from "@/types/api";
import { ProgressRing } from "./ProgressRing";
import { CrownIcon, LockIcon } from "./icons";
import { SkillIcon } from "./SkillIcon";

interface SkillNodeProps {
  skill: SkillWithProgress;
  /** Horizontal offset in px — alternates left/right to make the path
   * wind down the page instead of running in a straight line. */
  offsetX: number;
}

/** Renders one skill's lock/available/completed state and progress ring.
 *
 * Clicking an available or completed skill navigates to the lesson player
 * at /lesson/{lesson_id}, where lesson_id is the learner's next unfinished
 * lesson for that skill — resolved server-side in the skill-tree response.
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
        <span className="absolute -top-10 rounded-xl border-2 border-stone-light bg-paper-raised px-3 py-1 font-display text-xs font-extrabold tracking-wide text-green shadow-sm animate-bounce">
          START
        </span>
      )}

      {/* `relative` anchors the crown badge to the ring specifically. Without
          it the badge would position against the outer wrapper, which also
          contains the title, and land below the text. */}
      <div className={`relative ${shaking ? "animate-[shake_0.4s]" : ""}`}>
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
            {/* Every node shows its own illustration, including locked ones.
                That's what makes a Duolingo path scannable — you find "the
                food one" by its picture, not by reading sixteen labels. A
                padlock in place of the icon would collapse most of the tree
                into identical grey circles, so lock state is carried by the
                muted node colour plus the badge below instead. */}
            <SkillIcon name={skill.icon} size={32} />
          </button>
        </ProgressRing>

        {/* State badge pinned to the ring's lower edge: a gold crown when the
            skill is finished, a padlock while it isn't reachable. Decorative
            only — the button's aria-label already states both, so repeating
            it here would just be noise for a screen reader. */}
        {(isCompleted || isLocked) && (
          <span
            className="pointer-events-none absolute bottom-0 left-1/2 flex h-7 w-7 -translate-x-1/2 translate-y-1 items-center justify-center rounded-full border-2 border-paper-raised text-white shadow-sm"
            style={{ background: isCompleted ? "var(--gold)" : "var(--stone)" }}
            aria-hidden="true"
          >
            {isCompleted ? <CrownIcon size={16} /> : <LockIcon size={14} />}
          </span>
        )}
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