"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  ApiError,
  completeLesson,
  getLesson,
  getUser,
  submitExerciseAnswer,
} from "@/services/api";
import type {
  ExerciseSubmitResponse,
  LessonCompleteResponse,
  LessonWithExercises,
} from "@/types/api";

type PlayerStatus =
  | "loading"
  | "error"
  | "no-hearts"
  | "playing"
  | "failed"
  | "complete";

interface PlayerState {
  status: PlayerStatus;
  error: string | null;
  lesson: LessonWithExercises | null;
  currentIndex: number;
  hearts: number;
  selectedAnswer: unknown;
  checked: boolean;
  lastResult: ExerciseSubmitResponse | null;
  sessionXp: number;
  completeResult: LessonCompleteResponse | null;
  submitting: boolean;
}

const initialState: PlayerState = {
  status: "loading",
  error: null,
  lesson: null,
  currentIndex: 0,
  hearts: 0,
  selectedAnswer: null,
  checked: false,
  lastResult: null,
  sessionXp: 0,
  completeResult: null,
  submitting: false,
};

function errorMessage(err: unknown): string {
  return err instanceof ApiError
    ? err.message
    : "Couldn't reach the server. Is the backend running?";
}

export function useLessonPlayer(lessonId: number, userId: number) {
  const [state, setState] = useState<PlayerState>(initialState);

  // Keeps the latest state available to event handlers without putting
  // side effects inside setState updater functions.
  const stateRef = useRef(state);

  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  useEffect(() => {
    let cancelled = false;

    setState(initialState);

    Promise.all([getLesson(lessonId), getUser(userId)])
      .then(([lesson, user]) => {
        if (cancelled) return;

        if (lesson.exercises.length === 0) {
          setState((current) => ({
            ...current,
            status: "error",
            error: "This lesson has no exercises yet.",
          }));
          return;
        }

        setState((current) => ({
          ...current,
          lesson,
          hearts: user.hearts,
          status: user.hearts <= 0 ? "no-hearts" : "playing",
        }));
      })
      .catch((err: unknown) => {
        if (cancelled) return;

        setState((current) => ({
          ...current,
          status: "error",
          error: errorMessage(err),
        }));
      });

    return () => {
      cancelled = true;
    };
  }, [lessonId, userId]);

  const selectAnswer = useCallback((answer: unknown) => {
    const current = stateRef.current;

    if (current.checked || current.status !== "playing") {
      return;
    }

    setState((previous) => ({
      ...previous,
      selectedAnswer: answer,
    }));
  }, []);

  const checkAnswer = useCallback(() => {
    const current = stateRef.current;

    if (
      current.status !== "playing" ||
      current.checked ||
      current.submitting ||
      !current.lesson
    ) {
      return;
    }

    const exercise = current.lesson.exercises[current.currentIndex];

    setState((previous) => ({
      ...previous,
      submitting: true,
    }));

    submitExerciseAnswer(exercise.id, userId, current.selectedAnswer)
      .then((result) => {
        setState((previous) => ({
          ...previous,
          submitting: false,
          checked: true,
          lastResult: result,
          hearts: result.hearts_remaining,
          sessionXp: previous.sessionXp + result.xp_earned,
        }));
      })
      .catch((err: unknown) => {
        setState((previous) => ({
          ...previous,
          submitting: false,
          status: "error",
          error: errorMessage(err),
        }));
      });
  }, [userId]);

  const continueExercise = useCallback(() => {
    const current = stateRef.current;

    if (
      current.status !== "playing" ||
      !current.checked ||
      !current.lastResult ||
      !current.lesson ||
      current.submitting
    ) {
      return;
    }

    if (current.lastResult.lesson_failed) {
      setState((previous) => ({
        ...previous,
        status: "failed",
      }));
      return;
    }

    const isLastExercise =
      current.currentIndex >= current.lesson.exercises.length - 1;

    if (!isLastExercise) {
      setState((previous) => ({
        ...previous,
        currentIndex: previous.currentIndex + 1,
        checked: false,
        lastResult: null,
        selectedAnswer: null,
      }));
      return;
    }

    setState((previous) => ({
      ...previous,
      submitting: true,
    }));

    completeLesson(current.lesson.id, userId)
      .then((completeResult) => {
        setState((previous) => ({
          ...previous,
          submitting: false,
          status: "complete",
          completeResult,
        }));
      })
      .catch((err: unknown) => {
        setState((previous) => ({
          ...previous,
          submitting: false,
          status: "error",
          error: errorMessage(err),
        }));
      });
  }, [userId]);

  return {
    ...state,
    selectAnswer,
    checkAnswer,
    continueExercise,
  };
}