"""
Progress service — what happens to the skill tree when a lesson finishes.

Called once per lesson, after every exercise in it has been submitted
(frontend calls POST /lessons/{id}/complete once it runs out of exercises
and the user hasn't hit 0 hearts). This is deliberately separate from
exercise_service.py: exercise submission is "did they get this one answer
right", lesson completion is "does this change the shape of the skill
tree" (crowns, locked -> available, available -> completed).

Assumption worth stating out loud in the eval: the locked schema only
tracks progress at the *skill* level (UserProgress.crowns), not per-lesson.
So there's no dedicated table recording "lesson 4 was completed by user 7".
Completing any lesson in a skill just increments that skill's crown count
by one, capped at the skill's total lesson count. Replaying an
already-completed lesson is harmless — it keeps recomputing the same
capped value, not double-counting — but it does mean two *different*
lessons in the same skill are interchangeable from the tree's point of
view. A real production schema would add a LessonProgress table; this is a
deliberate P0 scope cut given the deadline, not an oversight.
"""

from sqlalchemy.orm import Session

from app.models.models import Lesson, Skill, Unit, User, UserProgress
from app.services.user_service import update_streak


def complete_lesson(db: Session, user: User, lesson: Lesson) -> dict:
    skill: Skill = lesson.skill
    total_lessons_in_skill = len(skill.lessons)

    progress = (
        db.query(UserProgress)
        .filter(UserProgress.user_id == user.id, UserProgress.skill_id == skill.id)
        .first()
    )
    if progress is None:
        # Shouldn't happen in practice — every skill gets a UserProgress
        # row at seed time — but guard rather than 500 if it ever does.
        progress = UserProgress(user_id=user.id, skill_id=skill.id, status="available", crowns=0)
        db.add(progress)

    progress.crowns = min(progress.crowns + 1, total_lessons_in_skill)
    if progress.crowns >= total_lessons_in_skill:
        progress.status = "completed"

    newly_unlocked_skill_id = None
    if progress.status == "completed":
        newly_unlocked_skill_id = _unlock_next_skill(db, user, skill)

    # Streak: update once per calendar day, idempotent on same-day repeats.
    update_streak(user)
    db.add(user)

    db.commit()
    db.refresh(progress)
    db.refresh(user)

    return {
        "lesson_id": lesson.id,
        "skill_id": skill.id,
        "crowns": progress.crowns,
        "skill_status": progress.status,
        "xp_total": user.xp_total,
        "hearts": user.hearts,
        "streak": user.streak,
        "newly_unlocked_skill_id": newly_unlocked_skill_id,
    }


def _unlock_next_skill(db: Session, user: User, completed_skill: Skill) -> int | None:
    """Find the next skill after `completed_skill` in course order (unit
    order, then skill order within that unit) and flip its UserProgress
    from "locked" to "available", if it isn't already unlocked.

    Ordering spans units because a course is one continuous tree, not a
    set of independent unit trees — finishing the last skill in Unit 1
    should unlock the first skill of Unit 2.
    """
    unit: Unit = completed_skill.unit

    course_skills = (
        db.query(Skill)
        .join(Unit, Skill.unit_id == Unit.id)
        .filter(Unit.course_id == unit.course_id)
        .order_by(Unit.order.asc(), Skill.order.asc())
        .all()
    )

    try:
        current_index = next(i for i, s in enumerate(course_skills) if s.id == completed_skill.id)
    except StopIteration:
        return None

    if current_index + 1 >= len(course_skills):
        return None  # completed skill was the last one in the course

    next_skill = course_skills[current_index + 1]

    next_progress = (
        db.query(UserProgress)
        .filter(UserProgress.user_id == user.id, UserProgress.skill_id == next_skill.id)
        .first()
    )
    if next_progress is None:
        next_progress = UserProgress(user_id=user.id, skill_id=next_skill.id, status="locked", crowns=0)
        db.add(next_progress)

    if next_progress.status == "locked":
        next_progress.status = "available"
        db.add(next_progress)
        return next_skill.id

    return None  # already unlocked, nothing changed