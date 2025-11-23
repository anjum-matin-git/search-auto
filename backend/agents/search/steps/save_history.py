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
    
    if not state.get("user_id"):
        logger.info("step_save_history_skipped", reason="no_user_id")
        return {"search_id": None}
    
    db = SessionLocal()
    search_repo = SearchRepository(db)
    result_repo = SearchResultRepository(db)
    pref_repo = UserPreferenceRepository(db)
    
    try:
        search = search_repo.create(
            user_id=state["user_id"],
            query=state["query"],
            extracted_features=state["extracted_features"]
        )
        
        results_data = []
        for idx, (car, score) in enumerate(zip(state["matched_cars"], state["match_scores"])):
            results_data.append({
                "search_id": search.id,
                "car_id": car["id"],
                "match_score": score,
                "rank": idx + 1,
            })
        
        if results_data:
            result_repo.bulk_create(results_data)
        
        try:
            _update_user_preferences(
                pref_repo,
                state["user_id"],
                state["extracted_features"],
                state["matched_cars"]
            )
        except Exception as e:
            logger.warning("preferences_update_failed", error=str(e))
        
        logger.info("step_save_history_complete", search_id=search.id)
        
        return {
            "search_id": search.id,
        }
        
    except Exception as e:
        logger.error("step_save_history_failed", error=str(e), exc_info=True)
        return {"search_id": None}
    finally:
        db.close()


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
