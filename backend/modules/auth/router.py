"""
FastAPI router for authentication endpoints.
"""
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from db.base import get_db
from modules.auth.service import AuthService
from modules.auth.schemas import SignupRequest, LoginRequest, UpdatePreferencesRequest, UserResponse
from core.jwt_auth import create_access_token

router = APIRouter(prefix="/api/auth", tags=["auth"])


@router.post("/signup")
def signup(request: SignupRequest, db: Session = Depends(get_db)):
    """Create a new user account and return JWT token."""
    auth_service = AuthService(db)
    user_data = auth_service.signup(
        username=request.username,
        email=request.email,
        password=request.password
    )
    
    # Generate JWT token
    access_token = create_access_token(user_data["id"], user_data["email"])
    user_data["access_token"] = access_token
    
    return {"success": True, "user": user_data}


@router.post("/login")
def login(request: LoginRequest, db: Session = Depends(get_db)):
    """Authenticate a user and return JWT token."""
    auth_service = AuthService(db)
    user_data = auth_service.login(
        username=request.username,
        password=request.password
    )
    
    # Generate JWT token
    access_token = create_access_token(user_data["id"], user_data["email"])
    user_data["access_token"] = access_token
    
    return {"success": True, "user": user_data}


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
