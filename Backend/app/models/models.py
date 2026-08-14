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
    # This week's XP, for the league leaderboard. Same "value beside the period
    # it counts for" shape as xp_today/xp_today_date: week_start stores the
    # Monday the tally belongs to, so a stale week reads as 0 without a
    # scheduled reset job.
    week_xp = Column(Integer, default=0)
    week_start = Column(DateTime, nullable=True)
    # Which league the learner competes in. Denormalized onto the user rather
    # than derived from XP on every read, because Duolingo's leagues are
    # promotion/relegation based -- you stay in a league until the week ends,
    # even if your XP would place you elsewhere mid-week.
    league = Column(String, default="bronze")
    hearts = Column(Integer, default=5)
    streak = Column(Integer, default=0)
    last_active_date = Column(DateTime, nullable=True)
    # Separate from last_active_date on purpose: streak math needs "last calendar
    # day active", heart regen needs "last time the heart count changed". One
    # field cannot mean both without corrupting the other.
    hearts_updated_at = Column(DateTime, nullable=True)
    gems = Column(Integer, default=0)
    # Avatar colour as a token *name* ("blue", "green", …), not a hex value.
    # Storing the name keeps the avatar theme-aware: the frontend resolves it
    # to a CSS variable, so the same row renders correctly in light and dark
    # mode. A stored hex would be frozen at whatever the theme was when the
    # learner picked it. Unknown names fall back to the default.
    avatar_color = Column(String, default="blue")
    # When the learner joined, for the profile's "Joined <month year>" line.
    # Distinct from last_active_date and hearts_updated_at: those track recent
    # activity and move constantly, this is written once and never again.
    created_at = Column(DateTime, default=datetime.utcnow)
    # How many weeks the learner finished in their league's top three. Mocked
    # in the same sense as gems: the column is real and read from, but nothing
    # increments it, because promotion is applied at the week boundary and this
    # project has no scheduler to run that job. Seeded with a plausible value
    # so the profile stat isn't a permanent zero.
    top_3_finishes = Column(Integer, default=0)

    progress = relationship("UserProgress", back_populates="user")


class AppMeta(Base):
    """Single-row-per-key store for facts about the database itself, as
    opposed to facts about a learner or the course.

    Currently holds exactly one key, "content_version". There is no migration
    tool in this project (see the README), so the deployment needs some way to
    tell "this disk holds an older version of the seed content and schema"
    from "this disk is current". A version string written at seed time and
    compared at boot is that signal — see seed_data.seed_if_stale.

    A table rather than a file on disk because the database is the thing being
    versioned: if the DB is ever restored, moved, or swapped, the version
    travels with the data it describes instead of going stale beside it.
    """
    __tablename__ = "app_meta"
    key = Column(String, primary_key=True)
    value = Column(String, nullable=False)


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
    # Which illustration the path node shows. A short key ("greeting", "food",
    # …) rather than a URL or emoji: the frontend maps it to an inline SVG, so
    # the icon inherits the theme's colours and the app ships no image assets.
    # Unknown keys fall back to a default, so a typo can't break the path.
    icon = Column(String, default="star")
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