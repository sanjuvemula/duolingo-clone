import { API_BASE_URL } from "@/lib/constants";
import type {
  AchievementResponse,
  CourseWithUnits,
  ExerciseSubmitResponse,
  HeartsRefillResponse,
  LeaderboardEntry,
  LessonCompleteResponse,
  LessonWithExercises,
  UserResponse,
} from "@/types/api";

/** Thrown for any non-2xx response so callers can distinguish "backend is
 * unreachable" (network error) from "backend answered with an error"
 * (e.g. 404 course not found) and show the right message either way. */
export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
    this.name = "ApiError";
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: { "Content-Type": "application/json", ...init?.headers },
  });

  if (!res.ok) {
    // FastAPI's default error body is {"detail": "..."} — surface that
    // instead of a bare status code where possible.
    const body = await res.json().catch(() => null);
    throw new ApiError(res.status, body?.detail ?? res.statusText);
  }

  return res.json() as Promise<T>;
}

export function getSkillTree(
  courseId: number,
  userId: number
): Promise<CourseWithUnits> {
  return request(`/courses/${courseId}/skill-tree?user_id=${userId}`);
}

export function getUser(userId: number): Promise<UserResponse> {
  return request(`/users/${userId}`);
}

/** POST /users/{id}/hearts/refill — spends gems to restore hearts to full.
 * Throws ApiError(400) if hearts are already full or gems are insufficient. */
export function refillHearts(userId: number): Promise<HeartsRefillResponse> {
  return request(`/users/${userId}/hearts/refill`, { method: "POST" });
}

// ---------------------------------------------------------------------------
// Lesson player (step 10)
// ---------------------------------------------------------------------------

export function getLesson(lessonId: number): Promise<LessonWithExercises> {
  return request(`/lessons/${lessonId}`);
}

/** POST /exercises/{id}/submit. `answer`'s shape depends on the exercise
 * type (see ExercisePublic) — the backend's ExerciseSubmitRequest just
 * takes `{ answer: Any }`, so there's nothing to validate client-side
 * beyond what exercise-type components already enforce before enabling
 * the Check button (see lib/exercise.ts's isAnswerValid). */
export function submitExerciseAnswer(
  exerciseId: number,
  userId: number,
  answer: unknown
): Promise<ExerciseSubmitResponse> {
  return request(`/exercises/${exerciseId}/submit?user_id=${userId}`, {
    method: "POST",
    body: JSON.stringify({ answer }),
  });
}

/** POST /lessons/{id}/complete. Called exactly once per lesson, after the
 * last exercise has been submitted — see useLessonPlayer's continueExercise. */
export function completeLesson(
  lessonId: number,
  userId: number
): Promise<LessonCompleteResponse> {
  return request(`/lessons/${lessonId}/complete?user_id=${userId}`, {
    method: "POST",
  });
}

// ---------------------------------------------------------------------------
// Leaderboard
// ---------------------------------------------------------------------------

export function getLeaderboard(
  userId: number
): Promise<LeaderboardEntry[]> {
  return request(`/leaderboard?user_id=${userId}`);
}

// ---------------------------------------------------------------------------
// Achievements
// ---------------------------------------------------------------------------

/** GET /users/{id}/achievements — full catalog with earned state merged in. */
export function getAchievements(
  userId: number
): Promise<AchievementResponse[]> {
  return request(`/users/${userId}/achievements`);
}
