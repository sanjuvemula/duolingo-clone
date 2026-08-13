from sqlalchemy import Column, Integer, String, Boolean, ForeignKey, DateTime, JSON
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database.base import Base


class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    email = Column(String, unique=True, index=True)
    xp_total = Column(Integer, default=0)
    # Today's XP tally, for the daily goal. Stored alongside the day it counts
    # for, so a stale tally from a previous day reads as 0 instead of leaking
    # into today's progress.
    xp_today = Column(Integer, default=0)
    xp_today_date = Column(DateTime, nullable=True)
    hearts = Column(Integer, default=5)
    streak = Column(Integer, default=0)
    last_active_date = Column(DateTime, nullable=True)
    # Separate from last_active_date on purpose: streak math needs "last calendar
    # day active", heart regen needs "last time the heart count changed". One
    # field cannot mean both without corrupting the other.
    hearts_updated_at = Column(DateTime, nullable=True)
    gems = Column(Integer, default=0)

    progress = relationship("UserProgress", back_populates="user")


class Course(Base):
    __tablename__ = "courses"
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    language = Column(String, nullable=False)

    units = relationship("Unit", back_populates="course")


class Unit(Base):
    __tablename__ = "units"
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    order = Column(Integer, default=0)
    course_id = Column(Integer, ForeignKey("courses.id"))

    course = relationship("Course", back_populates="units")
    skills = relationship("Skill", back_populates="unit")


class Skill(Base):
    __tablename__ = "skills"
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    order = Column(Integer, default=0)
    unit_id = Column(Integer, ForeignKey("units.id"))

    unit = relationship("Unit", back_populates="skills")
    lessons = relationship("Lesson", back_populates="skill")


class Lesson(Base):
    __tablename__ = "lessons"
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    order = Column(Integer, default=0)
    skill_id = Column(Integer, ForeignKey("skills.id"))

    skill = relationship("Skill", back_populates="lessons")
    exercises = relationship("Exercise", back_populates="lesson")


class Exercise(Base):
    __tablename__ = "exercises"
    id = Column(Integer, primary_key=True, index=True)
    lesson_id = Column(Integer, ForeignKey("lessons.id"))
    # multiple_choice | word_bank | match | fill_blank | type_answer
    type = Column(String, nullable=False)
    question = Column(String, nullable=False)
    options = Column(JSON, nullable=True)      # for multiple choice / word bank / match pairs
    correct_answer = Column(JSON, nullable=False)
    order = Column(Integer, default=0)

    lesson = relationship("Lesson", back_populates="exercises")


class Achievement(Base):
    """Catalog of badges the app can award. Rows are upserted from the
    ACHIEVEMENTS list in achievement_service.py (see ensure_catalog) rather
    than hand-seeded, so the catalog can't drift from the code that checks
    it."""
    __tablename__ = "achievements"
    id = Column(Integer, primary_key=True, index=True)
    code = Column(String, unique=True, nullable=False)
    title = Column(String, nullable=False)
    description = Column(String, nullable=False)
    icon = Column(String, nullable=False)  # a single emoji -- no icon asset pipeline needed


class UserAchievement(Base):
    """One earned badge. A row existing is the fact of record — "this user
    earned this achievement at this time" — rather than a computed flag, so
    earned_at is real and query-able (e.g. "what did they unlock this
    week")."""
    __tablename__ = "user_achievements"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    achievement_id = Column(Integer, ForeignKey("achievements.id"))
    earned_at = Column(DateTime, default=datetime.utcnow)


class UserProgress(Base):
    __tablename__ = "user_progress"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    skill_id = Column(Integer, ForeignKey("skills.id"))
    status = Column(String, default="locked")  # locked | available | completed
    crowns = Column(Integer, default=0)

    user = relationship("User", back_populates="progress")