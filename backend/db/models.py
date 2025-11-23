"""
SQLAlchemy database models with pgvector support.
"""
from datetime import datetime
from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, Text, JSON, ForeignKey
from sqlalchemy.dialects.postgresql import ARRAY
from sqlalchemy.orm import relationship
from pgvector.sqlalchemy import Vector

from .base import Base


class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True)
    username = Column(String, unique=True, nullable=False)
    email = Column(String, unique=True, nullable=False)
    password = Column(String, nullable=False)
    location = Column(String)
    postal_code = Column(String)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Stripe integration
    stripe_customer_id = Column(String, unique=True)
    
    # Credit system
    credits_remaining = Column(Integer, default=3)  # Free tier: 3 searches
    unlimited_searches = Column(Boolean, default=False)  # Pro plan
    
    # Relationships
    searches = relationship("Search", back_populates="user")
    subscription = relationship("UserSubscription", back_populates="user", uselist=False)
    preferences = relationship("UserPreference", back_populates="user", uselist=False)


class Plan(Base):
    __tablename__ = "plans"
    
    id = Column(Integer, primary_key=True)
    name = Column(String, nullable=False)  # Personal, Pro, Premium
    price = Column(Float, nullable=False)
    credits = Column(Integer)  # NULL for unlimited (Pro/Premium)
    stripe_price_id = Column(String, unique=True)
    active = Column(Boolean, default=True)
    features = Column(JSON)  # Store plan features as JSON
    created_at = Column(DateTime, default=datetime.utcnow)


class UserSubscription(Base):
    __tablename__ = "user_subscriptions"
    
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True)
    plan_id = Column(Integer, ForeignKey("plans.id"))
    
    stripe_subscription_id = Column(String, unique=True)
    status = Column(String)  # active, canceled, past_due, etc.
    
    current_period_start = Column(DateTime)
    current_period_end = Column(DateTime)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    user = relationship("User", back_populates="subscription")
    plan = relationship("Plan")


class Car(Base):
    __tablename__ = "cars"
    
    id = Column(Integer, primary_key=True)
    source = Column(String, nullable=False)
    url = Column(String)
    
    brand = Column(String)
    model = Column(String)
    year = Column(Integer)
    price = Column(Float)
    mileage = Column(Integer)
    location = Column(String)
    
    acceleration = Column(Float)
    top_speed = Column(Integer)
    power = Column(Integer)
    mpg = Column(Float)
    
    features = Column(ARRAY(String))
    images = Column(ARRAY(String))
    description = Column(Text)
    
    embedding = Column(Vector(1536))
    
    active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)


class Search(Base):
    __tablename__ = "searches"
    
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    
    query = Column(Text, nullable=False)
    extracted_features = Column(JSON)
    query_embedding = Column(Vector(1536))
    
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    user = relationship("User", back_populates="searches")
    results = relationship("SearchResult", back_populates="search")


class SearchResult(Base):
    __tablename__ = "search_results"
    
    id = Column(Integer, primary_key=True)
    search_id = Column(Integer, ForeignKey("searches.id"))
    car_id = Column(Integer, ForeignKey("cars.id"))
    
    match_score = Column(Float)
    rank = Column(Integer)
    
    # Relationships
    search = relationship("Search", back_populates="results")
    car = relationship("Car")


class UserPreference(Base):
    __tablename__ = "user_preferences"
    
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True)
    
    preference_embedding = Column(Vector(1536))
    preferences = Column(JSON)
    
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    user = relationship("User", back_populates="preferences")
