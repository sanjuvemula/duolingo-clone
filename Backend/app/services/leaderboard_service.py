"""
Leaderboard service — ranked list of users by XP.

A single read query ordered by xp_total descending, with a 1-based rank
assigned in Python. No pagination for now — the seed has only 6 users, and
even a real course would cap at maybe a few hundred in a single league
(Duolingo's actual leaderboard is per-league, not global). If scale ever
mattered, this would become a window function in SQL.
"""

from sqlalchemy.orm import Session

from app.models.models import User


def get_leaderboard(db: Session, current_user_id: int) -> list[dict]:
    """Return all users ranked by xp_total descending."""
    users = db.query(User).order_by(User.xp_total.desc()).all()

    return [
        {
            "rank": index + 1,
            "user_id": user.id,
            "name": user.name,
            "xp_total": user.xp_total,
            "is_current_user": user.id == current_user_id,
        }
        for index, user in enumerate(users)
    ]
