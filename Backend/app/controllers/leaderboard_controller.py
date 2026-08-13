"""
Leaderboard controller — builds the response for GET /leaderboard.

Thin wrapper: calls leaderboard_service.get_leaderboard and maps each dict
to a LeaderboardEntry schema. No business logic beyond the service call.
"""

from sqlalchemy.orm import Session

from app.models.models import User
from app.schemas.schemas import LeaderboardEntry
from app.services import leaderboard_service


def get_leaderboard(db: Session, user: User) -> list[LeaderboardEntry]:
    rows = leaderboard_service.get_leaderboard(db, user.id)
    return [LeaderboardEntry(**row) for row in rows]
