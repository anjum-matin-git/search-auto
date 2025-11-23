"""
Authentication dependencies for protected routes.
"""
from typing import Optional
from fastapi import Depends, HTTPException, Header
from sqlalchemy.orm import Session

from db.base import get_db
from db.models import User
from core.logging import get_logger

logger = get_logger(__name__)


async def get_current_user(
    x_user_id: Optional[str] = Header(None),
    db: Session = Depends(get_db)
) -> User:
    """
    Get current authenticated user from request headers.
    
    For now, trusts x-user-id header (simple auth).
    In production, replace with JWT token validation.
    """
    if not x_user_id:
        raise HTTPException(
            status_code=401,
            detail="Authentication required. Please log in."
        )
    
    try:
        user_id = int(x_user_id)
    except ValueError:
        raise HTTPException(status_code=401, detail="Invalid user ID")
    
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    
    return user


async def get_optional_user(
    x_user_id: Optional[str] = Header(None),
    db: Session = Depends(get_db)
) -> Optional[User]:
    """Get current user if authenticated, None otherwise."""
    if not x_user_id:
        return None
    
    try:
        user_id = int(x_user_id)
        return db.query(User).filter(User.id == user_id).first()
    except (ValueError, TypeError):
        return None
