# Backend — Duolingo Clone API

FastAPI + SQLAlchemy + SQLite. Full architecture, schema and API documentation lives in the
[root README](../README.md); this file is just how to run and work on the backend.

## Run

All commands from this directory — the database URL is the relative path `sqlite:///./duolingo.db`,
so the working directory matters.

```bash
python -m venv venv
venv\Scripts\activate          # macOS/Linux: source venv/bin/activate
pip install -r requirements.txt
python seed/seed_data.py
uvicorn app.main:app --reload
```

Interactive API docs: http://127.0.0.1:8000/docs

## Re-seeding

```bash
python seed/seed_data.py
```

Safe to re-run at any time. It drops and recreates every table, so it is also how a model change
gets applied — there is no migration tool in this project.

## Layout

| Directory | Responsibility |
| --- | --- |
| `app/routes/` | HTTP surface: paths, methods, response models. No logic. |
| `app/controllers/` | Per-request orchestration; owns the transaction boundary. |
| `app/services/` | Business rules: answer checking, XP, hearts, streak, crowns, unlocking. |
| `app/models/` | SQLAlchemy ORM tables. |
| `app/schemas/` | Pydantic request/response shapes. |
| `app/middleware/` | Cross-cutting request concerns (resolving the acting user). |
| `app/database/` | Engine, session factory, declarative base. |
| `seed/` | Demo data generator. |
