"""
Step 2: Scrape car listings using Auto.dev API.
Clean, concise implementation using only Auto.dev API.
"""
from typing import Dict, Any

from agents.search.state import SearchState
from integrations.autodev_api import AutoDevAPI
from core.logging import get_logger

logger = get_logger(__name__)


async def scrape_websites(state: SearchState) -> Dict[str, Any]:
    """
    Get car listings from Auto.dev API.
    
    Args:
        state: Current workflow state with 'extracted_features'
    
    Returns:
        Updated state with scraped car data
    """
    logger.info("step_scrape_websites_start", features=state["extracted_features"])
    
    features = state.get("extracted_features", {}) or {}
    
    # Apply user preferences
    preferred_location = state.get("preferred_location")
    preferred_postal = state.get("preferred_postal_code")
    preferred_country = state.get("preferred_country")
    
    if preferred_location and not features.get("location"):
        features["location"] = preferred_location
    if preferred_postal and not features.get("postal_code"):
        features["postal_code"] = preferred_postal
    if preferred_country and not features.get("country"):
        features["country"] = preferred_country
    if "radius_km" not in features:
        features["radius_km"] = 150
    
    query_params = features
    
    # Use Auto.dev API for all searches
    logger.info("using_autodev_api", params=query_params)
    autodev = AutoDevAPI()
    all_scraped_cars = await autodev.search_listings(query_params)
    
    logger.info(
        "step_scrape_websites_complete",
        total_cars=len(all_scraped_cars)
    )
    
    return {
        "all_scraped_cars": all_scraped_cars,
    }
