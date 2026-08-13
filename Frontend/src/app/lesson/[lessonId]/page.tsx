import { LessonPlayerScreen } from "@/components/lesson/LessonPlayerScreen";

/** Server component so it can `await props.params` per Next.js 15+'s async
 * params contract (see Frontend/AGENTS.md — this Next.js version differs
 * from older training data here; params/searchParams are Promises now).
 * `PageProps<'/lesson/[lessonId]'>` is the generated global helper the
 * repo already uses for layouts (see app/layout.tsx's `LayoutProps<"/">`).
 *
 * All actual data fetching (the lesson + user) happens client-side inside
 * useLessonPlayer, same pattern as the skill-tree page's useSkillTree —
 * this component's only job is turning the route's string param into a
 * number and handing off to the client component. */
export default async function LessonPage(props: PageProps<"/lesson/[lessonId]">) {
  const { lessonId } = await props.params;
  const parsedLessonId = Number(lessonId);

  if (!Number.isFinite(parsedLessonId)) {
    return (
      <div className="flex flex-1 items-center justify-center px-6 text-center">
        <p className="font-display text-lg font-bold text-ink">
          Invalid lesson id &quot;{lessonId}&quot;
        </p>
      </div>
    );
  }

  return <LessonPlayerScreen lessonId={parsedLessonId} />;
}