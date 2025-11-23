"""
Step 5: Save search history and update user preferences.
"""
from typing import Dict, Any, Optional

from agents.search.state import SearchState
from db.base import SessionLocal
from db.models import Search, SearchResult
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
    user_id = state.get("user_id")
    logger.info("step_save_history_start", user_id=user_id)
    
    # Only save history for authenticated users
    if not user_id:
        logger.info("step_save_history_complete", search_id=None, note="no_user_id")
        return {"search_id": None}
    
    query = state.get("query")
    features = state.get("features", {})
    matched_cars = state.get("matched_cars", [])
    
    if not query or not matched_cars:
        logger.info("step_save_history_complete", search_id=None, note="no_query_or_cars")
        return {"search_id": None}
    
    db = SessionLocal()
    try:
        search_repo = SearchRepository(db)
        result_repo = SearchResultRepository(db)
        
        # Create search record WITHOUT committing (atomic transaction)
        search = Search(
            user_id=user_id,
            query=query,
            extracted_features=features
        )
        db.add(search)
        db.flush()  # Get ID without committing
        
        # Prepare search results data
        search_id_int = int(search.id)  # type: ignore
        results_data = []
        for rank, car in enumerate(matched_cars, start=1):
            car_id = car.get("id")
            match_score = car.get("score", 0.0)
            
            if car_id:
                results_data.append({
                    "search_id": search_id_int,
                    "car_id": car_id,
                    "match_score": match_score,
                    "rank": rank
                })
        
        # Create all search results
        if results_data:
            for result_data in results_data:
                result = SearchResult(**result_data)
                db.add(result)
        
        # Commit both search and results atomically
        db.commit()
        logger.info("step_save_history_complete", search_id=search.id, matched_count=len(matched_cars))
        
        # Update user preferences
        if features:
            try:
                pref_repo = UserPreferenceRepository(db)
                _update_user_preferences(pref_repo, user_id, features, matched_cars)
                db.commit()
            except Exception as e:
                logger.error("preference_update_error", error=str(e))
                # Don't fail the whole workflow if preference update fails
        
        return {"search_id": search.id}
        
    except Exception as e:
        logger.error("save_history_error", error=str(e))
        db.rollback()
        # Don't fail the search if history saving fails
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
