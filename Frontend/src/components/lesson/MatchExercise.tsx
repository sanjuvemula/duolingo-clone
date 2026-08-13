"use client";

import { useState } from "react";

interface MatchExerciseProps {
  /** [left, right] pairs as seeded, e.g. [["안녕하세요", "Hello"], ...]. */
  pairs: [string, string][];
  checked: boolean;
  correct: boolean | null;
  /** Fires once every pair has been matched, with the full set of
   * [left, right] pairs the user made — this becomes the submitted
   * `answer`. exercise_service.check_answer compares pairs as a *set*, so
   * the order the user made them in doesn't matter. */
  onComplete: (matched: [string, string][]) => void;
}

function shuffled<T>(items: T[]): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

/** Renders exercise.type === "match". Two columns (left terms, right
 * terms), each independently shuffled on mount so the correct pairing
 * isn't readable from position alone. Tap a left item, then a right item,
 * to pair them; once every pair is made, onComplete fires with the full
 * set. The parent remounts this component per-exercise via `key={exercise.id}`
 * (see LessonPlayerScreen), so internal match state naturally resets
 * between exercises without extra effect/cleanup code here. */
export function MatchExercise({ pairs, checked, correct, onComplete }: MatchExerciseProps) {
  const [leftItems] = useState(() => shuffled(pairs.map((p) => p[0])));
  const [rightItems] = useState(() => shuffled(pairs.map((p) => p[1])));
  const [selectedLeft, setSelectedLeft] = useState<string | null>(null);
  const [matched, setMatched] = useState<[string, string][]>([]);

  const matchedLeft = new Set(matched.map((m) => m[0]));
  const matchedRight = new Set(matched.map((m) => m[1]));

  function pickLeft(item: string) {
    if (checked || matchedLeft.has(item)) return;
    setSelectedLeft((current) => (current === item ? null : item));
  }

  function pickRight(item: string) {
    if (checked || matchedRight.has(item) || !selectedLeft) return;
    const next: [string, string][] = [...matched, [selectedLeft, item]];
    setMatched(next);
    setSelectedLeft(null);
    if (next.length === pairs.length) {
      onComplete(next);
    }
  }

  function tileStyle(isMatched: boolean, isSelected: boolean) {
    if (checked) {
      return correct
        ? { borderColor: "var(--green)", background: "var(--green-light)" }
        : { borderColor: "var(--red)", background: "#fbe4df" };
    }
    if (isMatched) {
      return { borderColor: "var(--green)", background: "var(--green-light)" };
    }
    if (isSelected) {
      return { borderColor: "var(--blue)", background: "var(--blue-light)" };
    }
    return { borderColor: "var(--stone-light)", background: "var(--paper-raised)" };
  }

  return (
    <div className="grid grid-cols-2 gap-3">
      <div className="flex flex-col gap-3">
        {leftItems.map((item) => (
          <button
            key={item}
            type="button"
            disabled={checked || matchedLeft.has(item)}
            onClick={() => pickLeft(item)}
            className="rounded-2xl border-2 px-3 py-3 text-center font-sans text-sm font-medium text-ink shadow-sm transition disabled:cursor-default"
            style={tileStyle(matchedLeft.has(item), selectedLeft === item)}
          >
            {item}
          </button>
        ))}
      </div>
      <div className="flex flex-col gap-3">
        {rightItems.map((item) => (
          <button
            key={item}
            type="button"
            disabled={checked || matchedRight.has(item)}
            onClick={() => pickRight(item)}
            className="rounded-2xl border-2 px-3 py-3 text-center font-sans text-sm font-medium text-ink shadow-sm transition disabled:cursor-default"
            style={tileStyle(matchedRight.has(item), false)}
          >
            {item}
          </button>
        ))}
      </div>
    </div>
  );
}