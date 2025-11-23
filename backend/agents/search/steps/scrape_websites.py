"""
Step 2: Scrape AutoTrader and CarGurus in parallel.
"""
import asyncio
import os
from typing import Dict, Any

from agents.search.state import SearchState
from integrations.web_scraper import WebScraper
from integrations.apify_scraper import ApifyScraper
from core.logging import get_logger

logger = get_logger(__name__)


async def scrape_websites(state: SearchState) -> Dict[str, Any]:
    """
    Scrape car listings from AutoTrader and CarGurus concurrently.
    Uses Apify if API key is available, otherwise falls back to mock data.
    
    Args:
        state: Current workflow state with 'extracted_features'
    
    Returns:
        Updated state with scraped car data
    """
    logger.info("step_scrape_websites_start", features=state["extracted_features"])
    
    query_params = state["extracted_features"]
    
    scraper = WebScraper()
    
    if os.getenv("APIFY_API_KEY"):
        logger.info("trying_apify_scraper")
        apify = ApifyScraper()
        autotrader_cars = await apify.scrape_autotrader(query_params)
        
        if not autotrader_cars:
            logger.info("apify_returned_no_cars_falling_back_to_mock")
            autotrader_cars = await scraper.scrape_autotrader(query_params)
        
        cargurus_cars = await scraper.scrape_cargurus(query_params)
    else:
        logger.info("using_mock_scraper")
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
