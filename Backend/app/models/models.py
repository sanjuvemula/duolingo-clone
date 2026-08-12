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
    hearts = Column(Integer, default=5)
    streak = Column(Integer, default=0)
    last_active_date = Column(DateTime, nullable=True)
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
    type = Column(String, nullable=False)  # multiple_choice | translate | match | fill_blank | type_answer
    question = Column(String, nullable=False)
    options = Column(JSON, nullable=True)      # for multiple choice / word bank / match pairs
    correct_answer = Column(JSON, nullable=False)
    order = Column(Integer, default=0)

    lesson = relationship("Lesson", back_populates="exercises")


class UserProgress(Base):
    __tablename__ = "user_progress"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    skill_id = Column(Integer, ForeignKey("skills.id"))
    status = Column(String, default="locked")  # locked | available | completed
    crowns = Column(Integer, default=0)

    user = relationship("User", back_populates="progress")