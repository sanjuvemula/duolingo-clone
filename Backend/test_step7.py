"""
One-off manual test script for Step 7 services — NOT part of the app,
just a script to run and read the output. Deletes and reseeds the DB first
so results are reproducible.

Run from Backend/:
    python test_step7.py
"""

import subprocess
import sys
from pathlib import Path

sys.path.append(str(Path(__file__).resolve().parent))

# Reseed fresh so this test always starts from a known state.
subprocess.run([sys.executable, "seed/seed_data.py"], check=True)

from app.database.connection import SessionLocal
from app.models.models import User, Exercise, Lesson, UserProgress, Skill
from app.services import exercise_service, progress_service

db = SessionLocal()
user = db.query(User).first()

print()
print("=== BEFORE ===")
print(f"xp={user.xp_total} hearts={user.hearts}")

lesson1 = db.query(Lesson).filter(Lesson.title == "Greetings 1").first()
exs = sorted(lesson1.exercises, key=lambda e: e.order)

print()
print("=== Submitting correct answers for Greetings 1 (3 exercises) ===")
for ex in exs:
    answer = ex.correct_answer
    result = exercise_service.submit_exercise_answer(db, user, ex, answer)
    db.commit()
    print(f"  type={ex.type:16s} correct={result['correct']}  xp_earned={result['xp_earned']}  hearts={result['hearts_remaining']}")

print()
print(f"xp={user.xp_total} hearts={user.hearts}")

print()
print("=== Match exercise: submit pairs in a DIFFERENT order, should still be correct ===")
match_ex = next(e for e in exs if e.type == "match")
shuffled = list(reversed(match_ex.correct_answer))
result = exercise_service.submit_exercise_answer(db, user, match_ex, shuffled)
print(f"  reversed-order match correct={result['correct']}  (expected True)")
db.rollback()  # discard this test submission's xp bump

print()
print("=== Completing Greetings 1 lesson ===")
progress_before = db.query(UserProgress).filter(UserProgress.skill_id == lesson1.skill_id).first()
print(f"  before: status={progress_before.status} crowns={progress_before.crowns}")
result = progress_service.complete_lesson(db, user, lesson1)
print(f"  complete_lesson result: {result}")

print()
print("=== Wrong answers: hearts should go 5 -> 0, never negative ===")
ex = db.query(Exercise).filter(Exercise.type == "multiple_choice").first()
for i in range(7):
    result = exercise_service.submit_exercise_answer(db, user, ex, "DEFINITELY WRONG")
    db.commit()
    print(f"  attempt {i+1}: correct={result['correct']} hearts_remaining={result['hearts_remaining']} lesson_failed={result['lesson_failed']}")

print()
print("=== Completing Greetings 2 (final lesson in Greetings skill) -> should complete skill & unlock Numbers ===")
lesson2 = db.query(Lesson).filter(Lesson.title == "Greetings 2").first()
numbers_progress_before = db.query(UserProgress).join(Skill).filter(Skill.title == "Numbers").first()
print(f"  Numbers skill before: status={numbers_progress_before.status}")

result = progress_service.complete_lesson(db, user, lesson2)
print(f"  complete_lesson result: {result}")

numbers_progress_after = db.query(UserProgress).join(Skill).filter(Skill.title == "Numbers").first()
print(f"  Numbers skill after:  status={numbers_progress_after.status}")

db.close()
print()
print("=== DONE ===")