"""
Achievement service — the badge catalog and the rules that award it.

The catalog lives here as code, not as seed data, because each entry pairs a
description with the predicate that earns it. Splitting those apart (rows in a
seed file, `if` statements in a service) is how the two drift: a badge gets
reworded in the seed and the rule that grants it is never found. ensure_catalog()
upserts the list into the achievements table so the DB mirrors this file.

Awarding is evaluated after a lesson completes, which is the only moment any of
these values change. Every rule is a pure predicate over the User + their
progress rows, so checking is idempotent — a badge already earned is skipped by
the "already earned" query, not by the rule itself.
"""

from dataclasses import dataclass
from typing import Callable

from sqlalchemy.orm import Session

from app.models.models import Achievement, User, UserAchievement, UserProgress


@dataclass(frozen=True)
class AchievementDef:
    code: str
    title: str
    description: str
    icon: str
    # (user, completed_skill_count, total_crowns) -> earned?
    earned: Callable[[User, int, int], bool]


ACHIEVEMENTS: list[AchievementDef] = [
    AchievementDef(
        code="first_lesson",
        title="First Steps",
        description="Complete your first lesson",
        icon="🌱",
        earned=lambda user, skills, crowns: crowns >= 1,
    ),
    AchievementDef(
        code="xp_100",
        title="Century",
        description="Earn 100 XP",
        icon="⚡",
        earned=lambda user, skills, crowns: user.xp_total >= 100,
    ),
    AchievementDef(
        code="xp_500",
        title="High Roller",
        description="Earn 500 XP",
        icon="💫",
        earned=lambda user, skills, crowns: user.xp_total >= 500,
    ),
    AchievementDef(
        code="streak_3",
        title="On Fire",
        description="Reach a 3-day streak",
        icon="🔥",
        earned=lambda user, skills, crowns: user.streak >= 3,
    ),
    AchievementDef(
        code="streak_7",
        title="Unstoppable",
        description="Reach a 7-day streak",
        icon="🚀",
        earned=lambda user, skills, crowns: user.streak >= 7,
    ),
    AchievementDef(
        code="skill_master",
        title="Skill Master",
        description="Complete your first skill",
        icon="👑",
        earned=lambda user, skills, crowns: skills >= 1,
    ),
    AchievementDef(
        code="scholar",
        title="Scholar",
        description="Complete three skills",
        icon="🎓",
        earned=lambda user, skills, crowns: skills >= 3,
    ),
    AchievementDef(
        code="crown_10",
        title="Crown Collector",
        description="Earn 10 crowns",
        icon="🏆",
        earned=lambda user, skills, crowns: crowns >= 10,
    ),
]

ACHIEVEMENTS_BY_CODE = {a.code: a for a in ACHIEVEMENTS}


def ensure_catalog(db: Session) -> None:
    """Upsert ACHIEVEMENTS into the achievements table.

    Called at app startup so the table always matches this file — adding a
    badge here is enough, with no seed edit and no migration.
    """
    existing = {row.code: row for row in db.query(Achievement).all()}
    changed = False

    for definition in ACHIEVEMENTS:
        row = existing.get(definition.code)
        if row is None:
            db.add(Achievement(
                code=definition.code,
                title=definition.title,
                description=definition.description,
                icon=definition.icon,
            ))
            changed = True
        elif (row.title, row.description, row.icon) != (
            definition.title, definition.description, definition.icon
        ):
            row.title = definition.title
            row.description = definition.description
            row.icon = definition.icon
            changed = True

    if changed:
        db.commit()


def _progress_totals(db: Session, user: User) -> tuple[int, int]:
    """(completed skill count, total crowns) — the two aggregates the rules
    need, fetched in one query instead of one per rule."""
    rows = db.query(UserProgress).filter(UserProgress.user_id == user.id).all()
    completed_skills = sum(1 for row in rows if row.status == "completed")
    total_crowns = sum(row.crowns or 0 for row in rows)
    return completed_skills, total_crowns


def evaluate(db: Session, user: User) -> list[Achievement]:
    """Award any newly-earned achievements. Returns only the ones granted by
    this call, so the caller can surface "just unlocked" in the UI.

    Does NOT commit — the caller owns the transaction, matching the rest of
    the service layer.
    """
    completed_skills, total_crowns = _progress_totals(db, user)

    earned_ids = {
        row.achievement_id
        for row in db.query(UserAchievement).filter(UserAchievement.user_id == user.id).all()
    }
    catalog = {row.code: row for row in db.query(Achievement).all()}

    newly_earned: list[Achievement] = []
    for definition in ACHIEVEMENTS:
        row = catalog.get(definition.code)
        if row is None or row.id in earned_ids:
            continue
        if definition.earned(user, completed_skills, total_crowns):
            db.add(UserAchievement(user_id=user.id, achievement_id=row.id))
            newly_earned.append(row)

    return newly_earned


def list_for_user(db: Session, user: User) -> list[dict]:
    """The full catalog with earned state merged in, so the profile page can
    show locked badges as goals rather than hiding them."""
    earned_at_by_id = {
        row.achievement_id: row.earned_at
        for row in db.query(UserAchievement).filter(UserAchievement.user_id == user.id).all()
    }
    catalog = {row.code: row for row in db.query(Achievement).all()}

    result = []
    for definition in ACHIEVEMENTS:
        row = catalog.get(definition.code)
        if row is None:
            continue
        result.append({
            "code": row.code,
            "title": row.title,
            "description": row.description,
            "icon": row.icon,
            "earned": row.id in earned_at_by_id,
            "earned_at": earned_at_by_id.get(row.id),
        })
    return result
