# Frontend — Duolingo Clone

Next.js 16 (App Router) + React 19 + TypeScript + Tailwind CSS v4. Full architecture and API
documentation lives in the [root README](../README.md); this file is just how to run and work on
the frontend.

## Run

The backend must be running first — see [`../Backend/README.md`](../Backend/README.md).

```bash
npm install
npm run dev
```

App: http://localhost:3000

## Configuration

| Variable | Default | Purpose |
| --- | --- | --- |
| `NEXT_PUBLIC_API_URL` | `http://127.0.0.1:8000` | Base URL of the backend API. |

Copy `.env.example` to `.env.local` to override it.

## Layout

| Directory | Responsibility |
| --- | --- |
| `src/app/` | App Router pages: learning path, lesson player, profile, leaderboard. |
| `src/components/` | Presentational components, grouped by feature. |
| `src/hooks/` | Stateful logic — `useSkillTree`, `useLessonPlayer`. |
| `src/services/` | `api.ts`, the single place any network call happens. |
| `src/types/` | Hand-written mirror of the backend Pydantic schemas. |
| `src/lib/` | Shared helpers and config constants. |

Components never call `fetch` directly: they render what a hook gives them, and hooks are the only
callers of `services/api.ts`.

## Scripts

```bash
npm run dev     # dev server
npm run build   # production build
npm run lint    # eslint
npx tsc --noEmit  # typecheck
```
