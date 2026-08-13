import type { ExercisePublic } from "@/types/api";
import { MultipleChoiceExercise } from "./MultipleChoiceExercise";
import { WordBankExercise } from "./WordBankExercise";
import { FillBlankExercise } from "./FillBlankExercise";
import { TypeAnswerExercise } from "./TypeAnswerExercise";
import { MatchExercise } from "./MatchExercise";

export const KNOWN_EXERCISE_TYPES = [
  "multiple_choice",
  "word_bank",
  "match",
  "fill_blank",
  "type_answer",
];

interface ExerciseRendererProps {
  exercise: ExercisePublic;
  answer: unknown;
  checked: boolean;
  /** Whether the checked answer was right. Null until checked. */
  correct: boolean | null;
  /** The right answer, known only after checking. Null until then. */
  correctAnswer: unknown;
  onAnswer: (answer: unknown) => void;
}

/**
 * Renders whichever of the five exercise types this exercise is.
 *
 * Extracted so the lesson player and the timed practice round share one switch
 * instead of each maintaining their own copy — the two modes differ in their
 * rules (hearts, timers, scoring), not in how an exercise looks.
 *
 * `key={exercise.id}` matters on the stateful children: WordBankExercise and
 * MatchExercise hold their own selection state, and without a changing key
 * React would reuse the instance across exercises, carrying the previous
 * question's taps into the next one.
 */
export function ExerciseRenderer({
  exercise,
  answer,
  checked,
  correct,
  correctAnswer,
  onAnswer,
}: ExerciseRendererProps) {
  switch (exercise.type) {
    case "multiple_choice":
      return Array.isArray(exercise.options) ? (
        <MultipleChoiceExercise
          key={exercise.id}
          options={exercise.options as string[]}
          selected={(answer as string | null) ?? null}
          checked={checked}
          correctAnswer={checked ? (correctAnswer as string) : null}
          onSelect={onAnswer}
        />
      ) : null;

    case "word_bank":
      return Array.isArray(exercise.options) ? (
        <WordBankExercise
          key={exercise.id}
          tiles={exercise.options as string[]}
          checked={checked}
          correct={correct}
          onChange={onAnswer}
        />
      ) : null;

    case "fill_blank":
      return Array.isArray(exercise.options) ? (
        <FillBlankExercise
          key={exercise.id}
          question={exercise.question}
          options={exercise.options as string[]}
          selected={(answer as string | null) ?? null}
          checked={checked}
          correctAnswer={checked ? (correctAnswer as string) : null}
          onSelect={onAnswer}
        />
      ) : null;

    case "type_answer":
      return (
        <TypeAnswerExercise
          key={exercise.id}
          value={(answer as string | null) ?? ""}
          checked={checked}
          correct={correct}
          onChange={onAnswer}
        />
      );

    case "match":
      return Array.isArray(exercise.options) ? (
        <MatchExercise
          key={exercise.id}
          pairs={exercise.options as [string, string][]}
          checked={checked}
          correct={correct}
          onComplete={onAnswer}
        />
      ) : null;

    default:
      // A type the backend added that this build doesn't render yet.
      return (
        <p className="text-sm text-ink-soft">
          Unsupported exercise type: {exercise.type}
        </p>
      );
  }
}

/** Heading to show above an exercise. fill_blank renders the prompt itself,
 * with the chosen word slotted into the gap, so it gets an instruction line
 * instead of the raw question to avoid showing the sentence twice. */
export function exerciseHeading(exercise: ExercisePublic): string {
  return exercise.type === "fill_blank" ? "Fill in the blank" : exercise.question;
}
