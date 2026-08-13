"use client";

import { useCallback, useEffect, useState } from "react";
import { ApiError, getSkillTree, getUser } from "@/services/api";
import type { CourseWithUnits, UserResponse } from "@/types/api";

interface SkillTreeState {
  course: CourseWithUnits | null;
  user: UserResponse | null;
  loading: boolean;
  error: string | null;
}

/** Fetches both the skill tree and the user's stats (hearts/xp/streak) for
 * the top bar in one hook, since the skill tree page needs both and they're
 * independent reads — Promise.all keeps them from waiting on each other.
 *
 * The fetch is inlined directly in the effect (rather than calling out to
 * a separately-defined async function) so every setState call happens
 * inside a .then()/.catch() callback — genuinely after the async work
 * resolves, never synchronously while the effect itself is running. A
 * `cancelled` flag guards against setting state after this run has been
 * superseded (component unmounted, or courseId/userId/reloadToken changed
 * before the request finished).
 *
 * `refetch` bumps `reloadToken` to make the effect re-run; its own
 * setState call happens in a click handler, not an effect, so it's exempt
 * from the same concern. */
export function useSkillTree(courseId: number, userId: number) {
  const [state, setState] = useState<SkillTreeState>({
    course: null,
    user: null,
    loading: true,
    error: null,
  });
  const [reloadToken, setReloadToken] = useState(0);

  useEffect(() => {
    let cancelled = false;

    Promise.all([getSkillTree(courseId, userId), getUser(userId)])
      .then(([course, user]) => {
        if (cancelled) return;
        setState({ course, user, loading: false, error: null });
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        const message =
          err instanceof ApiError
            ? err.message
            : "Couldn't reach the server. Is the backend running?";
        setState({ course: null, user: null, loading: false, error: message });
      });

    return () => {
      cancelled = true;
    };
  }, [courseId, userId, reloadToken]);

  const refetch = useCallback(() => {
    setState((s) => ({ ...s, loading: true, error: null }));
    setReloadToken((t) => t + 1);
  }, []);

  return { ...state, refetch };
}