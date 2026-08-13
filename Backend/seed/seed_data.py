"""
Seed script — wipes and repopulates the SQLite DB with demo content.

Run from the Backend/ directory (same cwd requirement as uvicorn, since
connection.py points at the relative path "./duolingo.db"):

    python seed/seed_data.py

Content shape (deliberately small — just enough to exercise every P0
feature, not a full course):
    1 course (Korean)
      Unit 1: Basics
        Skill: Greetings   -> 2 lessons, 3 exercises each (mc/translate/match)
        Skill: Numbers     -> 2 lessons, 3 exercises each
      Unit 2: Food
        Skill: Food Words  -> 2 lessons, 3 exercises each
    1 user (Demo User) with UserProgress rows:
        Greetings -> "available" (first skill in the tree is always unlocked)
        Numbers, Food Words -> "locked"
This gives the frontend a real lock/unlock boundary to render on first load,
instead of everything being either all-locked or all-open.

Text is Hangul (Korean script), stored and read as plain UTF-8 strings —
SQLite, FastAPI and Next.js all default to UTF-8, so no special handling is
needed anywhere in the stack for this to round-trip correctly.
"""

import sys
from pathlib import Path

# Allow running as `python seed/seed_data.py` (script, not a package) by
# putting Backend/ on sys.path so `import app...` resolves.
sys.path.append(str(Path(__file__).resolve().parent.parent))

from app.database.base import Base
from app.database.connection import engine, SessionLocal
from app.models.models import (
    User,
    Course,
    Unit,
    Skill,
    Lesson,
    Exercise,
    UserProgress,
)


def wipe_tables(db) -> None:
    """Delete in reverse foreign-key dependency order so no FK constraint
    trips, then commit. Makes this script safe to re-run any number of
    times while iterating."""
    db.query(UserProgress).delete()
    db.query(Exercise).delete()
    db.query(Lesson).delete()
    db.query(Skill).delete()
    db.query(Unit).delete()
    db.query(Course).delete()
    db.query(User).delete()
    db.commit()


def seed() -> None:
    Base.metadata.create_all(bind=engine)  # safe no-op if tables exist
    db = SessionLocal()

    try:
        wipe_tables(db)

        # --- Course --------------------------------------------------
        course = Course(title="Korean for English Speakers", language="Korean")
        db.add(course)
        db.flush()  # assigns course.id without committing yet

        # --- Units -----------------------------------------------------
        unit_basics = Unit(title="Basics", order=1, course_id=course.id)
        unit_food = Unit(title="Food", order=2, course_id=course.id)
        db.add_all([unit_basics, unit_food])
        db.flush()

        # --- Skills ------------------------------------------------------
        skill_greetings = Skill(title="Greetings", order=1, unit_id=unit_basics.id)
        skill_numbers = Skill(title="Numbers", order=2, unit_id=unit_basics.id)
        skill_food = Skill(title="Food Words", order=1, unit_id=unit_food.id)
        db.add_all([skill_greetings, skill_numbers, skill_food])
        db.flush()

        # --- Lessons (2 per skill) --------------------------------------
        lessons = {
            "greetings_1": Lesson(title="Greetings 1", order=1, skill_id=skill_greetings.id),
            "greetings_2": Lesson(title="Greetings 2", order=2, skill_id=skill_greetings.id),
            "numbers_1": Lesson(title="Numbers 1", order=1, skill_id=skill_numbers.id),
            "numbers_2": Lesson(title="Numbers 2", order=2, skill_id=skill_numbers.id),
            "food_1": Lesson(title="Food 1", order=1, skill_id=skill_food.id),
            "food_2": Lesson(title="Food 2", order=2, skill_id=skill_food.id),
        }
        db.add_all(lessons.values())
        db.flush()

        # --- Exercises ----------------------------------------------------
        # Every lesson gets exactly 3 exercises, one of each P0 exercise
        # type, so the lesson player is guaranteed to hit all three code
        # paths on every single lesson.
        exercises = [
            # Greetings 1
            Exercise(
                lesson_id=lessons["greetings_1"].id, order=1,
                type="multiple_choice",
                question="What does '안녕하세요' mean?",
                options=["Hello", "Goodbye", "Thank you", "Sorry"],
                correct_answer="Hello",
            ),
            Exercise(
                lesson_id=lessons["greetings_1"].id, order=2,
                type="translate",
                question="Translate to Korean: 'Thank you'",
                options=None,
                correct_answer="감사합니다",
            ),
            Exercise(
                lesson_id=lessons["greetings_1"].id, order=3,
                type="match",
                question="Match the Korean word to its English meaning",
                options=[["안녕하세요", "Hello"], ["안녕히 가세요", "Goodbye"], ["감사합니다", "Thank you"]],
                correct_answer=[["안녕하세요", "Hello"], ["안녕히 가세요", "Goodbye"], ["감사합니다", "Thank you"]],
            ),
            # Greetings 2
            Exercise(
                lesson_id=lessons["greetings_2"].id, order=1,
                type="multiple_choice",
                question="What does '죄송합니다' mean?",
                options=["Sorry", "Hello", "Please", "Excuse me"],
                correct_answer="Sorry",
            ),
            Exercise(
                lesson_id=lessons["greetings_2"].id, order=2,
                type="translate",
                question="Translate to Korean: 'Nice to meet you'",
                options=None,
                correct_answer="만나서 반갑습니다",
            ),
            Exercise(
                lesson_id=lessons["greetings_2"].id, order=3,
                type="match",
                question="Match the Korean phrase to its English meaning",
                options=[["어떻게 지내세요?", "How are you?"], ["만나서 반갑습니다", "Nice to meet you"], ["실례합니다", "Excuse me"]],
                correct_answer=[["어떻게 지내세요?", "How are you?"], ["만나서 반갑습니다", "Nice to meet you"], ["실례합니다", "Excuse me"]],
            ),
            # Numbers 1
            Exercise(
                lesson_id=lessons["numbers_1"].id, order=1,
                type="multiple_choice",
                question="What does '셋' mean?",
                options=["Three", "Two", "Four", "Ten"],
                correct_answer="Three",
            ),
            Exercise(
                lesson_id=lessons["numbers_1"].id, order=2,
                type="translate",
                question="Translate to Korean: 'Five' (native Korean number)",
                options=None,
                correct_answer="다섯",
            ),
            Exercise(
                lesson_id=lessons["numbers_1"].id, order=3,
                type="match",
                question="Match the Korean number to its English meaning",
                options=[["하나", "One"], ["둘", "Two"], ["여섯", "Six"]],
                correct_answer=[["하나", "One"], ["둘", "Two"], ["여섯", "Six"]],
            ),
            # Numbers 2
            Exercise(
                lesson_id=lessons["numbers_2"].id, order=1,
                type="multiple_choice",
                question="What does '열' mean?",
                options=["Ten", "Nine", "Seven", "Eight"],
                correct_answer="Ten",
            ),
            Exercise(
                lesson_id=lessons["numbers_2"].id, order=2,
                type="translate",
                question="Translate to Korean: 'Eight' (native Korean number)",
                options=None,
                correct_answer="여덟",
            ),
            Exercise(
                lesson_id=lessons["numbers_2"].id, order=3,
                type="match",
                question="Match the Korean number to its English meaning",
                options=[["일곱", "Seven"], ["아홉", "Nine"], ["열", "Ten"]],
                correct_answer=[["일곱", "Seven"], ["아홉", "Nine"], ["열", "Ten"]],
            ),
            # Food 1
            Exercise(
                lesson_id=lessons["food_1"].id, order=1,
                type="multiple_choice",
                question="What does '사과' mean?",
                options=["Apple", "Bread", "Water", "Egg"],
                correct_answer="Apple",
            ),
            Exercise(
                lesson_id=lessons["food_1"].id, order=2,
                type="translate",
                question="Translate to Korean: 'Bread'",
                options=None,
                correct_answer="빵",
            ),
            Exercise(
                lesson_id=lessons["food_1"].id, order=3,
                type="match",
                question="Match the Korean word to its English meaning",
                options=[["물", "Water"], ["계란", "Egg"], ["우유", "Milk"]],
                correct_answer=[["물", "Water"], ["계란", "Egg"], ["우유", "Milk"]],
            ),
            # Food 2
            Exercise(
                lesson_id=lessons["food_2"].id, order=1,
                type="multiple_choice",
                question="What does '치즈' mean?",
                options=["Cheese", "Rice", "Meat", "Fish"],
                correct_answer="Cheese",
            ),
            Exercise(
                lesson_id=lessons["food_2"].id, order=2,
                type="translate",
                question="Translate to Korean: 'Rice'",
                options=None,
                correct_answer="쌀",
            ),
            Exercise(
                lesson_id=lessons["food_2"].id, order=3,
                type="match",
                question="Match the Korean word to its English meaning",
                options=[["고기", "Meat"], ["생선", "Fish"], ["닭고기", "Chicken"]],
                correct_answer=[["고기", "Meat"], ["생선", "Fish"], ["닭고기", "Chicken"]],
            ),
        ]
        db.add_all(exercises)

        # --- Sample user --------------------------------------------------
        user = User(
            name="Demo User",
            email="demo@example.com",
            xp_total=0,
            hearts=5,
            streak=0,
            gems=0,
        )
        db.add(user)
        db.flush()

        # --- Progress: only the first skill in the tree starts unlocked --
        # This mirrors real skill-tree logic (services layer will unlock the
        # next skill once the current one reaches "completed"), and gives
        # the frontend a locked skill to render from the very first load.
        db.add_all([
            UserProgress(user_id=user.id, skill_id=skill_greetings.id, status="available", crowns=0),
            UserProgress(user_id=user.id, skill_id=skill_numbers.id, status="locked", crowns=0),
            UserProgress(user_id=user.id, skill_id=skill_food.id, status="locked", crowns=0),
        ])

        db.commit()

        print("Seed complete:")
        print(f"  1 course, 2 units, 3 skills, {len(lessons)} lessons, {len(exercises)} exercises")
        print(f"  1 user -> id={user.id}, email={user.email}")

    finally:
        db.close()


if __name__ == "__main__":
    seed()