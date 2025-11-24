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
    
    # For now, return agent's text response
    # TODO: Extract structured car data from agent's tool calls
    return SearchResponse(
        success=not has_error,
        query=request.query,
        count=0,
        results=[],
        search_id=None,
        message=result["response"]
    )


def _build_user_context(user_id: int, user: User, db: Session) -> dict:
    """Build context about the user for personalization."""
    context = {
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

