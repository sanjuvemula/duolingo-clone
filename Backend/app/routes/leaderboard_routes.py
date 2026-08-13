from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.controllers import leaderboard_controller
from app.database.connection import get_db
from app.middleware.current_user import get_current_user
from app.models.models import User
from app.schemas.schemas import LeaderboardEntry

router = APIRouter(prefix="/leaderboard", tags=["leaderboard"])


@router.get("", response_model=list[LeaderboardEntry])
def get_leaderboard(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return leaderboard_controller.get_leaderboard(db, current_user)
