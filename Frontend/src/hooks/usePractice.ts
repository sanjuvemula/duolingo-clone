"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ApiError, getPracticeSet, submitPracticeAnswer } from "@/services/api";
import type { ExercisePublic, PracticeSubmitResponse } from "@/types/api";

export type PracticeStatus = "loading" | "error" | "ready" | "playing" | "finished";

interface PracticeState {
  status: PracticeStatus;
  error: string | null;
  exercises: ExercisePublic[];
  currentIndex: number;
  answer: unknown;
  checked: boolean;
  submitting: boolean;
  lastResult: PracticeSubmitResponse | null;
  secondsLeft: number;
  duration: number;
  correctCount: number;
  answeredCount: number;
  xpEarned: number;
}

/**
 * State for the timed practice round.
 *
 * The clock is the whole mode, so it gets the careful part: `secondsLeft` is
 * derived from a stored end timestamp rather than decremented each tick.
 * A counter that subtracts 1 per interval drifts — intervals fire late, and
 * browsers throttle them hard in background tabs, so a backgrounded round
 * would end up with minutes left on a 60-second timer. Comparing against a
 * fixed deadline is immune to both.
 *
 * Unlike the lesson loop there is no failure state: running out of time ends
 * the round, it doesn't lose it. Wrong answers cost nothing but the seconds
 * spent on them.
 */
export function usePractice(userId: number) {
  const [state, setState] = useState<PracticeState>({
    status: "loading",
    error: null,
    exercises: [],
    currentIndex: 0,
    answer: null,
    checked: false,
    submitting: false,
    lastResult: null,
    secondsLeft: 0,
    duration: 0,
    correctCount: 0,
    answeredCount: 0,
    xpEarned: 0,
  });

  // Wall-clock deadline for the round; null whenever the clock isn't running.
  const deadlineRef = useRef<number | null>(null);

  const load = useCallback(() => {
    setState((s) => ({ ...s, status: "loading", error: null }));

    getPracticeSet(userId)
      .then((data) => {
        setState((s) => ({
          ...s,
          status: "ready",
          exercises: data.exercises,
          duration: data.duration_seconds,
          secondsLeft: data.duration_seconds,
          currentIndex: 0,
          answer: null,
          checked: false,
          lastResult: null,
          correctCount: 0,
          answeredCount: 0,
          xpEarned: 0,
        }));
      })
      .catch((err: unknown) => {
        setState((s) => ({
          ...s,
          status: "error",
          error:
            err instanceof ApiError
              ? err.message
              : "Couldn't reach the server. Is the backend running?",
        }));
      });
  }, [userId]);

  useEffect(load, [load]);

  const start = useCallback(() => {
    deadlineRef.current = Date.now() + state.duration * 1000;
    setState((s) => ({ ...s, status: "playing", secondsLeft: s.duration }));
  }, [state.duration]);

  // Tick against the deadline. Runs at 4Hz rather than 1Hz so the displayed
  // second changes close to when it actually should, instead of up to a full
  // second late.
  useEffect(() => {
    if (state.status !== "playing") return;

    const tick = () => {
      const deadline = deadlineRef.current;
      if (deadline === null) return;

      const remaining = Math.max(0, Math.ceil((deadline - Date.now()) / 1000));
      setState((s) =>
        s.secondsLeft === remaining
          ? s
          : {
              ...s,
              secondsLeft: remaining,
              status: remaining === 0 ? "finished" : s.status,
            }
      );
    };

    const id = window.setInterval(tick, 250);
    return () => window.clearInterval(id);
  }, [state.status]);

  const setAnswer = useCallback((answer: unknown) => {
    setState((s) => (s.checked ? s : { ...s, answer }));
  }, []);

  const check = useCallback(() => {
    setState((current) => {
      if (current.checked || current.submitting) return current;

      const exercise = current.exercises[current.currentIndex];
      if (!exercise) return current;

      submitPracticeAnswer(exercise.id, userId, current.answer)
        .then((result) => {
          setState((s) => ({
            ...s,
            checked: true,
            submitting: false,
            lastResult: result,
            correctCount: s.correctCount + (result.correct ? 1 : 0),
            answeredCount: s.answeredCount + 1,
            xpEarned: s.xpEarned + result.xp_earned,
          }));
        })
        .catch(() => {
          // A failed submit shouldn't strand the round — let the learner move
          // on rather than blocking on a network hiccup while the clock runs.
          setState((s) => ({ ...s, checked: true, submitting: false, lastResult: null }));
        });

      return { ...current, submitting: true };
    });
  }, [userId]);

  const next = useCallback(() => {
    setState((s) => {
      const nextIndex = s.currentIndex + 1;

      // Ran out of queued exercises before the clock ran out — end the round
      // rather than showing an empty screen.
      if (nextIndex >= s.exercises.length) {
        return { ...s, status: "finished" };
      }

      return {
        ...s,
        currentIndex: nextIndex,
        answer: null,
        checked: false,
        lastResult: null,
      };
    });
  }, []);

  const restart = useCallback(() => {
    deadlineRef.current = null;
    load();
  }, [load]);

  return { ...state, start, setAnswer, check, next, restart };
}
