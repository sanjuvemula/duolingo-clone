interface MultipleChoiceExerciseProps {
  options: string[];
  selected: string | null;
  checked: boolean;
  /** Only known once the exercise has been checked (backend never sends
   * the answer before then — see ExercisePublic vs ExerciseSubmitResponse
   * in types/api.ts). Null while unchecked. */
  correctAnswer: string | null;
  onSelect: (value: string) => void;
}

/** Renders exercise.type === "multiple_choice". Matches
 * exercise_service.check_answer's comparison rule (case/whitespace
 * insensitive) when deciding which option to highlight as "the" correct
 * one, so the highlighted option always matches what the backend actually
 * accepted. */
export function MultipleChoiceExercise({
  options,
  selected,
  checked,
  correctAnswer,
  onSelect,
}: MultipleChoiceExerciseProps) {
  return (
    <div className="flex flex-col gap-3" role="radiogroup">
      {options.map((option) => {
        const isSelected = selected === option;
        const isCorrectOption =
          checked &&
          correctAnswer !== null &&
          option.trim().toLowerCase() === correctAnswer.trim().toLowerCase();
        const isWrongSelected = checked && isSelected && !isCorrectOption;

        const borderColor = isCorrectOption
          ? "var(--green)"
          : isWrongSelected
            ? "var(--red)"
            : isSelected
              ? "var(--blue)"
              : "var(--stone-light)";
        const background = isCorrectOption
          ? "var(--green-light)"
          : isWrongSelected
            ? "#fbe4df"
            : isSelected
              ? "var(--blue-light)"
              : "var(--paper-raised)";

        return (
          <button
            key={option}
            type="button"
            role="radio"
            aria-checked={isSelected}
            disabled={checked}
            onClick={() => onSelect(option)}
            className="w-full rounded-2xl border-2 px-4 py-3 text-left font-sans text-sm font-medium text-ink shadow-sm transition disabled:cursor-default"
            style={{ borderColor, background }}
          >
            {option}
          </button>
        );
      })}
    </div>
  );
}