"""
User service — streak bookkeeping.

update_streak() is written now but deliberately NOT called from
progress_service.complete_lesson() yet. Streak is a P1 feature per the
build plan; wiring it in blurs the P0/P1 boundary while P0 is still being
stabilized. It's ready to be called from the lesson-completion flow (or a
login/session-start endpoint) once P0 is confirmed solid end-to-end.

Note on hearts: this file intentionally does NOT implement time-based
heart regeneration. The locked schema has exactly one timestamp field on
User — `last_active_date` — and update_streak() below needs that field to
mean "the calendar day the user was last active", for streak math to be
correct. A regen function would need to independently advance that same
field based on elapsed minutes to calculate hearts earned back, which
would corrupt the streak's notion of "last active day". Rather than add a
second timestamp not in the locked schema, hearts regen is left as a P2
feature only if a dedicated column gets added later. The P0 requirement
itself only calls for "lose on wrong answer, fail at 0" — regen was never
in scope.
"""

from datetime import datetime

from app.models.models import User


def update_streak(user: User) -> User:
    """Call once per day the user completes at least one lesson.
    - Same calendar day as last_active_date -> no change (already counted today).
    - Exactly one calendar day later -> streak continues, +1.
    - Any bigger gap -> streak resets to 1 (today counts as day one again).
    """
    today = datetime.utcnow().date()

    if user.last_active_date is None:
        user.streak = 1
    else:
        last_day = user.last_active_date.date()
        gap_days = (today - last_day).days

        if gap_days == 0:
            pass  # already active today, don't double count
        elif gap_days == 1:
            user.streak += 1
        else:
            user.streak = 1

    user.last_active_date = datetime.utcnow()
    return user
