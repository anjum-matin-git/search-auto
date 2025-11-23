"""
Credits and usage tracking service.
Handles credit deduction, quota checks, and subscription management.
"""
from typing import Optional
from sqlalchemy.orm import Session
from core.logging import get_logger
from core.exceptions import AppException
from db.models import User, UserSubscription

logger = get_logger(__name__)


class CreditsService:
    """Service for managing user credits and quotas."""
    
    def __init__(self, db: Session):
        self.db = db
    
    def check_quota(self, user_id: int) -> bool:
        """
        Check if user has remaining quota for search.
        Returns True if user can search, False otherwise.
        """
        user = self.db.query(User).filter(User.id == user_id).first()
        if not user:
            return False
        
        # Pro plan users have unlimited searches
        if user.unlimited_searches:
            return True
        
        # Check credit balance
        return user.credits_remaining > 0
    
    def get_user_credits(self, user_id: int) -> Optional[dict]:
        """Get user's current credit status."""
        user = self.db.query(User).filter(User.id == user_id).first()
        if not user:
            return None
        
        subscription = self.db.query(UserSubscription).filter(
            UserSubscription.user_id == user_id
        ).first()
        
        return {
            "credits_remaining": user.credits_remaining,
            "unlimited": user.unlimited_searches,
            "has_subscription": subscription is not None and subscription.status == "active",
            "plan_name": subscription.plan.name if subscription else None
        }
    
    def deduct_credit(self, user_id: int) -> bool:
        """
        Atomically deduct one credit from user's balance.
        Uses SELECT FOR UPDATE to prevent race conditions.
        Raises AppException if no credits remaining.
        Returns True if successful.
        """
        from sqlalchemy import text
        
        # Use SELECT FOR UPDATE to lock the row and prevent race conditions
        user = self.db.query(User).filter(User.id == user_id).with_for_update().first()
        if not user:
            raise AppException("User not found", 404)
        
        # Pro/Premium users have unlimited searches
        if user.unlimited_searches:
            logger.info("unlimited_user_search", user_id=user_id)
            return True
        
        # Check if user has credits (atomic check)
        if user.credits_remaining <= 0:
            logger.warning("no_credits_remaining", user_id=user_id)
            raise AppException("No credits remaining. Please upgrade your plan.", 402)
        
        # Deduct credit atomically
        user.credits_remaining -= 1
        self.db.commit()
        
        logger.info(
            "credit_deducted",
            user_id=user_id,
            remaining=user.credits_remaining
        )
        
        return True
    
    def add_credits(self, user_id: int, amount: int) -> int:
        """
        Add credits to user's balance.
        Returns new credit balance.
        """
        user = self.db.query(User).filter(User.id == user_id).first()
        if not user:
            raise AppException("User not found", 404)
        
        user.credits_remaining += amount
        self.db.commit()
        
        logger.info(
            "credits_added",
            user_id=user_id,
            amount=amount,
            new_balance=user.credits_remaining
        )
        
        return user.credits_remaining
    
    def set_unlimited(self, user_id: int, unlimited: bool = True):
        """Enable or disable unlimited searches for a user (Pro/Premium plans)."""
        user = self.db.query(User).filter(User.id == user_id).first()
        if not user:
            raise AppException("User not found", 404)
        
        user.unlimited_searches = unlimited
        self.db.commit()
        
        logger.info(
            "unlimited_searches_updated",
            user_id=user_id,
            unlimited=unlimited
        )
