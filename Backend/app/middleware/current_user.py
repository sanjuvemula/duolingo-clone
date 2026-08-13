"""
Current-user resolution — the one place "which user is this request
acting as" gets resolved, instead of every controller repeating
`db.query(User).filter(User.id == user_id).first()` plus its own 404
handling.

P0 status: there is no auth layer. The acting user is whatever `user_id`
query parameter the caller sends, taken at face value — anyone can act as
any user by changing the number in the URL. That's fine for a solo local
dev / eval-interview project with no real accounts, but it's the reason
this file exists as its own module instead of being folded into a
controller: it's a marked, single seam to swap out later rather than a
scattered pattern to hunt down across four files.

TODO(auth): when JWT/session auth is added, this is the seam to change —
and *only* this file needs to change:
    - Swap `user_id: int = Query(...)` for something like
      `token: str = Depends(oauth2_scheme)`.
    - Decode the token to get the authenticated user's id instead of
      trusting a caller-supplied number.
    - Look the user up the same way (still 404, or 401, if the id in the
      token doesn't resolve to a real row).
Every route already depends on `get_current_user` returning a `User`
object — none of them depend on *how* that `User` was resolved, so this
swap doesn't touch routes, controllers, or services.
"""

from fastapi import Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.database.connection import get_db
from app.models.models import User


def get_user_or_404(db: Session, user_id: int) -> User:
    """Shared lookup used both by the current-user dependency below and by
    users_controller's GET /users/{id} (a direct resource fetch by path
    param, not an "acting user" — see that controller's docstring — but
    there's no reason to duplicate the query + 404 logic for it)."""
    user = db.query(User).filter(User.id == user_id).first()
    if user is None:
        raise HTTPException(status_code=404, detail=f"User {user_id} not found")
    return user


def get_current_user(
    user_id: int = Query(
        ...,
        description=(
            "Acting user's id. TODO(auth): replace with the user id decoded "
            "from an authenticated session/JWT instead of a raw query param."
        ),
    ),
    db: Session = Depends(get_db),
) -> User:
    return get_user_or_404(db, user_id)