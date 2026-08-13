from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.controllers import users_controller
from app.database.connection import get_db
from app.schemas.schemas import AchievementResponse, HeartsRefillResponse, UserResponse

router = APIRouter(prefix="/users", tags=["users"])


@router.get("/{user_id}", response_model=UserResponse)
def get_user(user_id: int, db: Session = Depends(get_db)):
    return users_controller.get_user(db, user_id)


@router.post("/{user_id}/hearts/refill", response_model=HeartsRefillResponse)
def refill_hearts(user_id: int, db: Session = Depends(get_db)):
    """Spend gems to restore hearts to full. 400 if already full or too few gems."""
    return users_controller.refill_hearts(db, user_id)


@router.get("/{user_id}/achievements", response_model=list[AchievementResponse])
def get_achievements(user_id: int, db: Session = Depends(get_db)):
    """The full badge catalog with this user's earned state merged in —
    locked badges included, so the profile can show them as goals."""
    return users_controller.get_achievements(db, user_id)