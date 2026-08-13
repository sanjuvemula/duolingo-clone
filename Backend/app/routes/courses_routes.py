from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.controllers import courses_controller
from app.database.connection import get_db
from app.middleware.current_user import get_current_user
from app.models.models import User
from app.schemas.schemas import CourseWithUnits

router = APIRouter(prefix="/courses", tags=["courses"])


@router.get("/{course_id}/skill-tree", response_model=CourseWithUnits)
def get_skill_tree(
    course_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return courses_controller.get_skill_tree(db, course_id, current_user)