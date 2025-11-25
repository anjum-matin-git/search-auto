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
    
    def _serialize_user(self, user) -> dict:
        return {
            "id": user.id,
            "username": user.username,
            "email": user.email,
            "location": user.location,
            "postal_code": user.postal_code,
            "initial_preferences": user.initial_preferences,
            "credits_remaining": user.credits_remaining,
            "unlimited_searches": user.unlimited_searches,
        }
    
    def signup(
        self,
        username: str,
        email: str,
        password: str,
        location: Optional[str] = None,
        postal_code: Optional[str] = None,
        initial_preferences: Optional[dict] = None,
    ) -> dict:
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
            password=hashed_password,
            location=location,
            postal_code=postal_code,
            initial_preferences=initial_preferences,
        )
        
        logger.info("user_created", user_id=user.id, username=username)
        
        # Create UserPreference record if initial_preferences provided
        if initial_preferences:
            from db.repositories import UserPreferenceRepository
            pref_repo = UserPreferenceRepository(self.db)
            pref_repo.create_or_update(
                user_id=user.id,
                preferences=initial_preferences,
                preferred_brands=initial_preferences.get("brands", []),
                preferred_types=initial_preferences.get("types", []),
                price_range_min=initial_preferences.get("price_min"),
                price_range_max=initial_preferences.get("price_max")
            )
        
        return self._serialize_user(user)
    
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
        
        return self._serialize_user(user)
    
    def update_preferences(
        self,
        user_id: int,
        location: Optional[str],
        postal_code: Optional[str],
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
        
        return self._serialize_user(user)

    def update_profile(
        self,
        user_id: int,
        username: Optional[str] = None,
        email: Optional[str] = None,
        location: Optional[str] = None,
        postal_code: Optional[str] = None,
    ) -> dict:
        """Update basic profile details."""
        user = self.user_repo.get_by_id(user_id)
        
        if username and username != user.username:
            existing_username = self.user_repo.get_by_username(username)
            if existing_username and existing_username.id != user_id:
                raise ValidationException("Username already exists")
            user.username = username
        
        if email and email != user.email:
            existing_email = self.user_repo.get_by_email(email)
            if existing_email and existing_email.id != user_id:
                raise ValidationException("Email already exists")
            user.email = email
        
        if location is not None:
            user.location = location
        if postal_code is not None:
            user.postal_code = postal_code
        
        self.db.commit()
        self.db.refresh(user)
        
        logger.info("profile_updated", user_id=user_id)
        
        return self._serialize_user(user)

    def change_password(
        self,
        user_id: int,
        current_password: str,
        new_password: str
    ) -> None:
        """Change a user's password after verifying the current password."""
        user = self.user_repo.get_by_id(user_id)
        
        if not self.verify_password(current_password, user.password):
            raise AuthenticationException("Current password is incorrect")
        
        user.password = self.hash_password(new_password)
        self.db.commit()
        logger.info("password_changed", user_id=user_id)
