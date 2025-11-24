"""
Database initialization script.
Creates tables and enables pgvector extension.
"""
from sqlalchemy import text

from db.base import engine, Base
from db.models import User, Car, Search, SearchResult, UserPreference
from core.logging import get_logger

logger = get_logger(__name__)


def init_database():
    """Initialize database tables and extensions."""
    logger.info("database_init_start")
    
    with engine.connect() as conn:
        try:
            conn.execute(text("CREATE EXTENSION IF NOT EXISTS vector"))
            conn.commit()
            logger.info("pgvector_extension_enabled")
        except Exception as exc:
            conn.rollback()
            logger.warning("pgvector_extension_unavailable", error=str(exc))
    
    Base.metadata.create_all(bind=engine)
    logger.info("database_tables_created")
    
    logger.info("database_init_complete")


if __name__ == "__main__":
    init_database()
