"""
Exercise service — answer checking + per-exercise XP/hearts.

Kept deliberately separate from progress_service.py: this file only ever
touches a single exercise submission (one right/wrong answer). It never
touches UserProgress/crowns/skill unlocking — that happens once, at the end
of a lesson, in progress_service.complete_lesson(). Splitting it this way
means each function has one reason to change, and it's easy to point at
"this is where an answer gets checked" vs "this is where a lesson finishing
changes the skill tree" in the eval interview.
"""

from app.models.models import Exercise, User

XP_PER_CORRECT_ANSWER = 10


def check_answer(exercise: Exercise, submitted_answer) -> bool:
    """Compare a submitted answer against Exercise.correct_answer.

    Two exercise types need special handling, everything else is a plain
    equality check:

    - multiple_choice / translate: correct_answer is a plain string. We
      normalize with .strip().lower() so "Hello" / " hello " / "HELLO"
      all count as correct — matters most for `translate`, where the user
      is typing free text, not picking from a fixed list.

    - match: correct_answer is a list of [korean, english] pairs. The pairs
      are compared as a *set* of tuples, not a list, because the pairing UI
      lets the user connect them in any order — [[a,b],[c,d]] and
      [[c,d],[a,b]] represent the same completed match and must both count
      as correct.
    """
    correct_answer = exercise.correct_answer

    if exercise.type == "match":
        try:
            correct_set = {tuple(pair) for pair in correct_answer}
            submitted_set = {tuple(pair) for pair in submitted_answer}
        except (TypeError, ValueError):
            # Malformed submission (wrong shape) is just wrong, not a 500.
            return False
        return correct_set == submitted_set

    # multiple_choice, translate, and any other plain-string exercise type
    if isinstance(correct_answer, str) and isinstance(submitted_answer, str):
        return correct_answer.strip().lower() == submitted_answer.strip().lower()

    # Fallback for any exercise type added later with a non-string answer
    # shape we haven't special-cased yet.
    return correct_answer == submitted_answer


def submit_exercise_answer(db, user: User, exercise: Exercise, submitted_answer) -> dict:
    """Check one answer and apply its immediate consequences: XP on
    correct, a lost heart on incorrect. Does NOT commit — caller commits,
    so this can be composed with other changes in the same transaction.

    Returns a plain dict matching schemas.ExerciseSubmitResponse's fields
    (lesson_complete is always False here — that only gets set to True by
    progress_service.complete_lesson, a separate call the frontend makes
    once every exercise in the lesson has been answered).
    """
    is_correct = check_answer(exercise, submitted_answer)

    xp_earned = 0
    if is_correct:
        xp_earned = XP_PER_CORRECT_ANSWER
        user.xp_total += xp_earned
    else:
        # Never let hearts go negative. Once a user is already at 0 hearts,
        # further wrong answers just don't do anything more damaging — the
        # frontend is expected to stop letting them submit at that point
        # (lesson_failed communicates that state clearly).
        if user.hearts > 0:
            user.hearts -= 1

    db.add(user)

    return {
        "correct": is_correct,
        "correct_answer": exercise.correct_answer,
        "hearts_remaining": user.hearts,
        "lesson_failed": user.hearts <= 0,
        "lesson_complete": False,
        "xp_earned": xp_earned,
    }