from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.controllers import practice_controller
from app.database.connection import get_db
from app.middleware.current_user import get_current_user
from app.models.models import User
from app.schemas.schemas import (
    ExerciseSubmitRequest,
    PracticeSetResponse,
    PracticeSubmitResponse,
)

router = APIRouter(prefix="/practice", tags=["practice"])


@router.get("", response_model=PracticeSetResponse)
def get_practice_set(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """A shuffled set of exercises drawn from every skill the learner has
    unlocked, plus how long the round lasts."""
    return practice_controller.get_practice_set(db, current_user)


@router.post("/{exercise_id}/submit", response_model=PracticeSubmitResponse)
def submit_practice_answer(
    exercise_id: int,
    body: ExerciseSubmitRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Check a practice answer. Awards XP on success; never costs a heart."""
    return practice_controller.submit_practice_answer(
        db, exercise_id, current_user, body.answer
    )
