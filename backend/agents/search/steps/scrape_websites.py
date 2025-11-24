"""
Step 2: Scrape car listings using multiple sources.
"""
import re
from typing import Dict, Any, List
import asyncio

from agents.search.state import SearchState
from integrations.autodev_api import AutoDevAPI
from integrations.autotrader_ca import AutoTraderCA
from integrations.autotrader_scraper import AutoTraderScraper
from integrations.kijiji_scraper import KijijiScraper
from integrations.cargurus_scraper import CarGurusScraper
from core.logging import get_logger

logger = get_logger(__name__)


async def scrape_websites(state: SearchState) -> Dict[str, Any]:
    """
    Get car listings from AutoTrader.ca (for Canada) or Auto.dev API (for US).
    
    Args:
        state: Current workflow state with 'extracted_features'
    
    Returns:
        Updated state with scraped car data
    """
    logger.info("step_scrape_websites_start", features=state["extracted_features"])
    
    features = state.get("extracted_features", {}) or {}
    
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
    
    state["extracted_features"] = features
    query_params = features
    
    # Determine if this is a Canadian query
    country = query_params.get("country", "CA")
    is_canadian = country == "CA"
    
    logger.info(
        "scrape_websites_routing",
        country=country,
        is_canadian=is_canadian,
        location=query_params.get("location"),
        brand=query_params.get("brand"),
        model=query_params.get("model")
    )
    
    autotrader_cars = []
    
    if is_canadian:
        # Drop non-Canadian postal codes so we can resolve from location
        postal_code = query_params.get("postal_code")
        if postal_code and not _is_canadian_postal(postal_code):
            logger.info(
                "dropping_non_canadian_postal",
                postal_code=postal_code,
                location=query_params.get("location"),
            )
            query_params.pop("postal_code", None)
        
        # Use multiple Canadian sources in parallel
        logger.info("using_canadian_sources", params=query_params)
        
        # Extract search parameters
        make = query_params.get("brand")
        model = query_params.get("model")
        location = query_params.get("location")
        postal = query_params.get("postal_code")
        
        # Run all scrapers in parallel
        autotrader_scraper = AutoTraderScraper()
        kijiji_scraper = KijijiScraper()
        cargurus_scraper = CarGurusScraper()
        
        results = await asyncio.gather(
            autotrader_scraper.search(make, model, location, postal, max_results=30),
            kijiji_scraper.search(make, model, location, postal, max_results=20),
            cargurus_scraper.search(make, model, location, postal, max_results=20),
            return_exceptions=True
        )
        
        # Combine results from all sources
        for result in results:
            if isinstance(result, list):
                autotrader_cars.extend(result)
        
        logger.info(
            "canadian_scrapers_complete",
            total_results=len(autotrader_cars),
            sources=["AutoTrader.ca", "Kijiji", "CarGurus"]
        )
        
        # If no results from scrapers, try Auto.dev as fallback
        if not autotrader_cars:
            logger.warning("all_scrapers_failed", message="Trying Auto.dev as fallback")
            autodev = AutoDevAPI()
            autotrader_cars = await autodev.search_listings(query_params)
            autotrader_cars = _filter_canadian_only(autotrader_cars)
    else:
        # Use Auto.dev for US queries
        logger.info("using_autodev", params=query_params)
        autodev = AutoDevAPI()
        autotrader_cars = await autodev.search_listings(query_params)
    
    # Log sample of brands before filtering
    if autotrader_cars and query_params.get("brand"):
        sample_brands = [(car.get("brand"), car.get("model")) for car in autotrader_cars[:5]]
        logger.info(
            "sample_brands_before_filter",
            required_brand=query_params.get("brand"),
            required_model=query_params.get("model"),
            sample_brands=sample_brands
        )
    
    # Apply brand/model filtering if specified
    if query_params.get("brand"):
        autotrader_cars = _filter_by_brand(autotrader_cars, query_params["brand"])
    
    if query_params.get("model"):
        autotrader_cars = _filter_by_model(autotrader_cars, query_params["model"])
    
    if not autotrader_cars:
        logger.warning(
            "no_real_cars_found",
            message="No cars found matching criteria",
            brand=query_params.get("brand"),
            model=query_params.get("model"),
            location=query_params.get("location")
        )
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
        total=len(all_scraped_cars),
        source="AutoTrader.ca" if is_canadian else "Auto.dev"
    )
    
    return {
        "autotrader_cars": autotrader_cars,
        "cargurus_cars": cargurus_cars,
        "all_scraped_cars": all_scraped_cars,
    }


def _filter_canadian_only(cars: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """Filter out non-Canadian listings by checking location for Canadian provinces."""
    canadian_provinces = [
        "BC", "AB", "SK", "MB", "ON", "QC", "NB", "NS", "PE", "NL", "YT", "NT", "NU",
        "British Columbia", "Alberta", "Saskatchewan", "Manitoba", "Ontario", "Quebec",
        "New Brunswick", "Nova Scotia", "Prince Edward Island", "Newfoundland",
        "Yukon", "Northwest Territories", "Nunavut"
    ]
    
    filtered = []
    for car in cars:
        location = car.get("location", "")
        # Check if location contains any Canadian province
        if any(province in location for province in canadian_provinces):
            filtered.append(car)
        elif "Canada" in location:
            filtered.append(car)
    
    logger.info(
        "filtered_canadian_only",
        original_count=len(cars),
        filtered_count=len(filtered),
        removed=len(cars) - len(filtered)
    )
    
    return filtered


def _is_canadian_postal(postal_code: str) -> bool:
    """Check if a postal code looks like a Canadian FSA format."""
    if not isinstance(postal_code, str):
        return False
    normalized = postal_code.strip().upper()
    pattern = re.compile(r"^[ABCEGHJ-NPRSTVXY]\d[ABCEGHJ-NPRSTV-Z]\s?\d[ABCEGHJ-NPRSTV-Z]\d$")
    return bool(pattern.match(normalized))


def _filter_by_brand(cars: List[Dict[str, Any]], required_brand: str) -> List[Dict[str, Any]]:
    """
    Filter cars to only include the specified brand.
    Handles special cases like "Range Rover" (which is a Land Rover model).
    """
    required_brand_lower = required_brand.lower().strip()
    
    # Special brand mappings for common cases
    brand_aliases = {
        "range rover": ["land rover", "range rover"],
        "land rover": ["land rover", "range rover"],
    }
    
    # Get list of acceptable brands
    acceptable_brands = brand_aliases.get(required_brand_lower, [required_brand_lower])
    
    filtered = []
    for car in cars:
        car_brand = (car.get("brand") or "").lower().strip()
        car_model = (car.get("model") or "").lower().strip()
        car_title = f"{car_brand} {car_model}".lower()
        
        # Check if any acceptable brand matches
        match_found = False
        for acceptable in acceptable_brands:
            if acceptable in car_brand or acceptable in car_title:
                match_found = True
                break
        
        # Also check if the required brand is in the full title
        if not match_found and required_brand_lower in car_title:
            match_found = True
        
        if match_found:
            filtered.append(car)
    
    logger.info(
        "filtered_by_brand",
        required_brand=required_brand,
        original_count=len(cars),
        filtered_count=len(filtered),
        removed=len(cars) - len(filtered)
    )
    
    return filtered


def _filter_by_model(cars: List[Dict[str, Any]], required_model: str) -> List[Dict[str, Any]]:
    """
    Filter cars to only include the specified model.
    Uses fuzzy matching to handle variations.
    """
    required_model_lower = required_model.lower().strip()
    
    # Split into words for partial matching
    required_words = set(required_model_lower.split())
    
    filtered = []
    for car in cars:
        car_model = (car.get("model") or "").lower().strip()
        car_title = f"{car.get('brand', '')} {car_model}".lower()
        
        # Check if model is in the car's model field or title
        if required_model_lower in car_model or required_model_lower in car_title:
            filtered.append(car)
            continue
        
        # Check if all required words are present (for multi-word models)
        car_words = set(car_title.split())
        if required_words.issubset(car_words):
            filtered.append(car)
            continue
    
    logger.info(
        "filtered_by_model",
        required_model=required_model,
        original_count=len(cars),
        filtered_count=len(filtered),
        removed=len(cars) - len(filtered)
    )
    
    return filtered
