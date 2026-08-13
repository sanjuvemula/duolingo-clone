"""
User service — streak bookkeeping and heart economy.

update_streak() is called from progress_service.complete_lesson(), so a
learner's streak advances when they finish a lesson.

Hearts work the way they do in Duolingo: you lose one per wrong answer,
and you get them back either by waiting (regen) or by spending gems
(refill). Both paths live here.

Regen is applied *lazily* rather than by a background scheduler: nothing
runs on a timer, and instead any endpoint that reads a user calls
apply_heart_regen() first, which credits whatever hearts the elapsed wall
time has earned. The stored state is therefore always "hearts as of
hearts_updated_at", and the true current value is derived on read. This
keeps the app a single stateless process with no scheduler to deploy.
"""

from datetime import datetime, timedelta

from app.models.models import User

MAX_HEARTS = 5

# Real Duolingo regenerates roughly one heart every 4 hours. That is far too
# slow to observe during a demo or review session, so this is deliberately
# shortened — it's a demo-tuning constant, not a modelling claim.
HEART_REGEN_MINUTES = 10

# Mocked economy: gems are seeded, never earned, and spending them here is the
# only thing that consumes them.
HEART_REFILL_GEM_COST = 350


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


def apply_heart_regen(user: User) -> User:
    """Credit any hearts the elapsed time since hearts_updated_at has earned.

    Call before reading or spending hearts. Cheap and idempotent — calling it
    twice in a row is a no-op the second time.
    """
    now = datetime.utcnow()

    if user.hearts >= MAX_HEARTS:
        # At full hearts the clock is meaningless; reset it so the next lost
        # heart starts a fresh interval instead of instantly regenerating from
        # time banked while the user was already full.
        user.hearts_updated_at = now
        return user

    if user.hearts_updated_at is None:
        user.hearts_updated_at = now
        return user

    interval = timedelta(minutes=HEART_REGEN_MINUTES)
    earned = (now - user.hearts_updated_at) // interval
    if earned <= 0:
        return user

    granted = min(earned, MAX_HEARTS - user.hearts)
    user.hearts += granted
    if user.hearts >= MAX_HEARTS:
        user.hearts_updated_at = now
    else:
        # Advance by exactly the intervals consumed, not to `now` — otherwise
        # the remainder is discarded and regen silently slows down.
        user.hearts_updated_at += interval * granted

    return user


def seconds_until_next_heart(user: User) -> int | None:
    """Countdown for the frontend. None when hearts are already full."""
    if user.hearts >= MAX_HEARTS or user.hearts_updated_at is None:
        return None

    due = user.hearts_updated_at + timedelta(minutes=HEART_REGEN_MINUTES)
    return max(0, int((due - datetime.utcnow()).total_seconds()))


def refill_hearts_with_gems(user: User) -> User:
    """Spend gems to go straight back to full hearts.

    Raises ValueError if the user is already full or cannot afford it; the
    controller turns that into a 400.
    """
    apply_heart_regen(user)

    if user.hearts >= MAX_HEARTS:
        raise ValueError("Hearts are already full")
    if user.gems < HEART_REFILL_GEM_COST:
        raise ValueError(
            f"Not enough gems: refill costs {HEART_REFILL_GEM_COST}, you have {user.gems}"
        )

    user.gems -= HEART_REFILL_GEM_COST
    user.hearts = MAX_HEARTS
    user.hearts_updated_at = datetime.utcnow()
    return user
