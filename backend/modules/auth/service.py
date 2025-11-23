"""
Authentication service with password hashing and user management.
"""
from typing import Optional
from passlib.context import CryptContext
from sqlalchemy.orm import Session

from db.repositories import UserRepository
from core.exceptions import AuthenticationException, ValidationException
from core.logging import get_logger

logger = get_logger(__name__)

pwd_context = CryptContext(schemes=["argon2"], deprecated="auto")


class AuthService:
    """Service for authentication operations."""
    
    def __init__(self, db: Session):
        self.db = db
        self.user_repo = UserRepository(db)
    
    def hash_password(self, password: str) -> str:
        """Hash a password using argon2."""
        return pwd_context.hash(password)
    
    def verify_password(self, plain_password: str, hashed_password: str) -> bool:
        """Verify a password against its hash."""
        return pwd_context.verify(plain_password, hashed_password)
    
    def signup(self, username: str, email: str, password: str) -> dict:
        """
        Create a new user account.
        
        Args:
            username: Unique username
            email: Unique email
            password: Plain text password (will be hashed)
        
        Returns:
            User data dict
        
        Raises:
            ValidationException: If username/email already exists
        """
        if self.user_repo.get_by_username(username):
            raise ValidationException("Username already exists")
        
        if self.user_repo.get_by_email(email):
            raise ValidationException("Email already exists")
        
        hashed_password = self.hash_password(password)
        
        user = self.user_repo.create(
            username=username,
            email=email,
            password=hashed_password
        )
        
        logger.info("user_created", user_id=user.id, username=username)
        
        return {
            "id": user.id,
            "username": user.username,
            "email": user.email,
        }
    
    def login(self, username: str, password: str) -> dict:
        """
        Authenticate a user.
        
        Args:
            username: Username or email
            password: Plain text password
        
        Returns:
            User data dict
        
        Raises:
            AuthenticationException: If credentials are invalid
        """
        user = self.user_repo.get_by_email(username)
        
        if not user or not self.verify_password(password, user.password):
            logger.warning("login_failed", username=username)
            raise AuthenticationException("Invalid username or password")
        
        logger.info("login_success", user_id=user.id, username=username)
        
        return {
            "id": user.id,
            "username": user.username,
            "email": user.email,
            "location": user.location,
            "postal_code": user.postal_code,
            "credits_remaining": user.credits_remaining,
        }
    
    def update_preferences(
        self,
        user_id: int,
        location: str,
        postal_code: str,
        initial_preferences: dict
    ) -> dict:
        """
        Update user location and preferences.
        
        Args:
            user_id: User ID
            location: User location
            postal_code: Postal/ZIP code
            initial_preferences: Initial preference data
        
        Returns:
            Updated user data
        """
        user = self.user_repo.update_preferences(
            user_id=user_id,
            location=location,
            postal_code=postal_code,
            initial_preferences=initial_preferences
        )
        
        logger.info("preferences_updated", user_id=user_id)
        
        return {
            "id": user.id,
            "username": user.username,
            "email": user.email,
            "location": user.location,
            "postal_code": user.postal_code,
            "initial_preferences": user.initial_preferences,
        }
