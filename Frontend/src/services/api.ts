import { API_BASE_URL } from "@/lib/constants";
import type { CourseWithUnits, UserResponse } from "@/types/api";

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