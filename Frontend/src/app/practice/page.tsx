"use client";

import Link from "next/link";
import { usePractice } from "@/hooks/usePractice";
import { CURRENT_USER_ID } from "@/lib/constants";
import { isAnswerValid, formatCorrectAnswer } from "@/lib/exercise";
import { ExerciseRenderer, exerciseHeading } from "@/components/lesson/ExerciseRenderer";
import { FeedbackBar } from "@/components/lesson/FeedbackBar";
import { Mascot } from "@/components/mascot/Mascot";
import { BoltIcon } from "@/components/learning-path/icons";

/**
 * Timed practice — the "legendary challenge" bonus mode.
 *
 * Deliberately not wrapped in AppShell: like the lesson player, it is a focus
 * mode, and leaving the nav on screen invites the learner to wander off
 * mid-round. Exercises render through the same ExerciseRenderer the lesson
 * player uses, so the two modes can't drift apart visually.
 */
export default function PracticePage() {
  const practice = usePractice(CURRENT_USER_ID);

  if (practice.status === "loading") {
    return (
      <Centered>
        <p className="font-display text-ink-soft">Building your practice set…</p>
      </Centered>
    );
  }

  if (practice.status === "error") {
    return (
      <Centered>
        <p className="font-display text-lg font-bold text-ink">
          Couldn&apos;t start practice
        </p>
        <p className="max-w-sm text-sm text-ink-soft">{practice.error}</p>
        <Link href="/" className="btn btn-green">
          Back to path
        </Link>
      </Centered>
    );
  }

  if (practice.status === "ready") {
    return (
      <Centered>
        <Mascot size={110} />
        <h1 className="font-display text-3xl font-extrabold text-ink">
          Timed challenge
        </h1>
        <p className="max-w-sm text-sm leading-relaxed text-ink-soft">
          {practice.duration} seconds. Answer as many as you can from everything
          you&apos;ve unlocked so far. Wrong answers cost no hearts — the only
          pressure is the clock.
        </p>
        <div className="flex flex-col gap-3">
          <button type="button" onClick={practice.start} className="btn btn-green">
            Start challenge
          </button>
          <Link href="/" className="btn btn-ghost">
            Not now
          </Link>
        </div>
      </Centered>
    );
  }

  if (practice.status === "finished") {
    const accuracy =
      practice.answeredCount > 0
        ? Math.round((practice.correctCount / practice.answeredCount) * 100)
        : 0;

    return (
      <Centered>
        <div style={{ animation: "celebrate-in 0.5s ease-out both" }}>
          <Mascot size={110} happy />
        </div>
        <h1 className="font-display text-3xl font-extrabold text-ink">
          Time&apos;s up!
        </h1>

        <div className="flex gap-3">
          <Stat label="Correct" value={`${practice.correctCount}/${practice.answeredCount}`} color="var(--green)" />
          <Stat label="Accuracy" value={`${accuracy}%`} color="var(--blue)" />
          <Stat label="XP earned" value={`+${practice.xpEarned}`} color="var(--gold)" />
        </div>

        <div className="flex flex-col gap-3">
          <button type="button" onClick={practice.restart} className="btn btn-green">
            Practice again
          </button>
          <Link href="/" className="btn btn-ghost">
            Back to path
          </Link>
        </div>
      </Centered>
    );
  }

  // status === "playing"
  const exercise = practice.exercises[practice.currentIndex];
  if (!exercise) return null;

  const canCheck =
    !practice.checked && !practice.submitting && isAnswerValid(exercise, practice.answer);

  const correctAnswerText =
    practice.checked && practice.lastResult && !practice.lastResult.correct
      ? formatCorrectAnswer(exercise, practice.lastResult.correct_answer)
      : null;

  // Last 10 seconds turn the clock red and pulse it — the one moment the
  // timer needs to grab attention away from the exercise.
  const urgent = practice.secondsLeft <= 10;

  return (
    <div className="flex flex-1 flex-col">
      <header className="sticky top-0 z-10 border-b-2 border-stone-light bg-paper px-6 py-4">
        <div className="mx-auto flex w-full max-w-md items-center gap-4">
          <Link href="/" aria-label="Exit practice" className="text-2xl text-ink-soft">
            ✕
          </Link>

          {/* Time bar drains left-to-right alongside the numeric readout. */}
          <div className="h-4 flex-1 overflow-hidden rounded-full" style={{ background: "var(--stone-light)" }}>
            <div
              className="h-full rounded-full transition-[width] duration-300 ease-linear"
              style={{
                width: `${(practice.secondsLeft / practice.duration) * 100}%`,
                background: urgent ? "var(--red)" : "var(--green)",
              }}
            />
          </div>

          <span
            className="min-w-10 text-right font-display text-lg font-extrabold tabular-nums"
            style={{
              color: urgent ? "var(--red)" : "var(--ink)",
              animation: urgent ? "heart-pulse 1s ease-in-out infinite" : undefined,
            }}
            role="timer"
            aria-live="off"
          >
            {practice.secondsLeft}s
          </span>

          <span className="flex items-center gap-1 font-display text-sm font-bold" style={{ color: "var(--gold)" }}>
            <BoltIcon size={16} />
            {practice.xpEarned}
          </span>
        </div>
      </header>

      <div className="mx-auto flex w-full max-w-md flex-1 flex-col gap-6 px-6 py-8">
        <h1 className="font-display text-xl font-bold text-ink">
          {exerciseHeading(exercise)}
        </h1>

        <ExerciseRenderer
          exercise={exercise}
          answer={practice.answer}
          checked={practice.checked}
          correct={practice.lastResult?.correct ?? null}
          correctAnswer={practice.lastResult?.correct_answer ?? null}
          onAnswer={practice.setAnswer}
        />
      </div>

      <FeedbackBar
        checked={practice.checked}
        correct={practice.lastResult?.correct ?? null}
        correctAnswerText={correctAnswerText}
        canCheck={canCheck}
        submitting={practice.submitting}
        onCheck={practice.check}
        onContinue={practice.next}
      />
    </div>
  );
}

function Centered({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-5 px-6 text-center">
      {children}
    </div>
  );
}

function Stat({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="flex min-w-24 flex-col items-center gap-1 rounded-2xl border-2 border-stone-light px-4 py-3">
      <p className="font-display text-xl font-extrabold" style={{ color }}>
        {value}
      </p>
      <p className="text-xs text-ink-soft">{label}</p>
    </div>
  );
}
