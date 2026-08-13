"""
Practice service — the timed "legendary" challenge.

A separate mode from the lesson loop, with deliberately different rules:

- **Exercises are drawn from everything the learner has unlocked**, not from
  one lesson, so practice is revision across the whole course so far rather
  than a replay of a single skill.
- **Wrong answers cost no hearts.** Hearts exist to make lessons consequential;
  a timed round is already self-limiting, and draining hearts here would punish
  the learner for choosing to practise. The pressure is the clock.
- **XP is still real.** It flows through user_service.add_xp like any other XP,
  so a practice round counts toward the daily goal and the weekly league.

Kept out of exercise_service because that module's contract is "checking an
answer costs a heart on failure" — the rule the lesson loop depends on. Adding
a flag to bend that rule would make one function answer to two masters.
"""

import random

from sqlalchemy.orm import Session

from app.models.models import Exercise, Lesson, Skill, User, UserProgress
from app.services.exercise_service import check_answer
from app.services.user_service import add_xp

# Seconds on the clock. Long enough for roughly 8-12 answers at a steady pace,
# short enough that a reviewer will actually sit through a whole round.
PRACTICE_DURATION_SECONDS = 60

XP_PER_CORRECT_ANSWER = 10

# Upper bound on how many exercises to hand the client. The round is limited by
# the clock, not the queue, so this only has to be comfortably more than anyone
# can answer in the time.
MAX_PRACTICE_EXERCISES = 30


def build_practice_set(db: Session, user: User, limit: int = MAX_PRACTICE_EXERCISES) -> list[Exercise]:
    """A shuffled set of exercises drawn from the learner's unlocked skills.

    Falls back to the first skill in the course when nothing is unlocked yet,
    so practice is never an empty screen for a brand-new learner.
    """
    unlocked_skill_ids = [
        row.skill_id
        for row in db.query(UserProgress).filter(
            UserProgress.user_id == user.id,
            UserProgress.status.in_(["available", "completed"]),
        )
    ]

    if not unlocked_skill_ids:
        first_skill = db.query(Skill).order_by(Skill.id).first()
        if first_skill is None:
            return []
        unlocked_skill_ids = [first_skill.id]

    exercises = (
        db.query(Exercise)
        .join(Lesson, Exercise.lesson_id == Lesson.id)
        .filter(Lesson.skill_id.in_(unlocked_skill_ids))
        .all()
    )

    random.shuffle(exercises)
    return exercises[:limit]


def submit_practice_answer(db: Session, user: User, exercise: Exercise, submitted_answer) -> dict:
    """Check one practice answer. Awards XP on success, never touches hearts.

    Does NOT commit — the caller owns the transaction, matching the rest of the
    service layer.
    """
    is_correct = check_answer(exercise, submitted_answer)

    xp_earned = 0
    if is_correct:
        xp_earned = XP_PER_CORRECT_ANSWER
        add_xp(user, xp_earned)
        db.add(user)

    return {
        "correct": is_correct,
        "correct_answer": exercise.correct_answer,
        "xp_earned": xp_earned,
        "xp_total": user.xp_total,
    }
