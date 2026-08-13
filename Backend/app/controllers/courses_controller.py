"""
Courses controller — builds the skill tree view.

The skill tree is the one composite read in the whole API: Course -> Units
-> Skills, where each Skill also needs a `status`/`crowns` pair that isn't
on the Skill row itself but on that specific user's UserProgress row
(schemas.SkillWithProgress docstring flags exactly this — from_attributes
can't do it alone). So this controller does the join in Python: pull every
UserProgress row for the user in one query, key it by skill_id, then walk
the ORM relationships (course.units -> unit.skills) building
SkillWithProgress objects by hand instead of model_validate straight off
the Skill row.

No service function backs this — it's a read, not a state change, so
there's no business logic to isolate for reuse elsewhere the way answer
submission or lesson completion have.

Takes an already-resolved `user: User` rather than a raw `user_id` — the
route depends on app.middleware.current_user.get_current_user, which does
the lookup + 404 once, in one place. See that module's docstring for why.
"""

from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.models.models import Course, User, UserProgress
from app.schemas.schemas import (
    CourseWithUnits,
    SkillWithProgress,
    UnitWithSkills,
)


def get_skill_tree(db: Session, course_id: int, user: User) -> CourseWithUnits:
    course = db.query(Course).filter(Course.id == course_id).first()
    if course is None:
        raise HTTPException(status_code=404, detail=f"Course {course_id} not found")

    # One query for every progress row this user has, keyed by skill_id,
    # instead of a query-per-skill inside the loop below.
    progress_rows = (
        db.query(UserProgress).filter(UserProgress.user_id == user.id).all()
    )
    progress_by_skill_id = {row.skill_id: row for row in progress_rows}

    units_out: list[UnitWithSkills] = []
    for unit in sorted(course.units, key=lambda u: u.order):
        skills_out: list[SkillWithProgress] = []
        for skill in sorted(unit.skills, key=lambda s: s.order):
            progress = progress_by_skill_id.get(skill.id)
            first_lesson = min(skill.lessons, key=lambda l: l.order) if skill.lessons else None
            skills_out.append(
                SkillWithProgress(
                    id=skill.id,
                    title=skill.title,
                    order=skill.order,
                    unit_id=skill.unit_id,
                    status=progress.status if progress else "locked",
                    crowns=progress.crowns if progress else 0,
                    lesson_id=first_lesson.id if first_lesson else None,
                )
            )
        units_out.append(
            UnitWithSkills(
                id=unit.id,
                title=unit.title,
                order=unit.order,
                course_id=unit.course_id,
                skills=skills_out,
            )
        )

    return CourseWithUnits(
        id=course.id,
        title=course.title,
        language=course.language,
        units=units_out,
    )
    