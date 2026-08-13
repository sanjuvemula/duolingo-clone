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