import type { CourseWithUnits } from "@/types/api";
import { UnitBanner } from "./UnitBanner";
import { SkillNode } from "./SkillNode";

interface SkillPathProps {
  course: CourseWithUnits;
}

/** Zigzag offset pattern (px), one entry per node position, repeating.
 * Mirrors the classic Duolingo trail: nodes drift right, come back to
 * center, drift left, come back to center. A plain CSS flex column with
 * per-node translateX is enough to read as a winding path — no absolute
 * positioning or SVG route math needed for a handful of nodes per skill. */
const ZIGZAG_PATTERN = [0, 55, 85, 55, 0, -55, -85, -55];

/** Flattens every skill across every unit, in order, and assigns each one
 * its zigzag offset by overall position — computed once up front so the
 * render map below never mutates a shared counter (React re-runs render
 * bodies, so a `let` counter incremented inside .map would drift). */
function assignOffsets(course: CourseWithUnits): Map<number, number> {
  const offsets = new Map<number, number>();
  let index = 0;
  for (const unit of course.units) {
    for (const skill of unit.skills) {
      offsets.set(skill.id, ZIGZAG_PATTERN[index % ZIGZAG_PATTERN.length]);
      index += 1;
    }
  }
  return offsets;
}

export function SkillPath({ course }: SkillPathProps) {
  const offsets = assignOffsets(course);

  return (
    <div className="mx-auto flex max-w-2xl flex-col items-center gap-10 px-6 pb-24 pt-8">
      {course.units.map((unit) => (
        <div key={unit.id} className="flex w-full flex-col items-center gap-10">
          <UnitBanner title={unit.title} order={unit.order} />
          <div className="flex flex-col items-center gap-8">
            {unit.skills.map((skill) => (
              <SkillNode
                key={skill.id}
                skill={skill}
                offsetX={offsets.get(skill.id) ?? 0}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}