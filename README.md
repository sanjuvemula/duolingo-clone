# Duolingo Clone

A functional clone of the Duolingo web app: a learner moves through a skill tree, plays lessons
made of interactive exercises, earns XP, keeps a streak, loses and regains hearts, and has all of
that progress persisted server-side.

The course content is deliberately small (one seeded Korean course), because the point of the
project is the lesson loop and the gamification mechanics rather than breadth of content.

---

## Tech Stack

| Layer | Choice |
| --- | --- |
| Frontend | Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS v4 |
| Backend | Python 3.11, FastAPI, SQLAlchemy 2.0, Pydantic v2 |
| Database | SQLite |

---

## Setup

Two processes: the API on port 8000 and the web app on port 3000. Start the backend first — the
frontend has nothing to render without it.

### Backend

Run everything from `Backend/`. The database URL defaults to the relative path
`sqlite:///./duolingo.db`, so the working directory matters. Set `DATABASE_URL` to override it.

```bash
cd Backend
python -m venv venv
venv\Scripts\activate          # macOS/Linux: source venv/bin/activate
pip install -r requirements.txt
python seed/seed_data.py
uvicorn app.main:app --reload
```

`python seed/seed_data.py` is required, not optional — `duolingo.db` is gitignored, so a fresh
clone has no database at all until you run it. It is safe to re-run at any time; it drops and
rebuilds every table, which is also how schema changes get applied (there is no migration tool).

API docs are then at http://127.0.0.1:8000/docs.

### Frontend

```bash
cd Frontend
npm install
npm run dev
```

The app is at http://localhost:3000. It reads the API base URL from `NEXT_PUBLIC_API_URL`; copy
`.env.example` to `.env.local` to change it from the `http://127.0.0.1:8000` default.

---

## Deployment

Both services read their environment-specific settings from environment variables, so no code
changes are needed to deploy.

| Variable | Service | Purpose |
| --- | --- | --- |
| `DATABASE_URL` | Backend | Where SQLite lives. Must point at a *persistent* path in production. |
| `CORS_ORIGINS` | Backend | Comma-separated browser origins to allow, in addition to localhost. Set this to the deployed frontend URL. |
| `NEXT_PUBLIC_API_URL` | Frontend | Base URL of the deployed API. |

**Backend (Render).** `Backend/render.yaml` is a ready blueprint — point Render at the repo with
`rootDir` set to `Backend`. The critical part is the mounted disk:

- Render's filesystem is ephemeral. Without a disk, `duolingo.db` is recreated empty on every
  deploy *and* every container restart, so all learner progress disappears. The blueprint mounts a
  1 GB disk at `/var/data` and sets `DATABASE_URL=sqlite:////var/data/duolingo.db`, which is what
  keeps SQLite viable in production and lets the project meet the brief's "use SQLite" requirement
  without switching to Postgres.
- Note the **four** slashes: `sqlite://` (scheme) + `/var/data/…` (absolute path). Three slashes
  means a relative path and silently gives you a different, ephemeral database.
- The start command runs `python seed/seed_data.py --if-stale` before uvicorn. See below.

**Schema changes without a migration tool.** There is no Alembic here, and SQLite cannot add a
column to an existing table via `create_all`. That leaves a real problem for a deployment with a
persistent disk: shipping a release that adds a column would leave the old database in place and
every request would fail with `no such column`. Simply reseeding on every boot is not an option
either, since containers restart for reasons unrelated to a release.

`--if-stale` resolves it with a version stamp. `seed_data.CONTENT_VERSION` is written into
`app_meta` at seed time and compared at boot:

| Stored version | Action |
| --- | --- |
| matches `CONTENT_VERSION` | Skip. This is every ordinary restart. |
| differs | Rebuild once, then stamp the new version. |
| absent, database empty | Seed. This is a fresh disk on first deploy. |
| absent, database has content | Rebuild. A disk seeded before `app_meta` existed. |

So **bump `CONTENT_VERSION` whenever the schema or the seed content changes**, and the next deploy
repairs itself. The stamp is written inside the same transaction as the content it describes, so a
seed that fails halfway rolls back and the next boot retries rather than trusting a half-built
database.

This is only acceptable because every row here is demo data the seed script itself authored —
there is no learner-authored content to lose. A production app would run migrations instead.

**Frontend (Vercel).** Import the repo with the root directory set to `Frontend`, and set
`NEXT_PUBLIC_API_URL` to the deployed backend URL.

**Order matters.** Deploy the backend first to get its URL, set `NEXT_PUBLIC_API_URL` on the
frontend, then set `CORS_ORIGINS` on the backend to the frontend's URL. Skipping that last step
is the usual cause of a deployed app where every request fails with an opaque CORS error.

---

## Architecture

### Backend — layered, one responsibility per layer

```
routes/       HTTP surface: paths, methods, response models. No logic.
controllers/  Per-request orchestration: fetch rows, call a service, shape the response,
              own the transaction boundary (commit).
services/     Business rules: answer checking, XP/hearts maths, streak, crowns, unlocking.
              Pure-ish — operates on ORM objects, generally does not commit.
models/       SQLAlchemy ORM tables.
schemas/      Pydantic request/response shapes — the API contract.
middleware/   Cross-cutting request concerns (currently: resolving the acting user).
database/     Engine, session factory, declarative base.
seed/         Demo data generator.
```

The split exists so the gamification rules live in exactly one place. `exercise_service` is the
only code that awards XP or removes a heart; `progress_service` is the only code that grants a
crown or unlocks a skill. A route never touches those rules directly.

Transactions are owned by controllers rather than services, so a service can be composed into a
larger transaction later without having already committed half of it.

### Frontend — data flows one way

```
app/            App Router pages (path, lesson, practice, profile, leaderboard, shop,
                quests, settings).
components/     Presentational, grouped by feature (layout, learning-path, lesson, gamification).
hooks/          Stateful logic: useSkillTree, useLessonPlayer (a small status machine).
services/api.ts The single place any network call happens.
types/api.ts    Hand-written mirror of the backend Pydantic schemas.
lib/            Shared helpers and config constants.
```

Components never call `fetch` themselves. They render what a hook gives them, and hooks are the
only callers of `services/api.ts`. `useLessonPlayer` holds the whole lesson as an explicit status
machine (`loading → playing → complete | failed | no-hearts`), which keeps the player component a
pure render of that state.

**Answers are never sent to the browser.** `ExercisePublic` deliberately omits `correct_answer`,
so it cannot be read out of the network tab. Checking happens server-side in
`POST /exercises/{id}/submit`.

---

## Database Schema

```
courses
  └── units            (course_id → courses.id)
        └── skills     (unit_id → units.id)
              └── lessons    (skill_id → skills.id)
                    └── exercises  (lesson_id → lessons.id)

users
  ├── user_progress      (user_id → users.id, skill_id → skills.id)
  └── user_achievements  (user_id → users.id, achievement_id → achievements.id)

achievements             (catalog, no parent)
app_meta                 (key/value facts about the database itself)
```

| Table | Columns |
| --- | --- |
| `users` | `id`, `name`, `email` (unique), `xp_total`, `xp_today`, `xp_today_date`, `week_xp`, `week_start`, `league`, `hearts`, `streak`, `last_active_date`, `hearts_updated_at`, `gems`, `avatar_color`, `created_at`, `top_3_finishes` |
| `courses` | `id`, `title`, `language` |
| `units` | `id`, `title`, `order`, `course_id` |
| `skills` | `id`, `title`, `order`, `icon`, `unit_id` |
| `lessons` | `id`, `title`, `order`, `skill_id` |
| `exercises` | `id`, `lesson_id`, `type`, `question`, `options` (JSON), `correct_answer` (JSON), `order` |
| `user_progress` | `id`, `user_id`, `skill_id`, `status`, `crowns` |
| `achievements` | `id`, `code` (unique), `title`, `description`, `icon` |
| `user_achievements` | `id`, `user_id`, `achievement_id`, `earned_at` |
| `app_meta` | `key` (PK), `value` |

**Exercise types.** `exercises.type` is one of five, and the shape of `options` /
`correct_answer` depends on it:

| Type | `options` | `correct_answer` | UI |
| --- | --- | --- | --- |
| `multiple_choice` | list of strings | the correct string | Tap one of four choices |
| `word_bank` | list of word tiles | the full sentence | Tap words in order to build a sentence |
| `match` | list of `[korean, english]` pairs | the same pairs | Connect pairs across two columns |
| `fill_blank` | list of strings | the correct string | Sentence with a gap; tap a word to fill it |
| `type_answer` | `null` | the correct string | Free-text input |

**Design decisions worth calling out:**

- **`user_progress` is the join between a learner and the content tree.** Content tables hold no
  per-user state, so the same seeded course serves every user. `status` is
  `locked | available | completed` and `crowns` counts completed lessons within that skill.
- **`exercises.options` and `correct_answer` are JSON columns, not normalized child tables.**
  Their shape depends on `type`: multiple choice needs a list of strings, match needs a list of
  pairs, type-the-answer needs neither. A normalized `exercise_options` table would have to model
  all those shapes at once, and nothing in the app ever queries *across* options — they are always
  read as a whole with their exercise. JSON keeps the read path a single row.
- **The achievement catalog lives in code, not seed data.** Each entry in
  `achievement_service.ACHIEVEMENTS` pairs a badge's text with the predicate that earns it;
  `ensure_catalog()` upserts that list into the `achievements` table at startup. Splitting the two
  apart — rows in a seed file, `if` statements in a service — is how they drift. A row in
  `user_achievements` is the fact of record that a badge was earned, so `earned_at` is real
  rather than recomputed.
- **Three timestamps on `users`, on purpose.** `last_active_date` means "the calendar day the
  learner was last active" and drives streak maths; `hearts_updated_at` means "when the heart
  count last changed" and drives regeneration; `xp_today_date` means "the day the `xp_today`
  tally belongs to" and lets the daily goal reset itself on read. One column cannot carry all
  three meanings without corrupting the others.
- **Daily XP is stored beside the day it counts for.** Rather than a scheduled job clearing
  `xp_today` at midnight, a read compares `xp_today_date` against today and reports 0 if it is
  stale. Same lazy-rollover idea as heart regeneration, and for the same reason: no scheduler.
- **`skills.icon` and `users.avatar_color` store token *names*, not URLs or hex codes.** `"food"`,
  `"blue"` — the frontend maps them to an inline SVG and a CSS variable respectively. Storing the
  rendered value instead would freeze it: a hex avatar colour picked in light mode would stay that
  hex in dark mode, and an icon URL would need an asset pipeline and could 404. Both have a
  fallback for unknown values, so bad data degrades to a default rather than an empty node. The
  colour is additionally allow-listed server-side, since the value ends up in a `style` attribute.
- **`app_meta` versions the database, not the learner.** It holds one row — `content_version` —
  written at seed time and compared at boot. It is a table rather than a file so the version
  travels with the data it describes if the database is ever moved or restored. See
  [Deployment](#deployment) for why this exists at all.

---

## API Overview

Every endpoint that acts on behalf of a learner takes a `user_id` query parameter. See
[Assumptions](#assumptions) — this stands in for authentication.

| Method | Path | Purpose |
| --- | --- | --- |
| `GET` | `/health` | Liveness check. |
| `GET` | `/users/{user_id}` | Learner state: XP, hearts, streak, gems, daily-goal progress, the heart-regen countdown, and profile detail (join date, league, top-3 finishes). Applies pending heart regeneration as a side effect. |
| `PATCH` | `/users/{user_id}` | Edit display name and/or avatar colour. Partial body — send only what changed. Returns the full refreshed user. `400` for a blank name, an unknown colour, or an empty body. |
| `POST` | `/users/{user_id}/hearts/refill` | Spend gems to restore hearts to full. `400` if already full or too few gems. |
| `GET` | `/users/{user_id}/achievements` | Full badge catalog with this learner's earned state merged in — locked badges included, so the profile can show them as goals. |
| `GET` | `/practice?user_id=` | A shuffled set of exercises drawn from every skill the learner has unlocked, plus the round's duration. |
| `POST` | `/practice/{exercise_id}/submit?user_id=` | Check a practice answer. Awards XP; deliberately never costs a heart. |
| `GET` | `/courses/{course_id}/skill-tree?user_id=` | The whole tree — units, skills, and this learner's per-skill status and crowns merged in. |
| `GET` | `/lessons/{lesson_id}` | A lesson with its exercises, **without** correct answers. |
| `POST` | `/exercises/{exercise_id}/submit?user_id=` | Check one answer. Awards XP or removes a heart, and reports whether the lesson has now failed. |
| `POST` | `/lessons/{lesson_id}/complete?user_id=` | Finalize a lesson: grant a crown, complete/unlock skills, advance the streak. |
| `GET` | `/leaderboard?user_id=` | Standings for the caller's league, ranked by this week's XP, with each row's promotion/relegation zone and the caller's own row flagged. |

### Gamification rules

- **XP** — 10 per correct answer, added to both `users.xp_total` and today's daily-goal tally.
- **Daily goal** — 50 XP per day (one clean lesson). The tally rolls over lazily on read, so no
  scheduled job is needed to clear it at midnight.
- **Hearts** — start at 5, one lost per wrong answer, floored at 0. At 0 the lesson fails.
- **Heart regeneration** — one heart per 10 minutes, applied lazily: nothing runs on a timer, and
  any read of the user credits whatever the elapsed wall-clock time has earned. This keeps the
  backend a single stateless process with no scheduler to deploy. The interval is shortened from
  Duolingo's ~4 hours so the behavior is observable during a review.
- **Heart refill** — 350 gems restores all 5 hearts.
- **Crowns** — one per completed lesson within a skill. When crowns reach the skill's lesson
  count the skill becomes `completed` and the next skill in course order unlocks.
- **Streak** — advances at most once per calendar day, on lesson completion. Same day is a no-op,
  the next day increments, and any larger gap resets it to 1.
- **Weekly leagues** — the leaderboard ranks learners by XP earned *this week* within a league
  tier, not by lifetime XP. A lifetime board is unwinnable: an early user builds a lead nobody can
  close, so it stops motivating anyone. Top 3 are promoted, bottom 2 relegated, and the week
  resets Monday 00:00 UTC. `users.league` is stored rather than derived from XP, because promotion
  happens at the week boundary — a learner stays in their league all week even once their XP would
  place them elsewhere.
- **Timed practice** — a 60-second round drawn from every unlocked skill. Wrong answers cost no
  hearts: hearts exist to make *lessons* consequential, and draining them here would punish the
  learner for choosing to revise. The pressure is the clock instead. XP is real and flows through
  the same `add_xp`, so a practice round counts toward the daily goal and the weekly league.
- **Achievements** — eight badges across XP, streak, crown and skill-completion milestones.
  Evaluated after a lesson completes, once crowns, status and streak have all been updated, so a
  badge earned *by* that lesson is caught on the same request. Also evaluated on read, so adding a
  new badge grants it retroactively to learners who already meet its condition.

---

## Seeded Data

`python seed/seed_data.py` creates:

- One Korean course: **4 units, 16 skills, 32 lessons, 160 exercises** — 4 skills per unit, 2
  lessons per skill, 5 exercises per lesson. Every lesson contains one of each of the five
  exercise types, so the player hits all five code paths every time. Each skill also carries an
  `icon` key, giving the path 16 distinct illustrations rather than 16 identical circles.
- **Demo User** (`id=1`) — the learner the app runs as. Seeded mid-course rather than empty:
  140 XP, a 3-day streak, 4 of 5 hearts, 500 gems, 30/50 XP toward today's goal, with *Greetings*
  completed, *Numbers* half done, and the rest locked. That renders a completed, an available and
  several locked nodes on first load, plus a partly-filled crown ring and daily goal. The join date
  is backdated ~3 months and 2 top-3 finishes are seeded, so the profile reads as a real history
  rather than "joined today".
- Seven rivals sharing the demo learner's Gold League, with weekly XP chosen so the learner lands
  4th of 8 — just outside the promotion zone, which puts both the promotion and relegation bands
  on screen at once.

Course content is declared as a plain data structure at the top of `seed/seed_data.py` and
expanded into rows by `build_course()`, so adding a lesson is a dict entry rather than a block of
ORM constructor calls.

---

## Assumptions

- **No authentication.** The app runs as a single default learner (`CURRENT_USER_ID = 1` on the
  frontend), and the backend takes the acting user from a `user_id` query parameter at face
  value — anyone can act as anyone by changing the number. The assignment explicitly permits a
  simplified login, so this is deliberate. It is isolated in
  `app/middleware/current_user.py` as a single seam to replace with real session/JWT auth.
- **Gems and top-3 finishes are mocked in the same way.** Both are real columns that the app reads,
  but nothing increments them. Gems are seeded and only ever spent (on heart refills);
  `top_3_finishes` would be incremented by the weekly promotion job at the league boundary, and
  this project has no scheduler to run one. They are seeded to plausible values so the profile
  isn't showing a permanent zero. Everything else on the profile — streak, XP, league, achievements
  — is earned.
- **The profile follows Duolingo's real layout.** Avatar, name, join date, a mocked
  followers/following row, a Statistics block (day streak, total XP, current league, top-3
  finishes) and then achievements. Followers/following render as `0` rather than invented numbers:
  there is no social graph in this build, and a fake follower count would be the only figure on the
  page that isn't backed by a real column.
- **Nav icons don't use `currentColor`, unlike every other icon in the app.** Duolingo's rail keeps
  each destination's colour whether or not it is the active tab, and that constant colour is most
  of what stops the sidebar reading like an admin panel. They are still theme tokens rather than
  literal hex, so they shift with the palette in dark mode instead of glowing at full saturation.
- **Audio and pronunciation exercises are out of scope**, as the brief allows.
- **One course only.** The schema supports many, but only Korean is seeded.
- **Dark mode is token-only.** Every component reads CSS variables, so the dark theme redefines
  those variables and nothing else changes. It is declared twice on purpose — once under
  `prefers-color-scheme` for someone who has never touched the toggle, once under `[data-theme]`
  for an explicit choice — with the media query guarded by `:not([data-theme="light"])` so
  choosing light on a dark-OS machine actually wins. A pre-paint inline script applies the stored
  choice before first render, avoiding a white flash. Accent *text* uses separate `-strong` tokens
  from the `-dark` bevel shades, because the bevel colours measure about 3.4:1 on a pale tint and
  miss WCAG AA.
- **The guided tour is client-only.** The "Guide" button on the learning path opens a spotlight
  walkthrough of the interface. Whether it has been seen lives in `localStorage`, not on the user
  row: it's a UI preference, not learner progress, so it shouldn't round-trip through the API. The
  step list is filtered to targets actually on screen when it opens, so the tour shortens itself
  on narrow viewports where the right rail is hidden.
- **Navigation mirrors Duolingo's seven items, but only the real ones are real.** LEARN, PRACTICE,
  LEADERBOARDS, SHOP and PROFILE all reach working, server-backed pages. QUESTS and MORE
  (settings) are placeholders. The mobile tab bar drops to five: seven tabs do not fit a 375px
  phone, so QUESTS and MORE stay desktop-only rather than being squeezed in illegibly.
- **The shop is half real, deliberately.** Refilling hearts spends real gems through the existing
  `POST /users/{id}/hearts/refill`, and reuses the same `HeartsRefill` component the learning path
  uses — it already owns the affordability check and the regen countdown. Super, streak freezes
  and gem bundles are marked "SOON", since the brief allows mocked in-app purchases.
- **Profile editing covers name and avatar colour only.** `PATCH /users/{id}` takes a partial body
  and returns the full refreshed user, so the client replaces its cached state rather than merging.
  Email is deliberately read-only: it is the unique key on `users` and there is no auth to verify a
  change of address. XP, hearts and streak are not client-editable at all — they are earned
  server-side, and a profile form that could set them would undermine every gamification rule.
- **Quests are inert copy, not fake progress bars.** Every other number in the app is real and
  server-owned; a bar animating to an invented percentage would be the one place the UI lies about
  state. A real implementation needs a quests table, per-quest progress rows and a daily reset —
  the same lazy-rollover the daily goal already uses.
- **Settings is a placeholder.** `/settings` renders the shape a real settings page would take,
  with every row marked "SOON" and nothing wired to the backend. The brief states a "Coming Soon"
  placeholder is sufficient here. The theme toggle on it is the one part that works.
- **Progress is tracked per skill, not per lesson.** `user_progress.crowns` counts how many
  lessons in a skill are done, not which ones. Replaying a lesson grants another crown until the
  skill is complete. Per-lesson tracking would need its own table.
- **SQLite with no migration tool.** Schema changes are applied by re-running the seed script,
  which drops and recreates every table. Fine for disposable demo data; a real deployment would
  need Alembic. In production the `--if-stale` flag gates that drop behind a version bump, so it
  runs once per content change rather than on every restart — see [Deployment](#deployment).
