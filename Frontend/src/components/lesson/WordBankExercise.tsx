"use client";

import { useState } from "react";

interface WordBankExerciseProps {
  /** Word tiles offered for this exercise, in seed order. */
  tiles: string[];
  checked: boolean;
  correct: boolean | null;
  /** Fires on every tap with the sentence built so far, as an ordered list of
   * words. The backend joins and normalizes it — see check_answer's word_bank
   * branch — so word order matters but spacing does not. */
  onChange: (words: string[]) => void;
}

/** Renders exercise.type === "word_bank" — Duolingo's tap-the-words builder.
 *
 * Tiles are tracked by index rather than by value, because a sentence can
 * legitimately repeat a word (e.g. two "저는" tiles); keying on the string
 * alone would make both tiles disappear on a single tap. */
export function WordBankExercise({
  tiles,
  checked,
  correct,
  onChange,
}: WordBankExerciseProps) {
  const [selected, setSelected] = useState<number[]>([]);

  function update(next: number[]) {
    setSelected(next);
    onChange(next.map((index) => tiles[index]));
  }

  function pick(index: number) {
    if (checked || selected.includes(index)) return;
    update([...selected, index]);
  }

  function unpick(index: number) {
    if (checked) return;
    update(selected.filter((value) => value !== index));
  }

  const answerBorder = !checked
    ? "var(--stone-light)"
    : correct
      ? "var(--green)"
      : "var(--red)";

  return (
    <div className="flex flex-col gap-6">
      {/* Answer line — the sentence built so far. Underlined like Duolingo's,
          and always rendered at a fixed min height so the tile bank below
          doesn't jump as words are added and removed. */}
      <div
        className="flex min-h-16 flex-wrap content-start gap-2 border-b-2 pb-3"
        style={{ borderColor: answerBorder }}
        aria-label="Your answer"
      >
        {selected.length === 0 && (
          <span className="self-center text-sm text-ink-soft">
            Tap the words in order
          </span>
        )}

        {selected.map((index) => (
          <button
            key={`${index}-${tiles[index]}`}
            type="button"
            disabled={checked}
            onClick={() => unpick(index)}
            className="tile tile-raised disabled:cursor-default"
          >
            {tiles[index]}
          </button>
        ))}
      </div>

      {/* Tile bank. Used tiles stay in place as dimmed ghosts rather than being
          removed, so the bank keeps a stable layout while answering. */}
      <div className="flex flex-wrap gap-2" aria-label="Word bank">
        {tiles.map((word, index) => {
          const used = selected.includes(index);

          return (
            <button
              key={`${index}-${word}`}
              type="button"
              disabled={checked || used}
              onClick={() => pick(index)}
              className={
                used
                  ? "tile tile-ghost cursor-default"
                  : "tile tile-raised disabled:cursor-default"
              }
              aria-hidden={used}
            >
              {word}
            </button>
          );
        })}
      </div>
    </div>
  );
}
