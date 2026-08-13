/**
 * Exercise-type-specific pure logic — kept out of the components so
 * "what counts as a submittable answer for this exercise type" and "how do
 * we display the correct answer after a wrong guess" live in one place
 * each, instead of being duplicated inside MultipleChoiceExercise /
 * TranslateExercise / MatchExercise.
 *
 * This deliberately mirrors (but does not duplicate) the shape rules from
 * Backend/app/services/exercise_service.py's check_answer: multiple_choice
 * and translate are plain strings, match is a list of [left, right] pairs.
 * The actual correctness check always happens server-side — this file only
 * decides when the Check button may be pressed and how to render an
 * already-known answer, never whether an answer is right.
 */

import type { ExercisePublic } from "@/types/api";

/** Whether `answer` is a complete, submittable response for this exercise
 * type. Used to enable/disable the Check button — not a correctness check. */
export function isAnswerValid(exercise: ExercisePublic, answer: unknown): boolean {
  switch (exercise.type) {
    case "multiple_choice":
      return typeof answer === "string" && answer.length > 0;

    case "translate":
      return typeof answer === "string" && answer.trim().length > 0;

    case "match": {
      // A match answer is only valid once every pair on screen has been
      // matched — MatchExercise only calls onComplete() once that's true,
      // so checking the length against the number of pairs offered is
      // enough here (no need to re-validate pair contents).
      const totalPairs = Array.isArray(exercise.options) ? exercise.options.length : 0;
      return Array.isArray(answer) && totalPairs > 0 && answer.length === totalPairs;
    }

    default:
      // Exercise type the frontend doesn't know how to render yet — see
      // the fallback message in LessonPlayerScreen. Nothing is ever
      // submittable for it.
      return false;
  }
}

/** Renders a known correct_answer (from ExerciseSubmitResponse, only
 * available after a submit) as a short human-readable string for the
 * feedback bar. */
export function formatCorrectAnswer(exercise: ExercisePublic, correctAnswer: unknown): string {
  if (exercise.type === "match" && Array.isArray(correctAnswer)) {
    return (correctAnswer as [string, string][])
      .map(([left, right]) => `${left} = ${right}`)
      .join(", ");
  }

  if (typeof correctAnswer === "string") {
    return correctAnswer;
  }

  // Shouldn't happen for the three P0 exercise types, but avoids rendering
  // "[object Object]" if an unexpected shape ever shows up.
  return JSON.stringify(correctAnswer);
}