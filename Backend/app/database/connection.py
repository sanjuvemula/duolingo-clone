"""
Database engine and session factory.

The database URL is read from the DATABASE_URL environment variable so a
deployment can point SQLite at a mounted persistent disk (e.g.
sqlite:////var/data/duolingo.db on Render) without a code change. The default
is the local relative path, which is why the app and the seed script both have
to be run from the Backend/ directory.

Note the four slashes in an absolute SQLite URL: sqlite:// is the scheme and
/var/data/... is the absolute path, so they concatenate to sqlite:////var/...
Three slashes means a *relative* path. This trips people up constantly and is
the difference between a working deploy and an empty database.
"""

import os

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

SQLALCHEMY_DATABASE_URL = os.environ.get("DATABASE_URL", "sqlite:///./duolingo.db")

engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    # check_same_thread is a SQLite-only guard against cross-thread reuse of a
    # connection. FastAPI serves requests from a thread pool, and each request
    # gets its own session via get_db, so the guard is safe to disable here.
    connect_args={"check_same_thread": False} if SQLALCHEMY_DATABASE_URL.startswith("sqlite") else {},
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
