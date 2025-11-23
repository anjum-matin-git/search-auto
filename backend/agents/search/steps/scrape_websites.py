"""
Step 2: Scrape car listings using Auto.dev API or fallback sources.
"""
import asyncio
import os
from typing import Dict, Any

from agents.search.state import SearchState
from integrations.autodev_api import AutoDevAPI
from core.logging import get_logger

logger = get_logger(__name__)


async def scrape_websites(state: SearchState) -> Dict[str, Any]:
    """
    Get car listings from Auto.dev API (real dealer inventory).
    
    Args:
        state: Current workflow state with 'extracted_features'
    
    Returns:
        Updated state with scraped car data
    """
    logger.info("step_scrape_websites_start", features=state["extracted_features"])
    
    query_params = state["extracted_features"]
    
    autodev = AutoDevAPI()
    autotrader_cars = await autodev.search_listings(query_params)
    
    if not autotrader_cars:
        logger.error("no_real_cars_found", message="Auto.dev returned no cars - check API key or query params")
        return {
            "autotrader_cars": [],
            "cargurus_cars": [],
            "all_scraped_cars": [],
        }
    
    cargurus_cars = []
    
    all_scraped_cars = autotrader_cars + cargurus_cars
    
    logger.info(
        "step_scrape_websites_complete",
        autotrader_count=len(autotrader_cars),
        cargurus_count=len(cargurus_cars),
        total=len(all_scraped_cars)
    )
    
    return {
        "autotrader_cars": autotrader_cars,
        "cargurus_cars": cargurus_cars,
        "all_scraped_cars": all_scraped_cars,
    }
