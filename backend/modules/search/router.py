"""
FastAPI router for car search.
Hybrid approach: Agent for intelligence, Router for reliability.
"""
import asyncio
import json
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
from agents.react_agent import car_search_agent
from agents.tools.search_tools import search_car_listings
from integrations.anthropic_client import AnthropicClient
from services.credits_service import CreditsService

logger = get_logger(__name__)
router = APIRouter(prefix="/api/search", tags=["search"])


async def _direct_search(query: str, user_context: dict, db: Session) -> Tuple[List[dict], str]:
    """
    Direct search without relying on agent to save.
    Returns (cars, summary).
    """
    claude = AnthropicClient()
    
    # Step 1: Extract features from query
    features = await claude.extract_features(query)
    logger.info("features_extracted", query=query, features=features)
    
    # Step 2: Search for cars
    brand = features.get("brand")
    model = features.get("model")
    price_max = features.get("price_max")
    price_min = features.get("price_min")
    required_features = features.get("features", [])
    location = user_context.get("location")
    postal_code = user_context.get("postal_code")
    
    # If no brand specified, use user preferences
    if not brand:
        prefs = user_context.get("preferences", {})
        brands = prefs.get("preferred_brands", [])
        if brands:
            brand = brands[0]  # Use first preferred brand
    
    cars = await search_car_listings.ainvoke({
        "brand": brand,
        "model": model,
        "price_min": price_min,
        "price_max": price_max,
        "location": location,
        "postal_code": postal_code,
        "required_features": required_features if required_features else None,
        "user_query": query,
        "limit": 10,
        "page": 1
    })
    
    logger.info("search_completed", cars_found=len(cars))
    
    # Step 3: Generate summary
    summary = await claude.generate_summary(cars, query, len(cars))
    
    return cars, summary


def _save_search_results(
    db: Session,
    user_id: int,
    query: str,
    cars: List[dict],
    summary: str
) -> int:
    """Save search results to database. Returns search_id."""
    try:
        # Create search record
        search = Search(
            user_id=user_id,
            query=query,
            created_at=datetime.utcnow()
        )
        db.add(search)
        db.flush()
        
        # Save cars and link to search
        for i, car_data in enumerate(cars):
            car = Car(
                car_data={
                    "vin": car_data.get("vin") or "",
                    "brand": car_data.get("brand"),
                    "model": car_data.get("model"),
                    "year": car_data.get("year"),
                    "price": car_data.get("price"),
                    "location": car_data.get("location"),
                    "dealer": car_data.get("dealer"),
                    "images": car_data.get("images", [])[:3],
                },
                active=True,
                created_at=datetime.utcnow()
            )
            db.add(car)
            db.flush()
            
            match_score = car_data.get("match_score", 50)
            if match_score > 1:
                match_score = match_score / 100.0
            
            search_result = SearchResult(
                search_id=search.id,
                car_id=car.id,
                rank=i + 1,
                match_score=match_score
            )
            db.add(search_result)
        
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
        
        # Add assistant message
        msg = ConversationMessage(
            conversation_id=conversation.id,
            role="assistant",
            content=summary,
            created_at=datetime.utcnow()
        )
        db.add(msg)
        
        db.commit()
        
        logger.info("results_saved", search_id=search.id, cars_count=len(cars))
        return search.id
        
    except Exception as e:
        db.rollback()
        logger.error("save_failed", error=str(e))
        raise


def _extract_cars_from_search(db: Session, search_id: int) -> List[CarResponse]:
    """Extract saved cars from database."""
    car_results = []
    
    try:
        search_results = db.query(SearchResult).filter(
            SearchResult.search_id == search_id
        ).order_by(SearchResult.rank).limit(12).all()
        
        for sr in search_results:
            car = db.query(Car).filter(Car.id == sr.car_id).first()
            if car and car.car_data:
                data = car.car_data
                price_num = data.get("price", 0) or 0
                price_str = f"${price_num:,}" if price_num else "Contact for price"
                
                car_results.append(CarResponse(
                    id=car.id,
                    vin=data.get("vin") or "",
                    brand=data.get("brand") or "Unknown",
                    model=data.get("model") or "Unknown",
                    year=data.get("year") or 2024,
                    price=price_str,
                    priceNumeric=price_num,
                    location=data.get("location"),
                    dealerName=data.get("dealer"),
                    images=data.get("images", [])[:3],
                    match=int((sr.match_score or 0) * 100)
                ))
    except Exception as e:
        logger.error("extract_cars_error", error=str(e))
    
    return car_results


def _build_user_context(user_id: int, user: User, db: Session) -> dict:
    """Build user context for personalization."""
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
            context["preferences"] = {
                "preferred_brands": ip.get("brands") or [],
                "preferred_types": ip.get("types") or [],
                "budget": ip.get("price_max")
            }
    except Exception as e:
        logger.warning("preferences_load_error", user_id=user_id, error=str(e))
    
    return context


@router.post("", response_model=SearchResponse)
async def search_cars(
    request: SearchRequest,
    current_user: User = Depends(get_current_user_jwt),
    db: Session = Depends(get_db)
):
    """Search for cars using direct approach for reliability."""
    user_id = int(current_user.id)
    
    # Check credits
    credits_service = CreditsService(db)
    if not credits_service.check_quota(user_id):
        logger.warning("quota_exceeded", user_id=user_id)
        raise AppException("No credits remaining. Please upgrade your plan.", 402)
    
    # Deduct credit
    try:
        credits_service.deduct_credit(user_id)
        db.commit()
    except AppException as e:
        if e.status_code == 402:
            raise
    
    # Build context
    user_context = _build_user_context(user_id, current_user, db)
    
    logger.info("search_start", query=request.query, user_id=user_id)
    
    try:
        # Direct search with timeout
        cars, summary = await asyncio.wait_for(
            _direct_search(request.query, user_context, db),
            timeout=float(settings.agent_timeout_seconds)
        )
        
        # Save results
        search_id = None
        if cars:
            search_id = _save_search_results(db, user_id, request.query, cars, summary)
        
        # Extract saved cars
        car_results = _extract_cars_from_search(db, search_id) if search_id else []
        
        logger.info("search_complete", 
                    query=request.query, 
                    cars_found=len(car_results))
        
        return SearchResponse(
            success=True,
            query=request.query,
            count=len(car_results),
            results=car_results,
            search_id=search_id,
            message=summary
        )
        
    except asyncio.TimeoutError:
        logger.error("search_timeout", query=request.query, user_id=user_id)
        raise AppException("Search timed out. Please try a simpler query.", 408)
    except Exception as e:
        logger.error("search_error", error=str(e), query=request.query)
        raise AppException("Search failed. Please try again.", 500)


@router.get("/personalized", response_model=SearchResponse)
async def get_personalized_recommendations(
    current_user: User = Depends(get_current_user_jwt),
    db: Session = Depends(get_db)
):
    """Get personalized car recommendations."""
    user_id = int(current_user.id)
    user_context = _build_user_context(user_id, current_user, db)
    
    # Find last search or build from preferences
    search_repo = SearchRepository(db)
    last_searches = search_repo.get_user_history(user_id, limit=1)
    
    if last_searches:
        query = last_searches[0].query
        logger.info("using_last_search", user_id=user_id, query=query[:50])
    else:
        prefs = user_context.get("preferences", {})
        brands = prefs.get("preferred_brands", [])
        budget = prefs.get("budget")
        
        if brands:
            query = f"Show me {', '.join(brands[:2])} cars"
            if budget:
                query += f" under ${budget:,}"
        else:
            query = "Show me popular cars"
        
        logger.info("using_preferences", user_id=user_id, query=query)
    
    try:
        cars, summary = await asyncio.wait_for(
            _direct_search(query, user_context, db),
            timeout=float(settings.agent_timeout_seconds)
        )
        
        search_id = None
        if cars:
            search_id = _save_search_results(db, user_id, query, cars, summary)
        
        car_results = _extract_cars_from_search(db, search_id) if search_id else []
        
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
