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
      <div className="sticky bottom-0 border-t-2 border-stone-light bg-paper px-6 py-5">
        <div className="mx-auto max-w-md">
          <button
            type="button"
            disabled={!canCheck}
            onClick={onCheck}
            className="btn btn-green w-full"
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
      className="sticky bottom-0 px-6 py-5"
      style={{
        background: isCorrect ? "var(--green-light)" : "var(--red-light)",
        animation: "slide-up 0.25s ease-out",
      }}
    >
      <div className="mx-auto flex max-w-md items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          {/* The round icon badge is what makes the bar read as Duolingo's
              rather than a generic alert strip. */}
          <span
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-2xl font-black"
            style={{
              background: "#fff",
              color: isCorrect ? "var(--green-dark)" : "var(--red-dark)",
            }}
            aria-hidden="true"
          >
            {isCorrect ? "✓" : "✕"}
          </span>

          <div>
            <p
              className="font-display text-lg font-extrabold"
              style={{ color: isCorrect ? "var(--green-dark)" : "var(--red-dark)" }}
            >
              {isCorrect ? "Nice!" : "Not quite"}
            </p>
            {!isCorrect && correctAnswerText && (
              <p
                className="text-sm font-medium"
                style={{ color: "var(--red-dark)" }}
              >
                Correct answer: {correctAnswerText}
              </p>
            )}
          </div>
        </div>

        <button
          type="button"
          onClick={onContinue}
          disabled={submitting}
          className={`btn shrink-0 ${isCorrect ? "btn-green" : "btn-red"}`}
        >
          {submitting ? "…" : "Continue"}
        </button>
      </div>
    </div>
  );
}