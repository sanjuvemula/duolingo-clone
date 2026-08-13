interface TranslateExerciseProps {
  value: string;
  checked: boolean;
  correct: boolean | null;
  onChange: (value: string) => void;
}

/** Renders exercise.type === "translate". A plain text input — the backend
 * (exercise_service.check_answer) compares this against correct_answer
 * with .strip().lower(), so no client-side normalization is needed before
 * submitting; the raw typed value is sent as-is. */
export function TranslateExercise({ value, checked, correct, onChange }: TranslateExerciseProps) {
  const borderColor = !checked
    ? "var(--stone-light)"
    : correct
      ? "var(--celadon)"
      : "var(--cinnabar)";
  const background = !checked ? "var(--paper-raised)" : correct ? "var(--celadon-light)" : "#fbe4df";

  return (
    <input
      type="text"
      inputMode="text"
      autoComplete="off"
      autoCorrect="off"
      spellCheck={false}
      value={value}
      disabled={checked}
      onChange={(e) => onChange(e.target.value)}
      placeholder="Type your answer"
      className="w-full rounded-2xl border-2 px-4 py-3 font-sans text-sm font-medium text-ink shadow-sm outline-none transition disabled:cursor-default focus:border-indigo"
      style={{ borderColor, background }}
    />
  );
}