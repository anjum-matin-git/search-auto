"""
Step 5: Save search history and update user preferences.
"""
from typing import Dict, Any, Optional

from agents.search.state import SearchState
from db.base import SessionLocal
from db.repositories import SearchRepository, SearchResultRepository, UserPreferenceRepository
from core.logging import get_logger

logger = get_logger(__name__)


async def save_history(state: SearchState) -> Dict[str, Any]:
    """
    Save search to history and update user preferences if user is logged in.
    Creates search record and links it to matched cars with rankings.
    
    Args:
        state: Current workflow state with search results
    
    Returns:
        Updated state with 'search_id'
    """
    logger.info("step_save_history_start", user_id=state.get("user_id"))
    logger.info("step_save_history_complete", search_id=None, note="disabled_temporarily")
    return {"search_id": None}


def _update_user_preferences(
    pref_repo: UserPreferenceRepository,
    user_id: int,
    features: Dict[str, Any],
    matched_cars: list
) -> None:
    """Update user preferences based on search history."""
    
    existing_pref = pref_repo.get_by_user(user_id)
    
    preferred_brands = set(existing_pref.preferred_brands or []) if existing_pref else set()
    preferred_types = set(existing_pref.preferred_types or []) if existing_pref else set()
    
    if features.get("brand"):
        preferred_brands.add(features["brand"])
    if features.get("type"):
        preferred_types.add(features["type"])
    
    for car in matched_cars[:3]:
        if car.get("brand"):
            preferred_brands.add(car["brand"])
        if car.get("type"):
            preferred_types.add(car["type"])
    
    pref_repo.create_or_update(
        user_id=user_id,
        preferred_brands=list(preferred_brands),
        preferred_types=list(preferred_types),
        price_range_min=features.get("price_min"),
        price_range_max=features.get("price_max"),
    )
