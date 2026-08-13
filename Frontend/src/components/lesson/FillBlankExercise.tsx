interface FillBlankExerciseProps {
  /** The sentence prompt, containing "___" where the missing word goes. */
  question: string;
  options: string[];
  selected: string | null;
  checked: boolean;
  /** Only known once checked — the backend never sends the answer before
   * then (ExercisePublic omits correct_answer). Null while unchecked. */
  correctAnswer: string | null;
  onSelect: (value: string) => void;
}

const BLANK = "___";

/** Renders exercise.type === "fill_blank".
 *
 * Distinct from multiple_choice in that the sentence is shown with the chosen
 * word substituted into the gap, so the learner reads the completed sentence
 * rather than an isolated list of choices. */
export function FillBlankExercise({
  question,
  options,
  selected,
  checked,
  correctAnswer,
  onSelect,
}: FillBlankExerciseProps) {
  // Split rather than string-replace so the filled word can be styled as its
  // own element. A prompt without a blank still renders fine — it just yields
  // a single segment and no gap.
  const [before, after = ""] = question.split(BLANK);

  return (
    <div className="flex flex-col gap-6">
      <p className="font-display text-xl leading-relaxed font-bold text-ink">
        {before}
        <span
          className="mx-1 inline-flex min-w-24 justify-center border-b-3 px-2 pb-0.5 align-baseline"
          style={{
            borderColor: selected ? "var(--green)" : "var(--stone)",
            color: selected ? "var(--green)" : "transparent",
          }}
        >
          {selected ?? BLANK}
        </span>
        {after}
      </p>

      <div className="flex flex-wrap gap-2" role="radiogroup">
        {options.map((option) => {
          const isSelected = selected === option;
          const isCorrectOption =
            checked &&
            correctAnswer !== null &&
            option.trim().toLowerCase() === correctAnswer.trim().toLowerCase();
          const isWrongSelected = checked && isSelected && !isCorrectOption;

          return (
            <button
              key={option}
              type="button"
              role="radio"
              aria-checked={isSelected}
              disabled={checked}
              onClick={() => onSelect(option)}
              className="tile tile-raised disabled:cursor-default"
              style={
                isCorrectOption
                  ? { borderColor: "var(--green)", background: "var(--green-light)" }
                  : isWrongSelected
                    ? { borderColor: "var(--red)", background: "#fbe4df" }
                    : isSelected
                      ? { borderColor: "var(--green)", background: "var(--green-light)" }
                      : undefined
              }
            >
              {option}
            </button>
          );
        })}
      </div>
    </div>
  );
}
