"""
Lessons controller — the lesson player's GET, and the end-of-lesson POST.

get_lesson is a read (lesson + its exercises, via ExercisePublic so
correct_answer never leaves the server) — no service call needed, and no
acting user involved either, so it's untouched by the current-user change.

complete_lesson_endpoint delegates the actual state change to
progress_service.complete_lesson, which is where crowns/skill-status/
unlock logic lives. This controller's job is just: look up the lesson,
hand it plus the already-resolved user to the service, wrap the returned
dict as LessonCompleteResponse.

Takes an already-resolved `user: User` rather than a raw `user_id` — the
route depends on app.middleware.current_user.get_current_user, which does
the lookup + 404 once, in one place. See that module's docstring for why.
"""

from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.models.models import Lesson, User
from app.schemas.schemas import LessonCompleteResponse, LessonWithExercises
from app.services import progress_service


def get_lesson(db: Session, lesson_id: int) -> LessonWithExercises:
    lesson = db.query(Lesson).filter(Lesson.id == lesson_id).first()
    if lesson is None:
        raise HTTPException(status_code=404, detail=f"Lesson {lesson_id} not found")

    exercises_sorted = sorted(lesson.exercises, key=lambda e: e.order)

    return LessonWithExercises(
        id=lesson.id,
        title=lesson.title,
        order=lesson.order,
        skill_id=lesson.skill_id,
        exercises=exercises_sorted,
    )


def complete_lesson_endpoint(db: Session, lesson_id: int, user: User) -> LessonCompleteResponse:
    lesson = db.query(Lesson).filter(Lesson.id == lesson_id).first()
    if lesson is None:
        raise HTTPException(status_code=404, detail=f"Lesson {lesson_id} not found")

    result = progress_service.complete_lesson(db, user, lesson)
    return LessonCompleteResponse(**result)