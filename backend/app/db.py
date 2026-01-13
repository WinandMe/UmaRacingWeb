"""Database connection and session management"""
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session
from app.models.database import Base
from app.models.social import Base as SocialBase
import os

# Support SQLite (development), PostgreSQL (Render), and MySQL (PythonAnywhere)
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./uma_racing.db")

# Auto-detect database type and configure accordingly
if DATABASE_URL.startswith("sqlite"):
    engine = create_engine(
        DATABASE_URL,
        connect_args={"check_same_thread": False},
        echo=False
    )
elif DATABASE_URL.startswith("postgresql"):
    # For PostgreSQL on Render or similar
    engine = create_engine(
        DATABASE_URL,
        pool_size=5,
        max_overflow=10,
        echo=False
    )
elif DATABASE_URL.startswith("mysql"):
    # For MySQL on PythonAnywhere
    engine = create_engine(
        DATABASE_URL,
        pool_size=5,
        max_overflow=10,
        pool_recycle=280,  # Recycle connections before MySQL timeout
        echo=False
    )
else:
    # Fallback to SQLite
    engine = create_engine(
        DATABASE_URL,
        connect_args={"check_same_thread": False},
        echo=False
    )

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def get_db() -> Session:
    """Dependency for getting database session"""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def init_db():
    """Initialize database tables"""
    Base.metadata.create_all(bind=engine)
    SocialBase.metadata.create_all(bind=engine)
