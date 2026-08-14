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
from app.schemas.schemas import (
    AchievementResponse,
    HeartsRefillResponse,
    UserResponse,
    UserUpdateRequest,
)
from app.services import achievement_service, leaderboard_service, user_service


def _to_response(user: User) -> UserResponse:
    """UserResponse carries several fields that aren't columns — the
    heart-economy rules, the live regen countdown and the daily goal — so it's
    built explicitly here rather than straight off the ORM object via
    model_validate."""
    league = leaderboard_service.get_league(user.league)

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
        xp_today=user_service.xp_earned_today(user),
        daily_xp_goal=user_service.DAILY_XP_GOAL,
        avatar_color=user.avatar_color,
        created_at=user.created_at,
        top_3_finishes=user.top_3_finishes,
        # get_league falls back to bronze for an unrecognised code, so a bad
        # value in the column can't 500 the profile.
        league_code=league.code,
        league_title=league.title,
        league_icon=league.icon,
    )


def get_user(db: Session, user_id: int) -> UserResponse:
    user = get_user_or_404(db, user_id)

    # Regen is lazy — reading a user is what credits elapsed time as hearts.
    before = user.hearts
    user_service.apply_heart_regen(user)
    if user.hearts != before or db.is_modified(user):
        db.commit()

    return _to_response(user)


def update_user(db: Session, user_id: int, payload: UserUpdateRequest) -> UserResponse:
    """Apply a profile edit and return the learner's full refreshed state.

    Returns the same UserResponse shape as GET so the client can replace its
    cached user wholesale instead of merging a partial patch into it — the
    response carries derived fields (heart countdown, daily goal) that a patch
    body could not supply anyway.
    """
    user = get_user_or_404(db, user_id)

    try:
        user_service.update_profile(
            user,
            name=payload.name,
            avatar_color=payload.avatar_color,
        )
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))

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

def get_achievements(db: Session, user_id: int) -> list[AchievementResponse]:
    """Full badge catalog with earned state merged in.

    Evaluates before listing so a badge whose condition is already met shows
    as earned even if the user hasn't completed a lesson since the rule was
    added — without this, adding a new achievement would leave existing
    learners unable to earn it retroactively.
    """
    user = get_user_or_404(db, user_id)

    newly_earned = achievement_service.evaluate(db, user)
    if newly_earned:
        db.commit()

    return [AchievementResponse(**row) for row in achievement_service.list_for_user(db, user)]
