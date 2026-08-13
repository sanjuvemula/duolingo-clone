interface FeedbackBarProps {
  checked: boolean;
  correct: boolean | null;
  /** Only rendered when checked && !correct. */
  correctAnswerText: string | null;
  canCheck: boolean;
  submitting: boolean;
  onCheck: () => void;
  onContinue: () => void;
}

/** The persistent bottom bar of the lesson player. Before a submit it's a
 * single Check button (disabled until the current exercise has a
 * submittable answer — see lib/exercise.ts's isAnswerValid). After a
 * submit it switches to a colored feedback strip with a Continue button,
 * matching the classic Duolingo two-state bottom bar. */
export function FeedbackBar({
  checked,
  correct,
  correctAnswerText,
  canCheck,
  submitting,
  onCheck,
  onContinue,
}: FeedbackBarProps) {
  if (!checked) {
    return (
      <div className="sticky bottom-0 border-t border-stone-light bg-paper px-6 py-4">
        <div className="mx-auto max-w-md">
          <button
            type="button"
            disabled={!canCheck}
            onClick={onCheck}
            className={[
              "w-full rounded-2xl py-3 font-display text-sm font-bold uppercase tracking-wide transition active:scale-[0.99]",
              canCheck
                ? "bg-celadon text-white hover:brightness-110"
                : "cursor-not-allowed bg-stone-light text-stone",
            ].join(" ")}
          >
            {submitting ? "Checking…" : "Check"}
          </button>
        </div>
      </div>
    );
  }

  const isCorrect = correct === true;

  return (
    <div
      className="sticky bottom-0 border-t px-6 py-4"
      style={{
        background: isCorrect ? "var(--celadon-light)" : "#fbe4df",
        borderColor: isCorrect ? "var(--celadon)" : "var(--cinnabar)",
        animation: "slide-up 0.25s ease-out",
      }}
    >
      <div className="mx-auto flex max-w-md items-center justify-between gap-4">
        <div>
          <p
            className="font-display text-sm font-bold"
            style={{ color: isCorrect ? "var(--celadon)" : "var(--cinnabar)" }}
          >
            {isCorrect ? "Nice!" : "Not quite"}
          </p>
          {!isCorrect && correctAnswerText && (
            <p className="text-xs text-ink-soft">Correct answer: {correctAnswerText}</p>
          )}
        </div>

        <button
          type="button"
          onClick={onContinue}
          disabled={submitting}
          className="shrink-0 rounded-2xl px-6 py-3 font-display text-sm font-bold uppercase tracking-wide text-white shadow-sm transition hover:brightness-110 active:scale-[0.99] disabled:cursor-not-allowed"
          style={{ background: isCorrect ? "var(--celadon)" : "var(--cinnabar)" }}
        >
          {submitting ? "…" : "Continue"}
        </button>
      </div>
    </div>
  );
}