"""
Search API router.
Provides endpoints for car search with AI-powered features.
"""
import asyncio
from typing import Optional, List, Tuple
from datetime import datetime

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from db.base import get_db
from db.models import User, Search, SearchResult, Car, Conversation, ConversationMessage
from db.repositories import UserPreferenceRepository, SearchRepository
from core.jwt_auth import get_current_user_jwt
from core.config import settings
from core.logging import get_logger
from core.exceptions import AppException
from modules.search.schemas import SearchRequest, SearchResponse, CarResponse
from agents.tools.search_tools import search_car_listings
from integrations.anthropic_client import ClaudeClient
from services.credits_service import CreditsService

logger = get_logger(__name__)
router = APIRouter(prefix="/api/search", tags=["search"])


# =============================================================================
# Helper Functions
# =============================================================================

async def execute_search(
    query: str,
    user_context: dict,
    db: Session
) -> Tuple[List[dict], str]:
    """
    Execute car search with feature extraction and summary.
    
    Args:
        query: User's search query
        user_context: User info (location, preferences)
        db: Database session
    
    Returns:
        Tuple of (cars, summary)
    """
    claude = ClaudeClient()
    
    # Extract features from natural language
    features = await claude.extract_search_features(query)
    logger.info("features_extracted", query=query[:50], features=features)
    
    # Build search parameters (handle list or string)
    brand = features.get("brand")
    if isinstance(brand, list):
        brand = brand[0] if brand else None
    
    model = features.get("model")
    if isinstance(model, list):
        model = model[0] if model else None
    price_min = features.get("price_min")
    price_max = features.get("price_max")
    required_features = features.get("features", [])
    location = user_context.get("location")
    postal_code = user_context.get("postal_code")
    
    # Extract body type (SUV, Sedan, Truck, etc.)
    body_type = features.get("type")
    if isinstance(body_type, list):
        body_type = body_type[0] if body_type else None
    
    # Extract fuel type - check both direct field and features array
    fuel_type = features.get("fuel_type")  # Claude now extracts this directly
    fuel_keywords = {"electric": "Electric", "hybrid": "Hybrid", "diesel": "Diesel", "ev": "Electric"}
    remaining_features = []
    for feat in (required_features or []):
        feat_lower = feat.lower()
        if feat_lower in fuel_keywords:
            if not fuel_type:  # Only set if not already set
                fuel_type = fuel_keywords[feat_lower]
        else:
            remaining_features.append(feat)
    required_features = remaining_features
    
    logger.info("search_params", brand=brand, model=model, body_type=body_type, fuel_type=fuel_type)
    
    # Use preferences if no brand specified
    if not brand:
        prefs = user_context.get("preferences", {})
        brands = prefs.get("preferred_brands", [])
        if brands:
            brand = brands[0]
    
    # Execute search
    cars = await search_car_listings.ainvoke({
        "brand": brand,
        "model": model,
        "price_min": price_min,
        "price_max": price_max,
        "location": location,
        "postal_code": postal_code,
        "body_type": body_type,
        "fuel_type": fuel_type,
        "required_features": required_features if required_features else None,
        "user_query": query,
        "limit": settings.default_search_limit,
        "page": 1
    })
    
    logger.info("search_executed", cars_found=len(cars))
    
    # Generate summary
    summary = await claude.generate_search_summary(cars, query, len(cars))
    
    return cars, summary


def persist_search_results(
    db: Session,
    user_id: int,
    query: str,
    cars: List[dict],
    summary: str
) -> int:
    """
    Save search results to database.
    
    Args:
        db: Database session
        user_id: User's ID
        query: Search query
        cars: List of car data
        summary: AI-generated summary
    
    Returns:
        Search ID
    """
    # Create search record
    search = Search(
        user_id=user_id,
        query=query,
        created_at=datetime.utcnow()
    )
    db.add(search)
    db.flush()
    
    # Save cars
    for i, car_data in enumerate(cars):
        match_score = car_data.get("match_score", 50)
        if match_score > 1:
            match_score = match_score / 100.0
        
        car = Car(
            car_data={
                "vin": car_data.get("vin") or "",
                "brand": car_data.get("brand"),
                "model": car_data.get("model"),
                "year": car_data.get("year"),
                "price": car_data.get("price"),
                "location": car_data.get("location"),
                "dealer": car_data.get("dealer"),
                "images": car_data.get("images", [])[:5],
                "description": car_data.get("description"),
                "features": car_data.get("features", [])[:5],
                "source_url": car_data.get("source_url"),
            },
            active=True,
            created_at=datetime.utcnow()
        )
        db.add(car)
        db.flush()
        
        db.add(SearchResult(
            search_id=search.id,
            car_id=car.id,
            rank=i + 1,
            match_score=match_score
        ))
    
    # Save to conversation
    conversation = db.query(Conversation).filter(
        Conversation.user_id == user_id
    ).first()
    
    if not conversation:
        conversation = Conversation(
            user_id=user_id,
            title="Car Search",
            created_at=datetime.utcnow()
        )
        db.add(conversation)
        db.flush()
    
    # Add user's search query as a message
    db.add(ConversationMessage(
        conversation_id=conversation.id,
        role="user",
        content=query,
        created_at=datetime.utcnow()
    ))
    
    # Add assistant's summary response
    db.add(ConversationMessage(
        conversation_id=conversation.id,
        role="assistant",
        content=summary,
        created_at=datetime.utcnow()
    ))
    
    db.commit()
    
    logger.info("results_persisted", search_id=search.id, cars_count=len(cars))
    return search.id


def load_cars_from_search(db: Session, search_id: int) -> List[CarResponse]:
    """
    Load cars from a search result.
    
    Args:
        db: Database session
        search_id: Search ID
    
    Returns:
        List of CarResponse objects
    """
    results = []
    
    search_results = db.query(SearchResult).filter(
        SearchResult.search_id == search_id
    ).order_by(SearchResult.rank).limit(settings.max_search_results).all()
    
    for sr in search_results:
        car = db.query(Car).filter(Car.id == sr.car_id).first()
        if not car or not car.car_data:
            continue
        
        data = car.car_data
        price_num = data.get("price", 0) or 0
        price_str = f"${price_num:,}" if price_num else "Contact dealer"
        
        results.append(CarResponse(
            id=car.id,
            vin=data.get("vin") or "",
            brand=data.get("brand") or "Unknown",
            model=data.get("model") or "Unknown",
            year=data.get("year") or 2024,
            price=price_str,
            priceNumeric=price_num,
            location=data.get("location"),
            dealerName=data.get("dealer"),
            images=data.get("images", [])[:5],
            description=data.get("description"),
            features=data.get("features", []),
            sourceUrl=data.get("source_url"),
            match=int((sr.match_score or 0) * 100)
        ))
    
    return results


def load_latest_results_for_user(db: Session, user_id: int) -> Tuple[List[CarResponse], Optional[int]]:
    """
    Load the most recent search results for a user.
    Used to show latest results on home page.
    
    Args:
        db: Database session
        user_id: User's ID
    
    Returns:
        Tuple of (cars, search_id)
    """
    latest_search = db.query(Search).filter(
        Search.user_id == user_id
    ).order_by(Search.created_at.desc()).first()
    
    if not latest_search:
        return [], None
    
    cars = load_cars_from_search(db, latest_search.id)
    return cars, latest_search.id


def build_user_context(user_id: int, user: User, db: Session) -> dict:
    """
    Build user context for personalization.
    
    Args:
        user_id: User's ID
        user: User model
        db: Database session
    
    Returns:
        Context dict with location, preferences
    """
    context = {
        "user_id": user_id,
        "location": user.location,
        "postal_code": user.postal_code,
        "preferences": {}
    }
    
    try:
        pref_repo = UserPreferenceRepository(db)
        prefs = pref_repo.get_by_user(user_id)
        
        if prefs:
            context["preferences"] = {
                "preferred_brands": prefs.preferred_brands or [],
                "preferred_types": prefs.preferred_types or [],
                "budget": prefs.preferences.get("budget") if prefs.preferences else None
            }
        elif user.initial_preferences:
            ip = user.initial_preferences
            # Handle both "carTypes" (frontend) and "types" (backend)
            car_types = ip.get("carTypes") or ip.get("types", [])
            # Handle both "priceRange" and direct price fields
            price_range = ip.get("priceRange", {})
            budget = ip.get("price_max") or (price_range.get("max") if isinstance(price_range, dict) else None)
            
            context["preferences"] = {
                "preferred_brands": ip.get("brands") or [],
                "preferred_types": car_types,
                "budget": budget
            }
    except Exception as e:
        logger.warning("preferences_load_failed", user_id=user_id, error=str(e))
    
    return context


# =============================================================================
# API Endpoints
# =============================================================================

@router.post("", response_model=SearchResponse)
async def search_cars(
    request: SearchRequest,
    current_user: User = Depends(get_current_user_jwt),
    db: Session = Depends(get_db)
):
    """
    Search for cars with AI-powered features.
    
    - Extracts features from natural language
    - Searches dealer inventory
    - Ranks by relevance
    - Returns cars with AI summary
    """
    user_id = int(current_user.id)
    
    # Check credits
    credits = CreditsService(db)
    if not credits.check_quota(user_id):
        logger.warning("quota_exceeded", user_id=user_id)
        raise AppException("No credits remaining. Please upgrade.", 402)
    
    # Deduct credit
    try:
        credits.deduct_credit(user_id)
        db.commit()
    except AppException as e:
        if e.status_code == 402:
            raise
    
    user_context = build_user_context(user_id, current_user, db)
    
    logger.info("search_request", query=request.query[:50], user_id=user_id)
    
    try:
        # Execute search with timeout
        cars, summary = await asyncio.wait_for(
            execute_search(request.query, user_context, db),
            timeout=float(settings.search_timeout_seconds)
        )
        
        # Persist results
        search_id = None
        if cars:
            search_id = persist_search_results(db, user_id, request.query, cars, summary)
        
        # Load persisted cars
        car_results = load_cars_from_search(db, search_id) if search_id else []
        
        logger.info("search_complete", query=request.query[:50], cars=len(car_results))
        
        return SearchResponse(
            success=True,
            query=request.query,
            count=len(car_results),
            results=car_results,
            search_id=search_id,
            message=summary
        )
        
    except asyncio.TimeoutError:
        logger.error("search_timeout", query=request.query[:50], user_id=user_id)
        raise AppException("Search timed out. Try a simpler query.", 408)
    except Exception as e:
        logger.error("search_error", error=str(e), query=request.query[:50])
        raise AppException("Search failed. Please try again.", 500)


@router.get("/personalized", response_model=SearchResponse)
async def get_personalized_results(
    current_user: User = Depends(get_current_user_jwt),
    db: Session = Depends(get_db)
):
    """
    Get personalized car recommendations.
    
    Returns:
    - Last search results if available (for returning users)
    - Otherwise, searches based on user preferences
    """
    user_id = int(current_user.id)
    user_context = build_user_context(user_id, current_user, db)
    
    # Check for existing results first (for home page)
    existing_cars, existing_search_id = load_latest_results_for_user(db, user_id)
    
    if existing_cars:
        # Get the query from the existing search
        search_repo = SearchRepository(db)
        last_searches = search_repo.get_user_history(user_id, limit=1)
        query = last_searches[0].query if last_searches else "Your recent search"
        
        logger.info("returning_cached_results", user_id=user_id, cars=len(existing_cars))
        
        return SearchResponse(
            success=True,
            query=query,
            count=len(existing_cars),
            results=existing_cars,
            search_id=existing_search_id,
            message=f"Showing your recent search results for '{query}'."
        )
    
    # No existing results - build query from preferences
    prefs = user_context.get("preferences", {})
    brands = prefs.get("preferred_brands", [])
    budget = prefs.get("budget")
    
    if brands:
        query = f"Show me {', '.join(brands[:2])} cars"
        if budget:
            query += f" under ${budget:,}"
    else:
        query = "Show me popular cars"
    
    logger.info("personalized_search", user_id=user_id, query=query[:50])
    
    try:
        cars, summary = await asyncio.wait_for(
            execute_search(query, user_context, db),
            timeout=float(settings.search_timeout_seconds)
        )
        
        search_id = None
        if cars:
            search_id = persist_search_results(db, user_id, query, cars, summary)
        
        car_results = load_cars_from_search(db, search_id) if search_id else []
        
        return SearchResponse(
            success=True,
            query=query,
            count=len(car_results),
            results=car_results,
            search_id=search_id,
            message=summary
        )
        
    except asyncio.TimeoutError:
        logger.error("personalized_timeout", user_id=user_id)
        raise AppException("Search timed out. Please try again.", 408)
    except Exception as e:
        logger.error("personalized_error", error=str(e))
        raise AppException("Search failed. Please try again.", 500)


@router.get("/latest", response_model=SearchResponse)
async def get_latest_results(
    current_user: User = Depends(get_current_user_jwt),
    db: Session = Depends(get_db)
):
    """
    Get the user's most recent search results.
    Used by home page to show latest cars.
    """
    user_id = int(current_user.id)
    
    cars, search_id = load_latest_results_for_user(db, user_id)
    
    if not cars:
        return SearchResponse(
            success=True,
            query="",
            count=0,
            results=[],
            search_id=None,
            message="No recent searches. Try searching for a car!"
        )
    
    # Get the query
    search_repo = SearchRepository(db)
    last_searches = search_repo.get_user_history(user_id, limit=1)
    query = last_searches[0].query if last_searches else ""
    
    return SearchResponse(
        success=True,
        query=query,
        count=len(cars),
        results=cars,
        search_id=search_id,
        message=f"Your latest search: '{query}'"
    )
