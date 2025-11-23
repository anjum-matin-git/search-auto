"""
SQLAlchemy base configuration and session management.
"""
from typing import Generator
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session

from core.config import settings

# Create engine
engine = create_engine(
    settings.database_url,
    echo=settings.app_env == "development",
    pool_pre_ping=True,
    pool_size=10,
    max_overflow=20,
)

# Session factory
SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine,
)

# Declarative base for models
Base = declarative_base()


def get_db() -> Generator[Session, None, None]:
    """
    Dependency for FastAPI routes to get a database session.
    Automatically closes session after request.
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db() -> None:
    """Initialize database (create tables if they don't exist)."""
    try:
        Base.metadata.create_all(bind=engine)
    except Exception as e:
        # Log but don't crash - DB might not be accessible yet
        import structlog
        logger = structlog.get_logger()
        logger.warning("database_init_failed", error=str(e))
        # Continue running - API endpoints will fail gracefully if DB is down
