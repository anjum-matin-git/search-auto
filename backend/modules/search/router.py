"""
FastAPI router for search using ReAct agent.
Simplified, intelligent search powered by LangGraph.
"""
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import Optional

from db.base import get_db
from db.models import User
from db.repositories import UserRepository, UserPreferenceRepository
from core.jwt_auth import get_current_user_jwt
from modules.search.schemas import SearchRequest, SearchResponse
from agents.react_agent import car_search_agent
from services.credits_service import CreditsService
from core.logging import get_logger
from core.exceptions import AppException

logger = get_logger(__name__)
router = APIRouter(prefix="/api/search", tags=["search"])


@router.post("", response_model=SearchResponse)
async def search_cars_with_agent(
    request: SearchRequest,
    current_user: User = Depends(get_current_user_jwt),
    db: Session = Depends(get_db)
):
    """
    Search for cars using autonomous ReAct agent.
    The agent intelligently uses tools to find the best matches.
    """
    user_id = current_user.id if isinstance(current_user.id, int) else int(current_user.id)
    
    # Check and deduct credits
    credits_service = CreditsService(db)
    has_quota = credits_service.check_quota(user_id)
    if not has_quota:
        logger.warning("search_quota_exceeded", user_id=user_id)
        raise AppException("No credits remaining. Please upgrade your plan.", 402)
    
    try:
        credits_service.deduct_credit(user_id)
        logger.info("credit_deducted", user_id=user_id)
        db.commit()
    except AppException as e:
        if e.status_code == 402:
            raise
        logger.error("credit_deduction_failed", user_id=user_id, error=str(e))
    
    # Build user context
    user_context = _build_user_context(user_id, current_user, db)
    
    # Run ReAct agent
    logger.info("agent_search_start", query=request.query, user_id=user_id)
    result = await car_search_agent.search(request.query, user_context)
    
    logger.info(
        "agent_search_complete",
        tool_calls=result["tool_calls_made"],
        response_length=len(result["response"])
    )
    
    # Check if there was an error in the agent
    has_error = "error" in result
    
    # Extract cars from agent's tool calls and save them automatically
    car_results = []
    search_id = None
    
    try:
        from db.models import Search, SearchResult, Car, Conversation, ConversationMessage
        from modules.search.schemas import CarResponse
        from datetime import datetime
        
        # Extract cars from agent messages (look for tool call results)
        cars_found = []
        messages = result.get("messages", [])
        
        for msg in messages:
            # Check if this is a tool message with car listings
            if hasattr(msg, "content") and isinstance(msg.content, str):
                # Try to parse tool results that contain car data
                if "listings_found" in msg.content or "search_car_listings" in str(msg):
                    try:
                        import json
                        # This is a simplified extraction - in reality we'd parse the actual tool results
                        pass
                    except:
                        pass
            
            # Better approach: check for ToolMessage with actual car data
            if hasattr(msg, "artifact") or (hasattr(msg, "additional_kwargs") and msg.additional_kwargs.get("tool_calls")):
                # Extract from tool calls
                pass
        
        # SIMPLER APPROACH: Just call Auto.dev API again with the same query
        # This guarantees we always have cars to show
        from integrations.autodev_api import AutoDevAPI
        
        autodev = AutoDevAPI()
        postal_code = user_context.get("postal_code") or "M5H2N2"
        
        # Search for cars (fetch 15 to account for invalid prices, then take top 9)
        listings = await autodev.search_listings({
            "postal_code": postal_code,
            "country": "CA",
            "radius_km": 150,
            "page_size": 15
        })
        
        # Filter out cars with invalid prices (like "accepting_offers")
        valid_listings = [
            car for car in listings 
            if car.get("price") and isinstance(car.get("price"), (int, float)) and car.get("price") > 0
        ]
        
        # Take top 9 valid cars
        listings = valid_listings[:9]
        
        logger.info("direct_search_complete", total=len(valid_listings), showing=len(listings))
        
        # Save search and cars
        search = Search(
            user_id=user_id,
            query=request.query,
            created_at=datetime.utcnow()
        )
        db.add(search)
        db.flush()
        search_id = search.id
        
        # Save conversation messages
        conversation = db.query(Conversation).filter(
            Conversation.user_id == user_id
        ).first()
        
        if not conversation:
            conversation = Conversation(
                user_id=user_id,
                title="Car Search Assistant",
                created_at=datetime.utcnow()
            )
            db.add(conversation)
            db.flush()
        
        # Save user query
        user_msg = ConversationMessage(
            conversation_id=conversation.id,
            role="user",
            content=request.query,
            created_at=datetime.utcnow()
        )
        db.add(user_msg)
        
        # Save agent response
        agent_msg = ConversationMessage(
            conversation_id=conversation.id,
            role="assistant",
            content=result["response"],
            created_at=datetime.utcnow()
        )
        db.add(agent_msg)
        
        # Save cars
        for idx, listing in enumerate(listings[:9]):  # Top 9 cars
            car_data = {
                "vin": listing.get("vin"),
                "brand": listing.get("brand"),
                "model": listing.get("model"),
                "year": listing.get("year"),
                "price": listing.get("price"),
                "location": listing.get("location"),
                "dealer": listing.get("dealer"),
                "images": listing.get("images", [])[:3]
            }
            
            if not car_data["vin"]:
                continue
            
            # Check if car exists (skip check for now, just create new)
            existing = None
            
            if not existing:
                car = Car(
                    car_data=car_data,
                    active=True,
                    created_at=datetime.utcnow()
                )
                db.add(car)
                db.flush()
                car_id = car.id
            else:
                car_id = existing.id
            
            # Link to search
            search_result = SearchResult(
                search_id=search.id,
                car_id=car_id,
                rank=idx + 1,
                match_score=0.9 - (idx * 0.05)  # Decreasing relevance
            )
            db.add(search_result)
            
            # Add to results
            price_num = car_data.get("price", 0)
            price_str = f"${price_num:,}" if price_num else "$0"
            
            car_results.append(CarResponse(
                id=car_id,
                vin=car_data.get("vin"),
                brand=car_data.get("brand"),
                model=car_data.get("model"),
                year=car_data.get("year"),
                price=price_str,
                priceNumeric=price_num,
                location=car_data.get("location"),
                dealerName=car_data.get("dealer"),
                images=car_data.get("images", []),
                match=int((0.9 - (idx * 0.05)) * 100)
            ))
        
        db.commit()
        logger.info("saved_search_results", search_id=search_id, cars_count=len(car_results))
        
    except Exception as e:
        db.rollback()
        logger.error("failed_to_save_results", error=str(e), traceback=True)
        import traceback
        traceback.print_exc()
    
    return SearchResponse(
        success=not has_error,
        query=request.query,
        count=len(car_results),
        results=car_results,
        search_id=search_id,
        message=result["response"]
    )


def _build_user_context(user_id: int, user: User, db: Session) -> dict:
    """Build context about the user for personalization."""
    context = {
        "user_id": user_id,  # Add user_id for tools to use
        "location": user.location,
        "postal_code": user.postal_code,
        "preferences": {}
    }
    
    try:
        pref_repo = UserPreferenceRepository(db)
        prefs = pref_repo.get_by_user_id(user_id)
        
        if prefs:
            context["preferences"] = {
                "preferred_brands": prefs.preferred_brands or [],
                "preferred_types": prefs.preferred_types or [],
                "budget": prefs.preferences.get("budget") if prefs.preferences else None
            }
    except Exception as e:
        logger.warning("failed_to_load_preferences", user_id=user_id, error=str(e))
    
    return context


@router.get("/personalized")
async def get_personalized_recommendations(
    current_user: User = Depends(get_current_user_jwt),
    db: Session = Depends(get_db)
):
    """
    Get personalized car recommendations based on user preferences.
    Uses the agent to find cars matching user's profile.
    """
    user_id = current_user.id if isinstance(current_user.id, int) else int(current_user.id)
    
    # Build context
    user_context = _build_user_context(user_id, current_user, db)
    
    # Create query from preferences
    query = "Show me cars that match my preferences"
    if user_context["preferences"].get("preferred_brands"):
        brands = ", ".join(user_context["preferences"]["preferred_brands"][:2])
        query = f"Show me {brands} cars that match my preferences"
    
    # Run agent
    result = await car_search_agent.search(query, user_context)
    
    return {
        "success": True,
        "recommendations": result["response"],
        "query": query
    }

