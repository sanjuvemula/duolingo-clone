"use client";

import { useState } from "react";
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
 * Deliberately does not navigate anywhere on click yet: the skill-tree API
 * (GET /courses/{id}/skill-tree) returns status/crowns per skill, not
 * lesson ids — there's no lesson data on this schema to route to. Deciding
 * how the frontend resolves "which lesson does this skill open" is part of
 * wiring the lesson player (step 10/11), together with whatever the lesson
 * player actually needs from the API — not something to guess at here.
 * Locked nodes still get a shake for click feedback; unlocked nodes are
 * shown as selectable but are otherwise inert for now. */
export function SkillNode({ skill, offsetX }: SkillNodeProps) {
  const [shaking, setShaking] = useState(false);

  const handleClick = () => {
    if (skill.status === "locked") {
      setShaking(true);
      setTimeout(() => setShaking(false), 400);
    }
    // Unlocked nodes: no-op for now — see docstring above.
  };

  const isLocked = skill.status === "locked";
  const isCompleted = skill.status === "completed";
  const isCurrent = skill.status === "available";

  const fillColor = isCompleted
    ? "var(--celadon)"
    : isCurrent
      ? "var(--gold)"
      : "var(--stone)";
  const trackColor = isCompleted
    ? "var(--celadon-light)"
    : isCurrent
      ? "var(--gold-light)"
      : "var(--stone-light)";
  // Crown progress needs a lesson count, which isn't on this schema (see
  // docstring). Completed skills show a full ring; everyone else shows an
  // empty one — a real fraction can replace this once the lesson count is
  // available on the tree response.
  const progress = isCompleted ? 1 : 0;

  return (
    <div
      className="relative flex flex-col items-center"
      style={{ transform: `translateX(${offsetX}px)` }}
    >
      {isCurrent && (
        <span className="absolute -top-9 rounded-full bg-gold px-3 py-1 font-display text-xs font-bold text-white shadow-sm animate-bounce">
          START
        </span>
      )}

      <button
        type="button"
        onClick={handleClick}
        aria-label={
          isLocked
            ? `${skill.title} — locked`
            : `${skill.title} — ${skill.crowns} crowns`
        }
        className={[
          "group relative outline-none focus-visible:ring-4 focus-visible:ring-indigo/40 rounded-full transition-transform",
          isLocked ? "cursor-not-allowed" : "cursor-pointer hover:scale-105 active:scale-95",
          shaking ? "animate-[shake_0.4s]" : "",
        ].join(" ")}
      >
        <ProgressRing
          size={76}
          strokeWidth={6}
          progress={progress}
          trackColor={trackColor}
          fillColor={fillColor}
        >
          <div
            className="flex h-14 w-14 items-center justify-center rounded-full text-white shadow-md"
            style={{ background: fillColor }}
          >
            {isLocked ? (
              <LockIcon size={26} className="text-white/90" />
            ) : isCompleted ? (
              <CrownIcon size={28} />
            ) : (
              <PlayIcon size={26} />
            )}
          </div>
        </ProgressRing>
      </button>

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