from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.controllers import lessons_controller
from app.database.connection import get_db
from app.middleware.current_user import get_current_user
from app.models.models import User
from app.schemas.schemas import LessonCompleteResponse, LessonWithExercises

router = APIRouter(prefix="/lessons", tags=["lessons"])


@router.get("/{lesson_id}", response_model=LessonWithExercises)
def get_lesson(lesson_id: int, db: Session = Depends(get_db)):
    return lessons_controller.get_lesson(db, lesson_id)


@router.post("/{lesson_id}/complete", response_model=LessonCompleteResponse)
def complete_lesson(
    lesson_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return lessons_controller.complete_lesson_endpoint(db, lesson_id, current_user)