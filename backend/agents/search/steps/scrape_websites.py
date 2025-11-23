"""
Step 2: Scrape AutoTrader and CarGurus in parallel.
"""
import asyncio
from typing import Dict, Any

from agents.search.state import SearchState
from integrations.web_scraper import WebScraper
from core.logging import get_logger

logger = get_logger(__name__)


async def scrape_websites(state: SearchState) -> Dict[str, Any]:
    """
    Scrape car listings from AutoTrader and CarGurus concurrently.
    Uses extracted features to build search parameters.
    
    Args:
        state: Current workflow state with 'extracted_features'
    
    Returns:
        Updated state with scraped car data
    """
    logger.info("step_scrape_websites_start", features=state["extracted_features"])
    
    scraper = WebScraper()
    query_params = state["extracted_features"]
    
    autotrader_task = scraper.scrape_autotrader(query_params)
    cargurus_task = scraper.scrape_cargurus(query_params)
    
    autotrader_cars, cargurus_cars = await asyncio.gather(
        autotrader_task,
        cargurus_task,
        return_exceptions=False
    )
    
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
