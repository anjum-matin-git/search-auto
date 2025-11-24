"""
Pydantic schemas for authentication requests and responses.
"""
from typing import Optional, Dict, Any
from pydantic import BaseModel, EmailStr, Field, ConfigDict


class SignupRequest(BaseModel):
    """Request schema for user signup."""
    model_config = ConfigDict(populate_by_name=True)
    username: str = Field(..., min_length=3, max_length=50)
    email: EmailStr
    password: str = Field(..., min_length=6)
    location: Optional[str] = None
    postal_code: Optional[str] = Field(default=None, alias="postalCode")
    initial_preferences: Optional[Dict[str, Any]] = Field(default=None, alias="initialPreferences")


class LoginRequest(BaseModel):
    """Request schema for user login."""
    email: str
    password: str


class UpdatePreferencesRequest(BaseModel):
    """Request schema for updating user preferences."""
    model_config = ConfigDict(populate_by_name=True)
    user_id: int
    location: Optional[str] = None
    postal_code: Optional[str] = Field(default=None, alias="postalCode")
    initial_preferences: Dict[str, Any] = Field(alias="initialPreferences")


class UpdateProfileRequest(BaseModel):
    """Request schema for updating basic profile info."""
    model_config = ConfigDict(populate_by_name=True)
    username: Optional[str] = Field(default=None, min_length=3, max_length=50)
    email: Optional[EmailStr] = None
    location: Optional[str] = None
    postal_code: Optional[str] = Field(default=None, alias="postalCode")


class ChangePasswordRequest(BaseModel):
    """Request schema for changing password."""
    model_config = ConfigDict(populate_by_name=True)
    current_password: str = Field(..., min_length=6, alias="currentPassword")
    new_password: str = Field(..., min_length=6, alias="newPassword")


class UserResponse(BaseModel):
    """Response schema for user data."""
    id: int
    username: str
    email: str
    location: Optional[str] = None
    postal_code: Optional[str] = None
    initial_preferences: Optional[Dict[str, Any]] = None
    credits_remaining: Optional[int] = None
    unlimited_searches: Optional[bool] = None
    access_token: Optional[str] = None  # JWT token for authentication
    
    class Config:
        from_attributes = True
