/**
 * Types mirroring Backend/app/schemas/schemas.py.
 *
 * Kept as a hand-written 1:1 mirror rather than generated from the OpenAPI
 * spec — the schema is small and locked for this project, so codegen would
 * be more ceremony than it saves. If the backend schema changes, this file
 * changes with it.
 *
 * Only the shapes step 9 (skill tree page) actually consumes are defined
 * here — types for the lesson player's endpoints (exercises, submission,
 * lesson completion) belong with that step instead.
 */

export type SkillStatus = "locked" | "available" | "completed";

export interface UserResponse {
  id: number;
  name: string;
  email: string;
  xp_total: number;
  hearts: number;
  streak: number;
  last_active_date: string | null;
  gems: number;
  /** Heart-economy rules come from the backend so the UI never hardcodes them. */
  max_hearts: number;
  /** Countdown to the next regenerated heart; null when hearts are full. */
  seconds_until_next_heart: number | null;
  heart_refill_gem_cost: number;
  /** XP earned today only — reads 0 once the stored tally belongs to an
   * earlier day, so the daily goal resets without a scheduled job. */
  xp_today: number;
  daily_xp_goal: number;
  /** Token name ("blue", "green", …) resolved to a CSS variable, so the
   * avatar follows the active theme. Backend allow-lists the values. */
  avatar_color: string;
}

/** Body for PATCH /users/{id} — matches schemas.UserUpdateRequest. Both fields
 * optional so the client sends only what changed; email is not editable. */
export interface UserUpdateRequest {
  name?: string;
  avatar_color?: string;
}

/** Matches schemas.HeartsRefillResponse — POST /users/{id}/hearts/refill. */
export interface HeartsRefillResponse {
  hearts: number;
  max_hearts: number;
  gems: number;
  gems_spent: number;
}

/** One node in the skill tree. Matches schemas.SkillWithProgress. */
export interface SkillWithProgress {
  id: number;
  title: string;
  order: number;
  unit_id: number;
  /** Illustration key ("greeting", "food", …), resolved to an inline SVG by
   * components/learning-path/SkillIcon. Unknown keys fall back to a star, so
   * this stays a plain string rather than a union the backend could outgrow. */
  icon: string;
  status: SkillStatus;
  crowns: number;
  /** Denominator for the crown progress ring — total lessons in this skill. */
  lesson_count: number;
  /** First lesson (by order) for this skill — resolved server-side from
   * the Skill→Lesson relationship. Null only if a skill has no lessons. */
  lesson_id: number | null;
}

/** Matches schemas.UnitWithSkills. */
export interface UnitWithSkills {
  id: number;
  title: string;
  order: number;
  course_id: number;
  skills: SkillWithProgress[];
}

/** Root of GET /courses/{id}/skill-tree. Matches schemas.CourseWithUnits. */
export interface CourseWithUnits {
  id: number;
  title: string;
  language: string;
  units: UnitWithSkills[];
}

// ---------------------------------------------------------------------------
// Lesson player (step 10) — mirrors the Exercise/Lesson section of
// Backend/app/schemas/schemas.py. Kept in the same hand-written-mirror style
// as the skill-tree types above.
// ---------------------------------------------------------------------------

/** The five types the seed creates and the player renders. The union stays
 * open with `| string` so a backend-added type doesn't become a frontend
 * compile error — components branch on the known five and render a fallback
 * message for anything else (see LessonPlayerScreen). */
export type ExerciseType =
  | "multiple_choice"
  | "word_bank"
  | "match"
  | "fill_blank"
  | "type_answer"
  | string;

/** Matches schemas.ExercisePublic. `correct_answer` is deliberately absent
 * from this type — the backend excludes it from this response so the
 * frontend can never read the answer out of the network tab; checking only
 * ever happens server-side via POST /exercises/{id}/submit. */
export interface ExercisePublic {
  id: number;
  lesson_id: number;
  type: ExerciseType;
  question: string;
  /** multiple_choice / fill_blank -> list of choice strings; word_bank ->
   * list of word tiles to tap in order; match -> list of [left, right] pairs
   * to be re-matched by the user; type_answer -> null (free-text input,
   * nothing to render as choices). */
  options: string[] | [string, string][] | null;
  order: number;
}

/** Matches schemas.LessonWithExercises — GET /lessons/{id}. Exercises
 * arrive pre-sorted by `order` (lessons_controller.get_lesson sorts them). */
export interface LessonWithExercises {
  id: number;
  title: string;
  order: number;
  skill_id: number;
  exercises: ExercisePublic[];
}

/** Matches schemas.ExerciseSubmitResponse — POST /exercises/{id}/submit. */
export interface ExerciseSubmitResponse {
  correct: boolean;
  /** Same shape rule as ExercisePublic.options: string for
   * multiple_choice/fill_blank/type_answer/word_bank, [string,string][] for
   * match. Only present
   * in this response (not ExercisePublic) since it's safe to reveal once
   * the user has already submitted an answer. */
  correct_answer: unknown;
  hearts_remaining: number;
  lesson_failed: boolean;
  lesson_complete: boolean;
  xp_earned: number;
}

/** Matches schemas.LessonCompleteResponse — POST /lessons/{id}/complete. */
export interface LessonCompleteResponse {
  lesson_id: number;
  skill_id: number;
  crowns: number;
  skill_status: SkillStatus;
  xp_total: number;
  hearts: number;
  streak: number;
  newly_unlocked_skill_id: number | null;
}

// ---------------------------------------------------------------------------
// Leaderboard — mirrors Backend/app/schemas/schemas.py LeaderboardEntry
// ---------------------------------------------------------------------------

/** Band a rank falls in if the week ended now. */
export type LeagueZone = "promotion" | "relegation" | "neutral";

/** One row of the weekly league leaderboard. Ranking is by `week_xp` — this
 * week only — with `xp_total` carried as supporting detail. */
export interface LeaderboardEntry {
  rank: number;
  user_id: number;
  name: string;
  xp_total: number;
  week_xp: number;
  is_current_user: boolean;
  league_code: string;
  league_title: string;
  league_icon: string;
  zone: LeagueZone;
}
// ---------------------------------------------------------------------------
// Achievements
// ---------------------------------------------------------------------------

/** One badge from GET /users/{id}/achievements. The endpoint returns the
 * whole catalog, earned or not, so the profile can render locked badges as
 * goals rather than hiding them. `earned_at` is null exactly when
 * `earned` is false. */
export interface AchievementResponse {
  code: string;
  title: string;
  description: string;
  /** A single emoji — the backend stores the glyph itself, so there's no
   * icon asset pipeline or name-to-component mapping to keep in sync. */
  icon: string;
  earned: boolean;
  earned_at: string | null;
}

// ---------------------------------------------------------------------------
// Practice (timed challenge)
// ---------------------------------------------------------------------------

/** GET /practice — a timed round's worth of exercises, drawn from every skill
 * the learner has unlocked. `duration_seconds` comes from the backend so the
 * clock length is defined in one place. */
export interface PracticeSetResponse {
  duration_seconds: number;
  exercises: ExercisePublic[];
}

/** POST /practice/{id}/submit. No hearts field: practice deliberately doesn't
 * cost hearts, so there is nothing to report. */
export interface PracticeSubmitResponse {
  correct: boolean;
  correct_answer: unknown;
  xp_earned: number;
  xp_total: number;
}
