from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.controllers import users_controller
from app.database.connection import get_db
from app.schemas.schemas import (
    AchievementResponse,
    HeartsRefillResponse,
    UserResponse,
    UserUpdateRequest,
)

router = APIRouter(prefix="/users", tags=["users"])


@router.get("/{user_id}", response_model=UserResponse)
def get_user(user_id: int, db: Session = Depends(get_db)):
    return users_controller.get_user(db, user_id)


@router.patch("/{user_id}", response_model=UserResponse)
def update_user(
    user_id: int,
    payload: UserUpdateRequest,
    db: Session = Depends(get_db),
):
    """Edit the learner's display name and/or avatar colour.

    PATCH rather than PUT because the body is a partial: it carries only the
    fields being changed, and the rest of the user row (XP, hearts, streak) is
    not client-editable at all. 400 if the body is empty or the colour is not
    one of user_service.AVATAR_COLORS.
    """
    return users_controller.update_user(db, user_id, payload)


@router.post("/{user_id}/hearts/refill", response_model=HeartsRefillResponse)
def refill_hearts(user_id: int, db: Session = Depends(get_db)):
    """Spend gems to restore hearts to full. 400 if already full or too few gems."""
    return users_controller.refill_hearts(db, user_id)


@router.get("/{user_id}/achievements", response_model=list[AchievementResponse])
def get_achievements(user_id: int, db: Session = Depends(get_db)):
    """The full badge catalog with this user's earned state merged in —
    locked badges included, so the profile can show them as goals."""
    return users_controller.get_achievements(db, user_id)