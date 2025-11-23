"""
SQLAlchemy ORM models with pgvector support.
Clear, documented models matching the TypeScript schema.
"""
from datetime import datetime
from typing import Optional

from sqlalchemy import (
    Column,
    Integer,
    String,
    Text,
    Float,
    Boolean,
    DateTime,
    ForeignKey,
    JSON,
    ARRAY,
)
from sqlalchemy.orm import relationship
from pgvector.sqlalchemy import Vector

from .base import Base


class User(Base):
    """User model for authentication and preferences."""
    
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(255), unique=True, nullable=False, index=True)
    email = Column(String(255), unique=True, nullable=False, index=True)
    password = Column(String(255), nullable=False)
    location = Column(String(255), nullable=True)
    postal_code = Column(String(20), nullable=True)
    initial_preferences = Column(JSON, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    
    # Relationships
    searches = relationship("Search", back_populates="user", cascade="all, delete-orphan")
    preferences = relationship("UserPreference", back_populates="user", uselist=False, cascade="all, delete-orphan")


class Car(Base):
    """Car model with vector embeddings for semantic search."""
    
    __tablename__ = "cars"
    
    id = Column(Integer, primary_key=True, index=True)
    brand = Column(String(100), nullable=False, index=True)
    model = Column(String(100), nullable=False, index=True)
    year = Column(Integer, nullable=False, index=True)
    price = Column(Integer, nullable=True)
    mileage = Column(Integer, nullable=True)
    location = Column(String(255), nullable=True, index=True)
    type = Column(String(50), nullable=True, index=True)
    source = Column(String(100), nullable=True)
    url = Column(Text, nullable=True)
    description = Column(Text, nullable=True)
    
    # Performance specs
    acceleration = Column(Float, nullable=True)
    top_speed = Column(Float, nullable=True)
    power = Column(Float, nullable=True)
    mpg = Column(Float, nullable=True)
    
    # Arrays
    features = Column(ARRAY(String), nullable=True)
    images = Column(ARRAY(String), nullable=True)
    
    # Vector embedding for semantic search (1536 dimensions for text-embedding-3-small)
    embedding = Column(Vector(1536), nullable=True)
    
    # Status
    active = Column(Boolean, default=True, nullable=False, index=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    
    # Relationships
    search_results = relationship("SearchResult", back_populates="car", cascade="all, delete-orphan")


class Search(Base):
    """Search history with user query and extracted features."""
    
    __tablename__ = "searches"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    query = Column(Text, nullable=False)
    filters = Column(JSON, nullable=True)
    embedding = Column(Vector(1536), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)
    
    # Relationships
    user = relationship("User", back_populates="searches")
    results = relationship("SearchResult", back_populates="search", cascade="all, delete-orphan")


class SearchResult(Base):
    """Many-to-many join table linking searches to cars with ranking."""
    
    __tablename__ = "search_results"
    
    id = Column(Integer, primary_key=True, index=True)
    search_id = Column(Integer, ForeignKey("searches.id", ondelete="CASCADE"), nullable=False, index=True)
    car_id = Column(Integer, ForeignKey("cars.id", ondelete="CASCADE"), nullable=False, index=True)
    match_score = Column(Float, nullable=False)
    rank = Column(Integer, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    
    # Relationships
    search = relationship("Search", back_populates="results")
    car = relationship("Car", back_populates="search_results")


class UserPreference(Base):
    """Learned user preferences based on search history."""
    
    __tablename__ = "user_preferences"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False, index=True)
    preferred_brands = Column(ARRAY(String), nullable=True)
    preferred_types = Column(ARRAY(String), nullable=True)
    price_range_min = Column(Integer, nullable=True)
    price_range_max = Column(Integer, nullable=True)
    preferred_features = Column(ARRAY(String), nullable=True)
    preference_embedding = Column(Vector(1536), nullable=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    
    # Relationships
    user = relationship("User", back_populates="preferences")
