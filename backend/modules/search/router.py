"""
FastAPI router for search endpoints.
"""
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import Optional

from db.base import get_db
from db.models import User
from db.repositories import SearchRepository, UserRepository
from core.jwt_auth import get_optional_user_jwt, get_current_user_jwt
from modules.search.schemas import SearchRequest, SearchResponse, CarResponse
from agents.search.workflow import run_search
from services.credits_service import CreditsService
from integrations.autodev_api import AutoDevAPI
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
        # Format price - handle both numeric and pre-formatted strings from Auto.dev
        price_value = car.get("price")
        if isinstance(price_value, str):
            # Already formatted from Auto.dev (e.g., "$28,706")
            price_str = price_value
            # Extract numeric value
            price_numeric = int(price_value.replace("$", "").replace(",", "")) if price_value and price_value != "New" else 0
        elif isinstance(price_value, (int, float)):
            price_numeric = int(price_value)
            price_str = f"${price_numeric:,}"
        else:
            price_numeric = 0
            price_str = "Contact for price"
        
        # Format mileage - handle both numeric and string formats from Auto.dev
        mileage_value = car.get("mileage")
        if isinstance(mileage_value, str):
            # Already formatted (e.g., "146,227 Miles" or "New")
            mileage_str = mileage_value
            # Extract numeric value
            try:
                mileage_numeric = int(mileage_value.replace(",", "").replace(" Miles", "").replace(" mi", "")) if mileage_value and mileage_value != "New" else 0
            except:
                mileage_numeric = 0
        elif isinstance(mileage_value, (int, float)):
            mileage_numeric = int(mileage_value)
            mileage_str = f"{mileage_numeric:,} mi"
        else:
            mileage_numeric = 0
            mileage_str = None
        
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
            match=match_percentage,
            vin=car.get("vin"),
            dealerName=car.get("dealer_name"),
            dealerPhone=car.get("dealer_phone"),
            dealerAddress=car.get("dealer_address")
        )
        matched_cars_with_scores.append(car_response)
    
    return SearchResponse(
        success=True,
        query=request.query,
        count=len(matched_cars_with_scores),
        results=matched_cars_with_scores,
        search_id=final_state.get("search_id")
    )


@router.get("/personalized", response_model=SearchResponse)
async def get_personalized_cars(
    current_user: User = Depends(get_current_user_jwt),
    db: Session = Depends(get_db)
):
    """
    Get personalized car recommendations for the logged-in user.
    - If user has search history, return their most recent search results
    - If no history, search for cars near their signup location
    """
    user_id = current_user.id if isinstance(current_user.id, int) else int(current_user.id)
    search_repo = SearchRepository(db)
    
    logger.info("personalized_request", user_id=user_id)
    
    # Try to get user's latest search with results
    latest_search_data = search_repo.get_latest_with_results(user_id)
    
    if latest_search_data:
        # User has search history - return cached results
        search, car_results = latest_search_data
        logger.info("personalized_from_history", user_id=user_id, search_id=search.id, results_count=len(car_results))
        
        # Transform to response format
        matched_cars_with_scores = []
        for car_model, match_score in car_results:
            car_data = car_model.car_data
            
            # Format price
            price_value = car_data.get("price")
            if isinstance(price_value, str):
                price_str = price_value
                try:
                    price_numeric = int(price_value.replace("$", "").replace(",", "")) if price_value and price_value not in ["New", "accepting_offers"] else 0
                except:
                    price_numeric = 0
            elif isinstance(price_value, (int, float)):
                price_numeric = int(price_value)
                price_str = f"${price_numeric:,}"
            else:
                price_numeric = 0
                price_str = "Contact for price"
            
            # Format mileage
            mileage_value = car_data.get("mileage")
            if isinstance(mileage_value, str):
                mileage_str = mileage_value
                try:
                    mileage_numeric = int(mileage_value.replace(",", "").replace(" Miles", "").replace(" mi", "")) if mileage_value and mileage_value != "New" else 0
                except:
                    mileage_numeric = 0
            elif isinstance(mileage_value, (int, float)):
                mileage_numeric = int(mileage_value)
                mileage_str = f"{mileage_numeric:,} mi"
            else:
                mileage_numeric = 0
                mileage_str = None
            
            # Create specs
            specs = None
            if any(car_data.get(k) for k in ["acceleration", "top_speed", "power", "mpg"]):
                specs = {
                    "acceleration": f"{car_data.get('acceleration')}s" if car_data.get('acceleration') else None,
                    "topSpeed": f"{int(car_data.get('top_speed'))} mph" if car_data.get('top_speed') else None,
                    "power": f"{int(car_data.get('power'))} hp" if car_data.get('power') else None,
                    "mpg": f"{car_data.get('mpg')} mpg" if car_data.get('mpg') else None,
                }
            
            match_percentage = int(abs(match_score) * 100) if match_score is not None else 95
            
            car_response = CarResponse(
                id=car_model.id,
                brand=car_data.get("brand", "Unknown"),
                model=car_data.get("model", "Unknown"),
                year=car_data.get("year", 2024),
                price=price_str,
                priceNumeric=price_numeric,
                mileage=mileage_str,
                mileageNumeric=mileage_numeric,
                location=car_data.get("location"),
                type=car_data.get("type"),
                source=car_data.get("source"),
                sourceUrl=car_data.get("url"),
                description=car_data.get("description"),
                features=car_data.get("features", []),
                images=car_data.get("images", []),
                specs=specs,
                match=match_percentage,
                vin=car_data.get("vin"),
                dealerName=car_data.get("dealer_name"),
                dealerPhone=car_data.get("dealer_phone"),
                dealerAddress=car_data.get("dealer_address")
            )
            matched_cars_with_scores.append(car_response)
        
        return SearchResponse(
            success=True,
            query=search.query,
            count=len(matched_cars_with_scores),
            results=matched_cars_with_scores,
            search_id=search.id
        )
    
    else:
        # No search history - use location to find nearby cars
        # Fallback chain: location -> postal_code -> default
        user_location = current_user.location or current_user.postal_code or "California"
        logger.info("personalized_from_location", user_id=user_id, location=user_location)
        
        # Search for popular cars near user's location
        autodev_api = AutoDevAPI()
        cars = await autodev_api.search_listings({
            "location": user_location,
            "price_max": 50000  # Reasonable default
        })
        
        if not cars:
            # Return empty results
            return SearchResponse(
                success=True,
                query=f"Cars near {user_location}",
                count=0,
                results=[]
            )
        
        # Transform to response format (reuse same logic)
        matched_cars_with_scores = []
        for car_data in cars[:10]:  # Limit to 10
            # Format price
            price_value = car_data.get("price")
            if isinstance(price_value, str):
                price_str = price_value
                try:
                    price_numeric = int(price_value.replace("$", "").replace(",", "")) if price_value and price_value not in ["New", "accepting_offers"] else 0
                except:
                    price_numeric = 0
            elif isinstance(price_value, (int, float)):
                price_numeric = int(price_value)
                price_str = f"${price_numeric:,}"
            else:
                price_numeric = 0
                price_str = "Contact for price"
            
            # Format mileage
            mileage_value = car_data.get("mileage")
            if isinstance(mileage_value, str):
                mileage_str = mileage_value
                try:
                    mileage_numeric = int(mileage_value.replace(",", "").replace(" Miles", "").replace(" mi", "")) if mileage_value and mileage_value != "New" else 0
                except:
                    mileage_numeric = 0
            elif isinstance(mileage_value, (int, float)):
                mileage_numeric = int(mileage_value)
                mileage_str = f"{mileage_numeric:,} mi"
            else:
                mileage_numeric = 0
                mileage_str = None
            
            specs = None
            if any(car_data.get(k) for k in ["acceleration", "top_speed", "power", "mpg"]):
                specs = {
                    "acceleration": f"{car_data.get('acceleration')}s" if car_data.get('acceleration') else None,
                    "topSpeed": f"{int(car_data.get('top_speed'))} mph" if car_data.get('top_speed') else None,
                    "power": f"{int(car_data.get('power'))} hp" if car_data.get('power') else None,
                    "mpg": f"{car_data.get('mpg')} mpg" if car_data.get('mpg') else None,
                }
            
            car_response = CarResponse(
                id=0,  # No ID for non-stored cars
                brand=car_data.get("brand", "Unknown"),
                model=car_data.get("model", "Unknown"),
                year=car_data.get("year", 2024),
                price=price_str,
                priceNumeric=price_numeric,
                mileage=mileage_str,
                mileageNumeric=mileage_numeric,
                location=car_data.get("location"),
                type=car_data.get("type"),
                source=car_data.get("source"),
                sourceUrl=car_data.get("url"),
                description=car_data.get("description"),
                features=car_data.get("features", []),
                images=car_data.get("images", []),
                specs=specs,
                match=85,  # Default match for location-based results
                vin=car_data.get("vin"),
                dealerName=car_data.get("dealer_name"),
                dealerPhone=car_data.get("dealer_phone"),
                dealerAddress=car_data.get("dealer_address")
            )
            matched_cars_with_scores.append(car_response)
        
        return SearchResponse(
            success=True,
            query=f"Cars near {user_location}",
            count=len(matched_cars_with_scores),
            results=matched_cars_with_scores
        )
