"""
Repository pattern for clean data access layer.
Separates database operations from business logic.
"""
from typing import List, Optional
from sqlalchemy.orm import Session
from sqlalchemy import desc, func

from .models import User, Car, Search, SearchResult, UserPreference
from core.exceptions import NotFoundException


class UserRepository:
    """Repository for User operations."""
    
    def __init__(self, db: Session):
        self.db = db
    
    def create(self, username: str, email: str, password: str, **kwargs) -> User:
        """Create a new user."""
        user = User(
            username=username,
            email=email,
            password=password,
            **kwargs
        )
        self.db.add(user)
        self.db.commit()
        self.db.refresh(user)
        return user
    
    def get_by_id(self, user_id: int) -> User:
        """Get user by ID."""
        user = self.db.query(User).filter(User.id == user_id).first()
        if not user:
            raise NotFoundException("User", user_id)
        return user
    
    def get_by_username(self, username: str) -> Optional[User]:
        """Get user by username."""
        return self.db.query(User).filter(User.username == username).first()
    
    def get_by_email(self, email: str) -> Optional[User]:
        """Get user by email."""
        return self.db.query(User).filter(User.email == email).first()
    
    def update_preferences(self, user_id: int, location: str, postal_code: str, initial_preferences: dict) -> User:
        """Update user location and initial preferences."""
        user = self.get_by_id(user_id)
        user.location = location
        user.postal_code = postal_code
        user.initial_preferences = initial_preferences
        self.db.commit()
        self.db.refresh(user)
        return user


class CarRepository:
    """Repository for Car operations."""
    
    def __init__(self, db: Session):
        self.db = db
    
    def create(self, **car_data) -> Car:
        """Create a new car listing."""
        car = Car(**car_data)
        self.db.add(car)
        self.db.commit()
        self.db.refresh(car)
        return car
    
    def bulk_create(self, cars_data: List[dict]) -> List[Car]:
        """Create multiple car listings."""
        cars = [Car(**data) for data in cars_data]
        self.db.bulk_save_objects(cars, return_defaults=True)
        self.db.commit()
        return cars
    
    def get_by_id(self, car_id: int) -> Car:
        """Get car by ID."""
        car = self.db.query(Car).filter(Car.id == car_id).first()
        if not car:
            raise NotFoundException("Car", car_id)
        return car
    
    def find_similar(self, embedding: List[float], limit: int = 10) -> List[tuple[Car, float]]:
        """Find cars similar to the given embedding using cosine similarity."""
        results = self.db.query(
            Car,
            Car.embedding.cosine_distance(embedding).label("distance")
        ).filter(
            Car.active == True,
            Car.embedding.isnot(None)
        ).order_by(
            "distance"
        ).limit(limit).all()
        
        return [(car, 1 - distance) for car, distance in results]
    
    def get_active_cars(self, limit: int = 100) -> List[Car]:
        """Get all active cars."""
        return self.db.query(Car).filter(Car.active == True).limit(limit).all()
    
    def get_by_location(self, location: str, limit: int = 10) -> List[Car]:
        """Get cars by location."""
        return self.db.query(Car).filter(
            Car.active == True,
            Car.location.ilike(f"%{location}%")
        ).limit(limit).all()


class SearchRepository:
    """Repository for Search operations."""
    
    def __init__(self, db: Session):
        self.db = db
    
    def create(self, user_id: int, query: str, filters: dict = None, embedding: List[float] = None) -> Search:
        """Create a new search record."""
        search = Search(
            user_id=user_id,
            query=query,
            filters=filters,
            embedding=embedding
        )
        self.db.add(search)
        self.db.commit()
        self.db.refresh(search)
        return search
    
    def get_by_id(self, search_id: int) -> Search:
        """Get search by ID."""
        search = self.db.query(Search).filter(Search.id == search_id).first()
        if not search:
            raise NotFoundException("Search", search_id)
        return search
    
    def get_user_history(self, user_id: int, limit: int = 20) -> List[Search]:
        """Get user's search history."""
        return self.db.query(Search).filter(
            Search.user_id == user_id
        ).order_by(
            desc(Search.created_at)
        ).limit(limit).all()


class SearchResultRepository:
    """Repository for SearchResult operations."""
    
    def __init__(self, db: Session):
        self.db = db
    
    def create(self, search_id: int, car_id: int, match_score: float, rank: int) -> SearchResult:
        """Create a search result."""
        result = SearchResult(
            search_id=search_id,
            car_id=car_id,
            match_score=match_score,
            rank=rank
        )
        self.db.add(result)
        self.db.commit()
        self.db.refresh(result)
        return result
    
    def bulk_create(self, results_data: List[dict]) -> List[SearchResult]:
        """Create multiple search results."""
        results = [SearchResult(**data) for data in results_data]
        self.db.bulk_save_objects(results, return_defaults=True)
        self.db.commit()
        return results
    
    def get_by_search(self, search_id: int) -> List[SearchResult]:
        """Get all results for a search."""
        return self.db.query(SearchResult).filter(
            SearchResult.search_id == search_id
        ).order_by(
            SearchResult.rank
        ).all()


class UserPreferenceRepository:
    """Repository for UserPreference operations."""
    
    def __init__(self, db: Session):
        self.db = db
    
    def create_or_update(self, user_id: int, **preference_data) -> UserPreference:
        """Create or update user preferences."""
        preference = self.db.query(UserPreference).filter(
            UserPreference.user_id == user_id
        ).first()
        
        if preference:
            for key, value in preference_data.items():
                setattr(preference, key, value)
        else:
            preference = UserPreference(user_id=user_id, **preference_data)
            self.db.add(preference)
        
        self.db.commit()
        self.db.refresh(preference)
        return preference
    
    def get_by_user(self, user_id: int) -> Optional[UserPreference]:
        """Get user preferences."""
        return self.db.query(UserPreference).filter(
            UserPreference.user_id == user_id
        ).first()
