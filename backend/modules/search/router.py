"""
FastAPI router for search endpoints.
"""
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import Optional

from db.base import get_db
from db.models import User
from core.auth import get_optional_user, get_current_user
from modules.search.schemas import SearchRequest, SearchResponse, CarResponse
from agents.search.workflow import run_search
from services.credits_service import CreditsService
from core.logging import get_logger
from core.exceptions import AppException

logger = get_logger(__name__)
router = APIRouter(prefix="/api/search", tags=["search"])


@router.post("", response_model=SearchResponse)
async def search_cars(
    request: SearchRequest,
    current_user: Optional[User] = Depends(get_optional_user),
    db: Session = Depends(get_db)
):
    """
    Search for cars using natural language query.
    Authenticated users: Checks credits/quota and deducts after search.
    Unauthenticated users: Limited free search without persistence.
    """
    credits_service = CreditsService(db)
    user_id: Optional[int] = None
    
    # For authenticated users, check and deduct credits atomically
    if current_user:
        user_id = int(current_user.id)
        
        # Check quota before search
        has_quota = credits_service.check_quota(user_id)
        if not has_quota:
            logger.warning("search_quota_exceeded", user_id=user_id)
            raise AppException("No credits remaining. Please upgrade your plan.", 402)
        
        # Deduct credit BEFORE search (prevents race conditions)
        # If search fails, we could refund, but simpler to deduct upfront
        try:
            credits_service.deduct_credit(user_id)
            logger.info("credit_deducted_before_search", user_id=user_id)
        except AppException as e:
            # Re-raise 402 errors (no credits)
            if e.status_code == 402:
                raise
            # For other errors, log and continue
            logger.error("credit_deduction_failed", user_id=user_id, error=str(e))
    
    # Run search workflow
    final_state = await run_search(
        query=request.query,
        user_id=user_id
    )
    
    matched_cars_with_scores = [
        CarResponse(**car, match_score=score)
        for car, score in zip(
            final_state.get("matched_cars", []),
            final_state.get("match_scores", [])
        )
    ]
    
    return SearchResponse(
        query=request.query,
        matched_cars=matched_cars_with_scores,
        search_id=final_state.get("search_id"),
        total_results=len(matched_cars_with_scores)
    )
