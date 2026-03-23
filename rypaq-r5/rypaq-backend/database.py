"""
Database Configuration and Session Management
"""

import os
from sqlmodel import SQLModel, Session, create_engine
from typing import Generator

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


def create_db_and_tables():
    """Create all database tables"""
    try:
        SQLModel.metadata.create_all(engine)
        print("✅ Database tables created successfully")
    except Exception as e:
        print(f"⚠️  Database creation warning: {e}")


def get_session() -> Generator[Session, None, None]:
    """Dependency for database session"""
    with Session(engine) as session:
        yield session
