"use client";

import Link from "next/link";
import { useLessonPlayer } from "@/hooks/useLessonPlayer";
import { CURRENT_USER_ID } from "@/lib/constants";
import { formatCorrectAnswer, isAnswerValid } from "@/lib/exercise";
import { LessonHeader } from "./LessonHeader";
import { FeedbackBar } from "./FeedbackBar";
import { MultipleChoiceExercise } from "./MultipleChoiceExercise";
import { TranslateExercise } from "./TranslateExercise";
import { MatchExercise } from "./MatchExercise";
import { LessonCompleteScreen } from "./LessonCompleteScreen";
import { LessonFailedScreen } from "./LessonFailedScreen";

interface LessonPlayerScreenProps {
  lessonId: number;
}

const KNOWN_EXERCISE_TYPES = ["multiple_choice", "translate", "match"];

/** Orchestrates one full run through GET /lessons/{id} -> repeated
 * POST /exercises/{id}/submit -> POST /lessons/{id}/complete. All the
 * actual state lives in useLessonPlayer; this component is purely a
 * render of whatever `status` that hook is currently in. */
export function LessonPlayerScreen({ lessonId }: LessonPlayerScreenProps) {
  const player = useLessonPlayer(lessonId, CURRENT_USER_ID);

  if (player.status === "loading") {
    return (
      <CenteredMessage>
        <p className="font-display text-ink-soft">Loading lesson…</p>
      </CenteredMessage>
    );
  }

  if (player.status === "error") {
    return (
      <CenteredMessage>
        <p className="font-display text-lg font-bold text-ink">Couldn&apos;t load this lesson</p>
        <p className="max-w-sm text-sm text-ink-soft">{player.error}</p>
        <Link
          href="/"
          className="rounded-full bg-celadon px-5 py-2 font-display text-sm font-bold text-white shadow-sm transition hover:brightness-110"
        >
          Back to path
        </Link>
      </CenteredMessage>
    );
  }

  if (player.status === "no-hearts") {
    return <LessonFailedScreen reason="no-hearts" />;
  }

  if (player.status === "failed") {
    return <LessonFailedScreen reason="hearts-lost" />;
  }

  if (player.status === "complete") {
    // Guarded by the hook: status only ever becomes "complete" in the same
    // update that sets completeResult, so this is never actually null —
    // the check just satisfies TypeScript.
    if (!player.completeResult) return null;
    return <LessonCompleteScreen result={player.completeResult} sessionXp={player.sessionXp} />;
  }

  // status === "playing"
  const lesson = player.lesson;
  if (!lesson) return null;

  const exercise = lesson.exercises[player.currentIndex];
  const canCheck =
    !player.checked && !player.submitting && isAnswerValid(exercise, player.selectedAnswer);

  const correctAnswerForDisplay =
    player.checked && player.lastResult && !player.lastResult.correct
      ? formatCorrectAnswer(exercise, player.lastResult.correct_answer)
      : null;

  return (
    <div className="flex flex-1 flex-col">
      <LessonHeader
        current={player.currentIndex + 1}
        total={lesson.exercises.length}
        hearts={player.hearts}
      />

      <div className="mx-auto flex w-full max-w-md flex-1 flex-col gap-6 px-6 py-8">
        <h1 className="font-display text-xl font-bold text-ink">{exercise.question}</h1>

        {exercise.type === "multiple_choice" && Array.isArray(exercise.options) && (
          <MultipleChoiceExercise
            key={exercise.id}
            options={exercise.options as string[]}
            selected={player.selectedAnswer as string | null}
            checked={player.checked}
            correctAnswer={
              player.checked && player.lastResult
                ? (player.lastResult.correct_answer as string)
                : null
            }
            onSelect={player.selectAnswer}
          />
        )}

        {exercise.type === "translate" && (
          <TranslateExercise
            key={exercise.id}
            value={(player.selectedAnswer as string | null) ?? ""}
            checked={player.checked}
            correct={player.lastResult?.correct ?? null}
            onChange={player.selectAnswer}
          />
        )}

        {exercise.type === "match" && Array.isArray(exercise.options) && (
          <MatchExercise
            key={exercise.id}
            pairs={exercise.options as [string, string][]}
            checked={player.checked}
            correct={player.lastResult?.correct ?? null}
            onComplete={player.selectAnswer}
          />
        )}

        {!KNOWN_EXERCISE_TYPES.includes(exercise.type) && (
          <p className="text-sm text-ink-soft">
            Unsupported exercise type: {exercise.type}
          </p>
        )}
      </div>

      <FeedbackBar
        checked={player.checked}
        correct={player.lastResult?.correct ?? null}
        correctAnswerText={correctAnswerForDisplay}
        canCheck={canCheck}
        submitting={player.submitting}
        onCheck={player.checkAnswer}
        onContinue={player.continueExercise}
      />
    </div>
  );
}

function CenteredMessage({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6 text-center">
      {children}
    </div>
  );
}