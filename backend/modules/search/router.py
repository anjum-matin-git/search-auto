"""
FastAPI router for search endpoints.
"""
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import Optional

from db.base import get_db
from db.models import User
from core.jwt_auth import get_optional_user_jwt
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
    current_user: Optional[User] = Depends(get_optional_user_jwt),
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
        # Cast SQLAlchemy Column to int safely
        user_id = current_user.id if isinstance(current_user.id, int) else int(current_user.id)
        
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
    
    # Transform car data to match frontend expectations
    matched_cars_with_scores = []
    for car, score in zip(
        final_state.get("matched_cars", []),
        final_state.get("match_scores", [])
    ):
        # Format price
        price_numeric = car.get("price")
        price_str = f"${price_numeric:,}" if price_numeric else "Contact for price"
        
        # Format mileage
        mileage_numeric = car.get("mileage")
        mileage_str = f"{mileage_numeric:,} mi" if mileage_numeric else None
        
        # Create specs object from top-level fields
        specs = None
        if any(car.get(k) for k in ["acceleration", "top_speed", "power", "mpg"]):
            specs = {
                "acceleration": f"{car.get('acceleration')}s" if car.get('acceleration') else None,
                "topSpeed": f"{int(car.get('top_speed'))} mph" if car.get('top_speed') else None,
                "power": f"{int(car.get('power'))} hp" if car.get('power') else None,
                "mpg": f"{car.get('mpg')} mpg" if car.get('mpg') else None,
            }
        
        # Convert match score to percentage (0-100)
        match_percentage = int(abs(score) * 100) if score is not None else 95
        
        car_response = CarResponse(
            id=car.get("id"),
            brand=car.get("brand", "Unknown"),
            model=car.get("model", "Unknown"),
            year=car.get("year", 2024),
            price=price_str,
            priceNumeric=price_numeric,
            mileage=mileage_str,
            mileageNumeric=mileage_numeric,
            location=car.get("location"),
            type=car.get("type"),
            source=car.get("source"),
            sourceUrl=car.get("url"),
            description=car.get("description"),
            features=car.get("features", []),
            images=car.get("images", []),
            specs=specs,
            match=match_percentage
        )
        matched_cars_with_scores.append(car_response)
    
    return SearchResponse(
        success=True,
        query=request.query,
        count=len(matched_cars_with_scores),
        results=matched_cars_with_scores,
        search_id=final_state.get("search_id")
    )
