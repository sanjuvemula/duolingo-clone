"""
Users controller — request handling for user-facing endpoints.

Controllers sit between routes and services: they pull the DB row(s) a
request needs, hand off to a service when there's business logic to run,
and shape the result into the response schema. This file's only endpoint
(get_user) has no business logic to delegate — it's a straight lookup —
so it talks to the ORM directly rather than going through a service.

Note: this is a *resource* fetch — "give me the user with this id", from
a path param — not the "acting user" concern that
app/middleware/current_user.py centralizes for the query-param user_id
used elsewhere (skill-tree, lesson-complete, exercise-submit). Different
concept, same underlying lookup+404, so it reuses get_user_or_404 rather
than duplicating the query.
"""

from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.middleware.current_user import get_user_or_404
from app.models.models import User
from app.schemas.schemas import HeartsRefillResponse, UserResponse
from app.services import user_service


def _to_response(user: User) -> UserResponse:
    """UserResponse carries three fields that aren't columns — the heart-economy
    rules and the live regen countdown — so it's built explicitly here rather
    than straight off the ORM object via model_validate."""
    return UserResponse(
        id=user.id,
        name=user.name,
        email=user.email,
        xp_total=user.xp_total,
        hearts=user.hearts,
        streak=user.streak,
        last_active_date=user.last_active_date,
        gems=user.gems,
        max_hearts=user_service.MAX_HEARTS,
        seconds_until_next_heart=user_service.seconds_until_next_heart(user),
        heart_refill_gem_cost=user_service.HEART_REFILL_GEM_COST,
    )


def get_user(db: Session, user_id: int) -> UserResponse:
    user = get_user_or_404(db, user_id)

    # Regen is lazy — reading a user is what credits elapsed time as hearts.
    before = user.hearts
    user_service.apply_heart_regen(user)
    if user.hearts != before or db.is_modified(user):
        db.commit()

    return _to_response(user)


def refill_hearts(db: Session, user_id: int) -> HeartsRefillResponse:
    user = get_user_or_404(db, user_id)

    try:
        user_service.refill_hearts_with_gems(user)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))

    db.commit()

    return HeartsRefillResponse(
        hearts=user.hearts,
        max_hearts=user_service.MAX_HEARTS,
        gems=user.gems,
        gems_spent=user_service.HEART_REFILL_GEM_COST,
    )