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
}

/** One node in the skill tree. Matches schemas.SkillWithProgress. */
export interface SkillWithProgress {
  id: number;
  title: string;
  order: number;
  unit_id: number;
  status: SkillStatus;
  crowns: number;
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

/** Backend/seed/seed_data.py only ever creates these three, and
 * exercise_service.check_answer only special-cases these three (everything
 * else falls back to a plain equality check) — but the type stays a plain
 * `string` rather than a closed union so a backend-added type doesn't
 * become a frontend compile error. Components branch on the known three and
 * render a fallback message for anything else (see LessonPlayerScreen). */
export type ExerciseType = "multiple_choice" | "translate" | "match" | string;

/** Matches schemas.ExercisePublic. `correct_answer` is deliberately absent
 * from this type — the backend excludes it from this response so the
 * frontend can never read the answer out of the network tab; checking only
 * ever happens server-side via POST /exercises/{id}/submit. */
export interface ExercisePublic {
  id: number;
  lesson_id: number;
  type: ExerciseType;
  question: string;
  /** multiple_choice -> list of choice strings; match -> list of
   * [left, right] pairs to be re-matched by the user; translate -> null
   * (free-text input, nothing to render as choices). */
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
   * multiple_choice/translate, [string,string][] for match. Only present
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
  newly_unlocked_skill_id: number | null;
}