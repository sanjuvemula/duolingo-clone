"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { HeartIcon } from "@/components/learning-path/icons";

interface LessonHeaderProps {
  /** 1-indexed position of the exercise currently on screen. */
  current: number;
  total: number;
  hearts: number;
}

export function LessonHeader({ current, total, hearts }: LessonHeaderProps) {
  const progress = total > 0 ? Math.min(1, current / total) : 0;
  const [pulsing, setPulsing] = useState(false);
  const prevHearts = useRef(hearts);

  useEffect(() => {
    if (hearts < prevHearts.current) {
      setPulsing(true);
      const timer = setTimeout(() => setPulsing(false), 500);
      prevHearts.current = hearts;
      return () => clearTimeout(timer);
    }
    prevHearts.current = hearts;
  }, [hearts]);

  return (
    <header className="sticky top-0 z-10 border-b border-stone-light bg-paper/95 px-6 py-4 backdrop-blur">
      <div className="mx-auto flex max-w-md items-center gap-4">
        <Link
          href="/"
          aria-label="Exit lesson"
          className="font-display text-lg text-ink-soft transition hover:text-ink"
        >
          ✕
        </Link>

        <div
          className="h-3 flex-1 overflow-hidden rounded-full bg-stone-light"
          role="progressbar"
          aria-valuenow={current}
          aria-valuemin={1}
          aria-valuemax={total}
        >
          <div
            className="h-full rounded-full bg-celadon transition-[width] duration-300 ease-out"
            style={{ width: `${progress * 100}%` }}
          />
        </div>

        <div
          className="flex items-center gap-1 font-display text-sm font-bold text-ink"
          role="status"
          aria-label={`${hearts} hearts remaining`}
          style={pulsing ? { animation: "heart-pulse 0.5s ease-out" } : undefined}
        >
          <span style={{ color: "var(--cinnabar)" }}>
            <HeartIcon size={20} />
          </span>
          {hearts}
        </div>
      </div>
    </header>
  );
}
