interface TypeAnswerExerciseProps {
  value: string;
  checked: boolean;
  correct: boolean | null;
  onChange: (value: string) => void;
}

/** Renders exercise.type === "type_answer". A free-text input — the backend
 * (exercise_service.check_answer) normalizes case and whitespace before
 * comparing, so no client-side normalization is needed; the raw typed value
 * is sent as-is. */
export function TypeAnswerExercise({
  value,
  checked,
  correct,
  onChange,
}: TypeAnswerExerciseProps) {
  const borderColor = !checked
    ? "var(--stone-light)"
    : correct
      ? "var(--green)"
      : "var(--red)";
  const background = !checked
    ? "var(--paper-raised)"
    : correct
      ? "var(--green-light)"
      : "var(--red-light)";

  return (
    <input
      type="text"
      inputMode="text"
      autoComplete="off"
      autoCorrect="off"
      spellCheck={false}
      value={value}
      disabled={checked}
      onChange={(event) => onChange(event.target.value)}
      placeholder="Type your answer"
      className="w-full rounded-2xl border-2 px-4 py-4 font-sans text-base font-medium text-ink outline-none transition focus:border-green disabled:cursor-default"
      style={{ borderColor, background }}
    />
  );
}
