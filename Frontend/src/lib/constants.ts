/**
 * There is no login flow yet (see Backend/app/middleware/current_user.py —
 * the API takes a `user_id` query param at face value). Rather than scatter
 * the hardcoded id "1" across every fetch call, it lives here once as the
 * single seam to swap out when real auth exists.
 */
export const CURRENT_USER_ID = 1;

/** Seed script only ever creates one course (id 1) — Korean. */
export const DEFAULT_COURSE_ID = 1;

/** Falls back to local dev if the env var isn't set (e.g. running the
 * frontend without a .env.local). Set NEXT_PUBLIC_API_URL to the deployed
 * backend URL (Render/Railway) in production. */
export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:8000";