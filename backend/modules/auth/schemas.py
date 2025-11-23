"""
Pydantic schemas for authentication requests and responses.
"""
from typing import Optional, Dict, Any
from pydantic import BaseModel, EmailStr, Field


class SignupRequest(BaseModel):
    """Request schema for user signup."""
    username: str = Field(..., min_length=3, max_length=50)
    email: EmailStr
    password: str = Field(..., min_length=6)


class LoginRequest(BaseModel):
    """Request schema for user login."""
    username: str
    password: str


class UpdatePreferencesRequest(BaseModel):
    """Request schema for updating user preferences."""
    user_id: int
    location: str
    postal_code: str
    initial_preferences: Dict[str, Any]


class UserResponse(BaseModel):
    """Response schema for user data."""
    id: int
    username: str
    email: str
    location: Optional[str] = None
    postal_code: Optional[str] = None
    initial_preferences: Optional[Dict[str, Any]] = None
    
    class Config:
        from_attributes = True
