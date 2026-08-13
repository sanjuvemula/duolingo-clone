from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.database.base import Base
from app.database.connection import SessionLocal, engine
from app.models import models  # noqa: F401
from app.routes import (
    courses_routes,
    exercises_routes,
    leaderboard_routes,
    lessons_routes,
    users_routes,
)
from app.services import achievement_service

app = FastAPI(title="Duolingo Clone API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(users_routes.router)
app.include_router(courses_routes.router)
app.include_router(lessons_routes.router)
app.include_router(exercises_routes.router)
app.include_router(leaderboard_routes.router)


@app.on_event("startup")
def on_startup() -> None:
    Base.metadata.create_all(bind=engine)

    # Sync the achievement catalog from code into the DB. Done here rather
    # than in the seed script so the badge list stays correct even on a
    # database that was seeded before a badge was added.
    db = SessionLocal()
    try:
        achievement_service.ensure_catalog(db)
    finally:
        db.close()


@app.get("/")
def root():
    return {"status": "ok", "service": "duolingo-clone-api"}


@app.get("/health")
def health():
    return {"status": "healthy"}