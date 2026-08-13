"use client";

import { useEffect, useState } from "react";
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

/** CSS-only confetti particles that drift outward from center on mount. */
const CONFETTI_PARTICLES = [
  { cx: "-60px", cy: "-80px", color: "var(--gold)", delay: "0s" },
  { cx: "70px", cy: "-70px", color: "var(--celadon)", delay: "0.1s" },
  { cx: "-80px", cy: "30px", color: "var(--cinnabar)", delay: "0.15s" },
  { cx: "60px", cy: "50px", color: "var(--indigo)", delay: "0.05s" },
  { cx: "-30px", cy: "-90px", color: "var(--celadon)", delay: "0.2s" },
  { cx: "90px", cy: "10px", color: "var(--gold)", delay: "0.08s" },
  { cx: "20px", cy: "80px", color: "var(--cinnabar)", delay: "0.12s" },
  { cx: "-70px", cy: "60px", color: "var(--indigo)", delay: "0.18s" },
];

export function LessonCompleteScreen({ result, sessionXp }: LessonCompleteScreenProps) {
  // Count-up animation for XP: starts at 0, counts up to sessionXp.
  const [displayXp, setDisplayXp] = useState(0);

  useEffect(() => {
    if (sessionXp <= 0) {
      setDisplayXp(sessionXp);
      return;
    }
    const duration = 800; // ms
    const steps = 20;
    const increment = sessionXp / steps;
    const interval = duration / steps;
    let current = 0;
    const timer = setInterval(() => {
      current += increment;
      if (current >= sessionXp) {
        setDisplayXp(sessionXp);
        clearInterval(timer);
      } else {
        setDisplayXp(Math.round(current));
      }
    }, interval);
    return () => clearInterval(timer);
  }, [sessionXp]);

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-6 px-6 text-center">
      {/* Confetti particles */}
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center overflow-hidden">
        {CONFETTI_PARTICLES.map((p, i) => (
          <span
            key={i}
            className="absolute h-2.5 w-2.5 rounded-full"
            style={{
              background: p.color,
              "--cx": p.cx,
              "--cy": p.cy,
              animation: `confetti-drift 0.9s ${p.delay} ease-out forwards`,
              opacity: 0,
            } as React.CSSProperties}
          />
        ))}
      </div>

      {/* Crown icon — entrance animation */}
      <div
        className="flex h-20 w-20 items-center justify-center rounded-full text-white shadow-md"
        style={{
          background: "var(--gold)",
          animation: "celebrate-in 0.5s ease-out both",
        }}
      >
        <CrownIcon size={40} />
      </div>

      {/* Title — staggered entrance */}
      <div
        style={{
          animation: "celebrate-in 0.5s 0.15s ease-out both",
        }}
      >
        <h1 className="font-display text-2xl font-bold text-ink">Lesson complete!</h1>
        <p className="mt-1 text-sm text-ink-soft">
          {result.skill_status === "completed"
            ? "Skill completed — nice work."
            : `${result.crowns} crown${result.crowns === 1 ? "" : "s"} on this skill so far.`}
        </p>
      </div>

      {/* Stats — staggered entrance, XP counts up */}
      <div
        className="flex gap-8"
        style={{
          animation: "celebrate-in 0.5s 0.3s ease-out both",
        }}
      >
        <Stat label="XP earned" value={`+${displayXp}`} />
        <Stat label="Hearts left" value={String(result.hearts)} />
      </div>

      {result.newly_unlocked_skill_id !== null && (
        <p
          className="rounded-2xl bg-gold-light px-4 py-2 font-display text-sm font-bold text-ink"
          style={{
            animation: "celebrate-in 0.5s 0.45s ease-out both",
          }}
        >
          New skill unlocked!
        </p>
      )}

      <Link
        href="/"
        className="rounded-full bg-celadon px-6 py-3 font-display text-sm font-bold text-white shadow-sm transition hover:brightness-110"
        style={{
          animation: "celebrate-in 0.5s 0.5s ease-out both",
        }}
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