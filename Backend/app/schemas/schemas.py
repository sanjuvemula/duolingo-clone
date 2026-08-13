"""
Pydantic schemas: the shapes of data crossing the API boundary.

Naming convention used throughout:
  <Entity>Base     -> fields shared by create/response variants
  <Entity>Create    -> what the client sends to create a row
  <Entity>Response  -> what the API sends back (includes id, ORM-loaded)
  <Entity>WithX      -> a Response nested with its children, for composite
                        endpoints like the skill tree or the lesson player

`model_config = ConfigDict(from_attributes=True)` (Pydantic v2) lets a schema
be built directly from a SQLAlchemy model instance, e.g.
`UserResponse.model_validate(user_orm_obj)`, instead of hand-copying every
field.
"""

from datetime import datetime
from typing import Any, Optional

from pydantic import BaseModel, ConfigDict, EmailStr


# ---------------------------------------------------------------------------
# User
# ---------------------------------------------------------------------------

class UserBase(BaseModel):
    name: str
    email: EmailStr


class UserCreate(UserBase):
    pass


class UserResponse(UserBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    xp_total: int
    hearts: int
    streak: int
    last_active_date: Optional[datetime] = None
    gems: int

    # Heart economy, sent so the frontend never has to hardcode the rules.
    # seconds_until_next_heart is None when hearts are already full.
    max_hearts: int
    seconds_until_next_heart: Optional[int] = None
    heart_refill_gem_cost: int


class HeartsRefillResponse(BaseModel):
    """Result of POST /users/{id}/hearts/refill."""
    hearts: int
    max_hearts: int
    gems: int
    gems_spent: int


# ---------------------------------------------------------------------------
# Exercise
# ---------------------------------------------------------------------------
# `options` and `correct_answer` are JSON columns because the shape depends
# on exercise type:
#   multiple_choice -> options: list[str],        correct_answer: str
#   translate        -> options: null,             correct_answer: str
#   match            -> options: list[[str,str]],  correct_answer: list[[str,str]]
# `Any` is intentional here rather than a stricter union, since Pydantic
# can't validate "shape depends on a sibling field's value" without a custom
# validator, and P0 doesn't need that strictness.

class ExercisePublic(BaseModel):
    """Sent to the client while a lesson is in progress.

    Deliberately excludes `correct_answer` — the frontend must not be able
    to read the answer out of the network tab. Checking happens server-side
    in the answer-submission endpoint.
    """
    model_config = ConfigDict(from_attributes=True)

    id: int
    lesson_id: int
    type: str
    question: str
    options: Optional[Any] = None
    order: int


class ExerciseCreate(BaseModel):
    lesson_id: int
    type: str
    question: str
    options: Optional[Any] = None
    correct_answer: Any
    order: int = 0


class ExerciseSubmitRequest(BaseModel):
    """Body for POST /exercises/{id}/submit."""
    answer: Any


class ExerciseSubmitResponse(BaseModel):
    correct: bool
    correct_answer: Any
    hearts_remaining: int
    lesson_failed: bool
    lesson_complete: bool
    xp_earned: int


# ---------------------------------------------------------------------------
# Lesson
# ---------------------------------------------------------------------------

class LessonResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    title: str
    order: int
    skill_id: int


class LessonWithExercises(LessonResponse):
    exercises: list[ExercisePublic] = []


class LessonCompleteResponse(BaseModel):
    lesson_id: int
    skill_id: int
    crowns: int
    skill_status: str
    xp_total: int
    hearts: int
    streak: int
    newly_unlocked_skill_id: Optional[int] = None


# ---------------------------------------------------------------------------
# UserProgress
# ---------------------------------------------------------------------------

class UserProgressResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    user_id: int
    skill_id: int
    status: str  # locked | available | completed
    crowns: int


# ---------------------------------------------------------------------------
# Skill
# ---------------------------------------------------------------------------

class SkillResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    title: str
    order: int
    unit_id: int


class SkillWithProgress(SkillResponse):
    """Skill tree node: status/crowns come from a UserProgress row, not the
    Skill table itself, so the service layer merges them in before this
    schema gets built — that's why they can't just use `from_attributes`
    straight off the Skill ORM object.

    lesson_id is the first lesson (by order) belonging to this skill —
    resolved from Skill.lessons in courses_controller.get_skill_tree so the
    frontend can navigate directly to /lesson/{id} on click."""
    status: str = "locked"
    crowns: int = 0
    lesson_id: Optional[int] = None


class SkillWithLessons(SkillResponse):
    lessons: list[LessonResponse] = []


# ---------------------------------------------------------------------------
# Unit
# ---------------------------------------------------------------------------

class UnitResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    title: str
    order: int
    course_id: int


class UnitWithSkills(UnitResponse):
    skills: list[SkillWithProgress] = []


# ---------------------------------------------------------------------------
# Course
# ---------------------------------------------------------------------------

class CourseResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    title: str
    language: str


class CourseWithUnits(CourseResponse):
    """Root of the skill-tree endpoint: GET /courses/{id}/skill-tree?user_id=..."""
    units: list[UnitWithSkills] = []


# ---------------------------------------------------------------------------
# Leaderboard
# ---------------------------------------------------------------------------

class LeaderboardEntry(BaseModel):
    """One row on the leaderboard. `is_current_user` lets the frontend
    highlight the logged-in learner's row without leaking the acting
    user id to the client."""
    rank: int
    user_id: int
    name: str
    xp_total: int
    is_current_user: bool