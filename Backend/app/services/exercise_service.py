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
from app.services.user_service import add_xp

XP_PER_CORRECT_ANSWER = 10


def _normalize(text: str) -> str:
    """Casefold and collapse all runs of whitespace to a single space.

    Collapsing whitespace (rather than just .strip()) is what makes word_bank
    work: the frontend joins tapped word tiles with spaces, so a stray double
    space between tiles must not fail an otherwise perfect answer.
    """
    return " ".join(text.split()).lower()


def check_answer(exercise: Exercise, submitted_answer) -> bool:
    """Compare a submitted answer against Exercise.correct_answer.

    Answer shapes by exercise type:

    - multiple_choice / fill_blank / type_answer / word_bank: correct_answer
      is a plain string, compared with whitespace and case normalized. This
      matters most for type_answer (free typing) and word_bank (tiles joined
      with spaces).

    - match: correct_answer is a list of [korean, english] pairs, compared as
      a *set* of tuples rather than a list, because the pairing UI lets the
      user connect them in any order — [[a,b],[c,d]] and [[c,d],[a,b]] are
      the same completed match and must both count as correct.
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

    # word_bank arrives as an ordered list of tapped tiles; the sentence it
    # spells is what gets compared, so join before normalizing.
    if exercise.type == "word_bank" and isinstance(submitted_answer, list):
        if not all(isinstance(word, str) for word in submitted_answer):
            return False
        submitted_answer = " ".join(submitted_answer)

    if isinstance(correct_answer, str) and isinstance(submitted_answer, str):
        return _normalize(correct_answer) == _normalize(submitted_answer)

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
        # Goes through add_xp rather than touching xp_total directly, so the
        # daily-goal tally stays in step with the lifetime total.
        add_xp(user, xp_earned)
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