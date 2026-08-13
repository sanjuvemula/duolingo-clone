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

from sqlalchemy.orm import Session

from app.middleware.current_user import get_user_or_404
from app.schemas.schemas import UserResponse


def get_user(db: Session, user_id: int) -> UserResponse:
    user = get_user_or_404(db, user_id)
    return UserResponse.model_validate(user)