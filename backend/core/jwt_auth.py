"""
JWT-based authentication for production security.
Replaces the insecure x-user-id header approach.
"""
import os
from datetime import datetime, timedelta
from typing import Optional
try:
    import jwt
except ImportError:
    from jose import jwt
from fastapi import Depends, HTTPException, Header
from sqlalchemy.orm import Session

from db.base import get_db
from db.models import User
from core.logging import get_logger

logger = get_logger(__name__)

# JWT Configuration
SECRET_KEY = os.getenv("JWT_SECRET_KEY")
if not SECRET_KEY:
    # Generate a random secret for development, but warn
    import secrets
    SECRET_KEY = secrets.token_urlsafe(32)
    logger.warning(
        "jwt_secret_not_configured",
        message="JWT_SECRET_KEY not set! Using random key. SET THIS IN PRODUCTION!"
    )

ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 * 7  # 7 days


def create_access_token(user_id: int, email: str) -> str:
    """
    Create a JWT access token for a user.
    Token expires in 7 days.
    """
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    payload = {
        "user_id": user_id,
        "email": email,
        "exp": expire,
        "iat": datetime.utcnow()
    }
    
    token = jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)
    logger.info("access_token_created", user_id=user_id)
    return token


def verify_token(token: str) -> dict:
    """
    Verify and decode a JWT token.
    Raises HTTPException if invalid or expired.
    """
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token has expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")


async def get_current_user_jwt(
    authorization: Optional[str] = Header(None),
    db: Session = Depends(get_db)
) -> User:
    """
    Get current user from JWT token in Authorization header.
    Expects: "Bearer <token>"
    """
    if not authorization:
        raise HTTPException(
            status_code=401,
            detail="Missing authorization header. Please log in."
        )
    
    # Extract token from "Bearer <token>"
    parts = authorization.split()
    if len(parts) != 2 or parts[0].lower() != "bearer":
        raise HTTPException(
            status_code=401,
            detail="Invalid authorization header format. Expected: Bearer <token>"
        )
    
    token = parts[1]
    
    # Verify and decode token
    payload = verify_token(token)
    user_id = payload.get("user_id")
    
    if not user_id:
        raise HTTPException(status_code=401, detail="Invalid token payload")
    
    # Get user from database
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    
    return user


async def get_optional_user_jwt(
    authorization: Optional[str] = Header(None),
    db: Session = Depends(get_db)
) -> Optional[User]:
    """Get current user if authenticated, None otherwise."""
    if not authorization:
        return None
    
    try:
        return await get_current_user_jwt(authorization, db)
    except HTTPException:
        return None
