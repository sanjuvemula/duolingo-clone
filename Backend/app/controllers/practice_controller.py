"""
Practice controller — the timed challenge's two endpoints.

Mirrors lessons_controller in shape: resolve the row, hand off to the service
for anything with rules in it, wrap the result in a response schema.
"""

from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.models.models import Exercise, User
from app.schemas.schemas import (
    ExercisePublic,
    PracticeSetResponse,
    PracticeSubmitResponse,
)
from app.services import practice_service


def get_practice_set(db: Session, user: User) -> PracticeSetResponse:
    exercises = practice_service.build_practice_set(db, user)
    return PracticeSetResponse(
        duration_seconds=practice_service.PRACTICE_DURATION_SECONDS,
        exercises=[ExercisePublic.model_validate(e) for e in exercises],
    )


def submit_practice_answer(
    db: Session, exercise_id: int, user: User, answer
) -> PracticeSubmitResponse:
    exercise = db.query(Exercise).filter(Exercise.id == exercise_id).first()
    if exercise is None:
        raise HTTPException(status_code=404, detail=f"Exercise {exercise_id} not found")

    result = practice_service.submit_practice_answer(db, user, exercise, answer)
    db.commit()
    return PracticeSubmitResponse(**result)
