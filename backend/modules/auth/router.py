"""
FastAPI router for authentication endpoints.
"""
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from db.base import get_db
from modules.auth.service import AuthService
from modules.auth.schemas import SignupRequest, LoginRequest, UpdatePreferencesRequest, UserResponse

router = APIRouter(prefix="/api/auth", tags=["auth"])


@router.post("/signup", response_model=UserResponse)
def signup(request: SignupRequest, db: Session = Depends(get_db)):
    """Create a new user account."""
    auth_service = AuthService(db)
    user_data = auth_service.signup(
        username=request.username,
        email=request.email,
        password=request.password
    )
    return user_data


@router.post("/login", response_model=UserResponse)
def login(request: LoginRequest, db: Session = Depends(get_db)):
    """Authenticate a user."""
    auth_service = AuthService(db)
    user_data = auth_service.login(
        username=request.username,
        password=request.password
    )
    return user_data


@router.post("/preferences", response_model=UserResponse)
def update_preferences(request: UpdatePreferencesRequest, db: Session = Depends(get_db)):
    """Update user location and preferences."""
    auth_service = AuthService(db)
    user_data = auth_service.update_preferences(
        user_id=request.user_id,
        location=request.location,
        postal_code=request.postal_code,
        initial_preferences=request.initial_preferences
    )
    return user_data
