from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from config import settings
import os

# Handle Railway's PostgreSQL URL format
database_url = settings.database_url

# Railway PostgreSQL URLs sometimes need adjustment for SQLAlchemy
if database_url.startswith("postgres://"):
    # Convert postgres:// to postgresql:// for SQLAlchemy compatibility
    database_url = database_url.replace("postgres://", "postgresql://", 1)

print(f"🔗 Connecting to database: {database_url[:50]}...")

# Create database engine
if database_url.startswith("sqlite"):
    engine = create_engine(
        database_url,
        connect_args={"check_same_thread": False}
    )
else:
    # PostgreSQL connection with connection pooling
    engine = create_engine(
        database_url,
        pool_pre_ping=True,
        pool_recycle=300,
        connect_args={
            "connect_timeout": 60,
            "application_name": "petrotreatment-ops"
        }
    )

# Create session factory
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Create base class for models
Base = declarative_base()


def get_db():
    """Dependency to get database session"""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()