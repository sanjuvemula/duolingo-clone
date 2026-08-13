"""
Exercises controller — POST /exercises/{id}/submit.

Delegates the actual answer-checking + XP/hearts bookkeeping to
exercise_service.submit_exercise_answer, which explicitly does NOT commit
(see that file's docstring) so it can be composed into a larger
transaction later if needed. Since this endpoint is the whole transaction
by itself right now, the commit happens here, once, after the service call.

Takes an already-resolved `user: User` rather than a raw `user_id` — the
route depends on app.middleware.current_user.get_current_user, which does
the lookup + 404 once, in one place. See that module's docstring for why.
"""

from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.models.models import Exercise, User
from app.schemas.schemas import ExerciseSubmitResponse
from app.services import exercise_service


def submit_answer(db: Session, exercise_id: int, user: User, answer) -> ExerciseSubmitResponse:
    exercise = db.query(Exercise).filter(Exercise.id == exercise_id).first()
    if exercise is None:
        raise HTTPException(status_code=404, detail=f"Exercise {exercise_id} not found")

    result = exercise_service.submit_exercise_answer(db, user, exercise, answer)
    db.commit()

    return ExerciseSubmitResponse(**result)