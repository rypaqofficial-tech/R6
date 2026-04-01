"""
Database Configuration and Session Management
"""

import os
from typing import Generator

from sqlalchemy import text
from sqlmodel import SQLModel, Session, create_engine

# Get database URL from environment or use default SQLite
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./rypaq_r1.db")

# Create engine with proper configuration
if "sqlite" in DATABASE_URL:
    engine = create_engine(
        DATABASE_URL,
        echo=False,
        connect_args={"check_same_thread": False}
    )
else:
    engine = create_engine(
        DATABASE_URL,
        echo=False,
        pool_pre_ping=True,
        pool_recycle=3600
    )


def _sqlite_add_column_if_missing(table: str, column: str, ddl_suffix: str) -> None:
    with engine.connect() as conn:
        rows = conn.execute(text(f"PRAGMA table_info({table})")).fetchall()
        existing = {r[1] for r in rows}
        if column not in existing:
            conn.execute(text(f"ALTER TABLE {table} ADD COLUMN {column} {ddl_suffix}"))
            conn.commit()


def run_sqlite_migrations():
    """Lightweight ALTERs for existing SQLite files (create_all does not migrate)."""
    if "sqlite" not in DATABASE_URL:
        return
    try:
        _sqlite_add_column_if_missing("user", "hashed_password", "VARCHAR")
        _sqlite_add_column_if_missing("user", "google_sub", "VARCHAR")
        _sqlite_add_column_if_missing("user", "email_verified", "BOOLEAN DEFAULT 0")
        _sqlite_add_column_if_missing("user", "verification_token", "VARCHAR")
        _sqlite_add_column_if_missing("user", "reset_token_hash", "VARCHAR")
        _sqlite_add_column_if_missing("user", "reset_token_expires", "DATETIME")
        _sqlite_add_column_if_missing("user", "is_demo", "BOOLEAN DEFAULT 0")
    except Exception as e:
        print(f"⚠️  SQLite migration note: {e}")


def create_db_and_tables():
    """Create all database tables"""
    try:
        SQLModel.metadata.create_all(engine)
        run_sqlite_migrations()
        print("✅ Database tables created successfully")
    except Exception as e:
        print(f"⚠️  Database creation warning: {e}")


def get_session() -> Generator[Session, None, None]:
    """Dependency for database session"""
    with Session(engine) as session:
        yield session
