from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.controllers import exercises_controller
from app.database.connection import get_db
from app.middleware.current_user import get_current_user
from app.models.models import User
from app.schemas.schemas import ExerciseSubmitRequest, ExerciseSubmitResponse

router = APIRouter(prefix="/exercises", tags=["exercises"])


@router.post("/{exercise_id}/submit", response_model=ExerciseSubmitResponse)
def submit_answer(
    exercise_id: int,
    body: ExerciseSubmitRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return exercises_controller.submit_answer(db, exercise_id, current_user, body.answer)