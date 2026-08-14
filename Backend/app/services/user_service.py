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

# XP a learner is expected to earn per day. At 10 XP per correct answer and 5
# exercises per lesson, this is one clean lesson.
DAILY_XP_GOAL = 50

# Real Duolingo regenerates roughly one heart every 4 hours. That is far too
# slow to observe during a demo or review session, so this is deliberately
# shortened — it's a demo-tuning constant, not a modelling claim.
HEART_REGEN_MINUTES = 10

# Mocked economy: gems are seeded, never earned, and spending them here is the
# only thing that consumes them.
HEART_REFILL_GEM_COST = 350

# Avatar colours a learner may choose. An allow-list rather than a free-form
# string because the value is rendered as a CSS variable name — accepting
# arbitrary input would let a stored value inject into a style attribute, and
# would also let the avatar reference a token that doesn't exist in the theme.
#
# These five are exactly the frontend's accent tokens, which is why the list
# stops here: each one keeps its value in both light and dark mode, so a
# learner's choice never becomes unreadable when they flip the theme.
AVATAR_COLORS = ("blue", "green", "purple", "red", "gold")


def update_profile(
    user: User,
    name: str | None = None,
    avatar_color: str | None = None,
) -> User:
    """Apply an edit to the learner's own profile fields.

    Both arguments are optional and only a non-None one is written, so a PATCH
    that carries just a name leaves the avatar alone. Raises ValueError for an
    empty name or an unrecognised colour; the controller turns that into a 400.
    """
    if name is None and avatar_color is None:
        raise ValueError("Nothing to update — send a name, an avatar_color, or both.")

    if name is not None:
        # Pydantic enforces the length bounds, but it counts the raw string:
        # "   " passes min_length=1 and would render as a nameless profile.
        cleaned = name.strip()
        if not cleaned:
            raise ValueError("Name cannot be blank.")
        user.name = cleaned

    if avatar_color is not None:
        if avatar_color not in AVATAR_COLORS:
            raise ValueError(
                f"Unknown avatar colour '{avatar_color}'. "
                f"Choose one of: {', '.join(AVATAR_COLORS)}."
            )
        user.avatar_color = avatar_color

    return user


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


def current_week_start() -> datetime:
    """Monday 00:00 UTC of the current week — the identity of "this week".

    Leagues reset weekly, so every weekly tally is stored beside the Monday it
    belongs to. Comparing against this value is what makes a stale tally read
    as zero without a scheduled reset.
    """
    now = datetime.utcnow()
    monday = now - timedelta(days=now.weekday())
    return monday.replace(hour=0, minute=0, second=0, microsecond=0)


def add_xp(user: User, amount: int) -> User:
    """Add XP to the lifetime total, today's daily-goal tally, and this week's
    league tally.

    Both period tallies roll over lazily: if the stored date doesn't belong to
    the current period, the tally resets before adding. No scheduled job is
    needed to clear either one.
    """
    today = datetime.utcnow().date()
    week_start = current_week_start()

    if user.xp_today_date is None or user.xp_today_date.date() != today:
        user.xp_today = 0

    if user.week_start is None or user.week_start < week_start:
        user.week_xp = 0

    user.xp_total += amount
    user.xp_today = (user.xp_today or 0) + amount
    user.xp_today_date = datetime.utcnow()
    user.week_xp = (user.week_xp or 0) + amount
    user.week_start = week_start
    return user


def xp_earned_this_week(user: User) -> int:
    """This week's tally, or 0 if the stored tally belongs to an earlier week.

    Read-side counterpart to add_xp's weekly rollover — lets the leaderboard
    report the right number without writing to the row.
    """
    if user.week_start is None:
        return 0
    if user.week_start < current_week_start():
        return 0
    return user.week_xp or 0


def xp_earned_today(user: User) -> int:
    """Today's tally, or 0 if the stored tally belongs to an earlier day.

    Read-side counterpart to add_xp's rollover — lets a GET report the right
    number without writing to the row.
    """
    if user.xp_today_date is None:
        return 0
    if user.xp_today_date.date() != datetime.utcnow().date():
        return 0
    return user.xp_today or 0


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
