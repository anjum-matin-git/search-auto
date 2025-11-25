"""
MarketCheck API integration for car listings.

Provides access to real US dealer inventory with vehicle data and images.
Note: MarketCheck only has US inventory. For Canadian users, we search
nearby US border states.

Documentation: https://docs.marketcheck.com/docs/get-started/api
"""
from typing import List, Dict, Any, Optional
from urllib.parse import quote_plus

import httpx
from tenacity import retry, stop_after_attempt, wait_exponential

from core.config import settings
from core.logging import get_logger

logger = get_logger(__name__)


class MarketCheckAPI:
    """
    Client for MarketCheck Listings API.
    
    Provides access to real dealer inventory across the United States.
    For Canadian users, searches nearby US border states.
    """
    
    BASE_URL = "https://api.marketcheck.com/v2/search/car/active"
    
    def __init__(self):
        """Initialize the MarketCheck API client."""
        self.api_key = settings.marketcheck_api_key
        if not self.api_key:
            logger.warning("marketcheck_api_key_missing")
            self.enabled = False
        else:
            self.enabled = True
            logger.info("marketcheck_client_ready")
    
    @retry(
        stop=stop_after_attempt(3),
        wait=wait_exponential(multiplier=1, min=2, max=10),
        reraise=False
    )
    async def search_listings(self, query_params: Dict[str, Any]) -> List[Dict[str, Any]]:
        """
        Search real dealer listings using MarketCheck API.
        
        Args:
            query_params: Search parameters (brand, model, type, price_max, location, etc.)
        
        Returns:
            List of car dicts with real data and images from dealers
        """
        if not self.enabled:
            logger.warning("marketcheck_disabled")
            return []
        
        logger.info("marketcheck_searching", params=query_params)
        
        try:
            params = self._build_api_params(query_params)
            
            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.get(
                    self.BASE_URL,
                    params=params
                )
                response.raise_for_status()
                
                data = response.json()
                # MarketCheck API returns listings in different formats
                listings = data.get("listings", []) or data.get("results", []) or []
                
                logger.info("marketcheck_search_success", listings_found=len(listings))
                
                cars = self._convert_listings_to_car_format(listings, query_params)
                return cars
                
        except Exception as e:
            logger.error("marketcheck_search_failed", error=str(e), exc_info=True)
            return []
    
    def _build_api_params(self, query_params: Dict[str, Any]) -> Dict[str, Any]:
        """
        Build MarketCheck API request parameters.
        
        MarketCheck is a US-focused API. For location filtering:
        - US searches: Use zip code with radius (miles)
        - Canadian searches: Use state filter for nearby US states
        
        Args:
            query_params: Search parameters from our application
            
        Returns:
            Dict of parameters for MarketCheck API
        """
        params = {
            "api_key": self.api_key,
            "car_type": "used",
            "seller_type": "dealer",
        }
        
        # Vehicle filters
        if query_params.get("brand"):
            params["make"] = query_params["brand"]
        
        if query_params.get("model"):
            params["model"] = query_params["model"]
        
        if query_params.get("price_max"):
            params["price_range_max"] = query_params["price_max"]
        
        if query_params.get("price_min"):
            params["price_range_min"] = query_params["price_min"]
        
        if query_params.get("year_min"):
            params["year"] = query_params["year_min"]
        
        if query_params.get("year_max"):
            params["year_max"] = query_params["year_max"]
        
        # Location filtering - MarketCheck only has US inventory
        self._add_location_params(params, query_params)
        
        # Pagination
        params["rows"] = query_params.get("limit", 20)
        page = query_params.get("page", 1)
        params["start"] = (page - 1) * params["rows"]
        
        return params
    
    def _add_location_params(self, params: Dict[str, Any], query_params: Dict[str, Any]) -> None:
        """
        Add location parameters for geographic filtering.
        
        MarketCheck supports: zip, city, state, latitude/longitude with radius.
        Radius is in miles.
        """
        country = (query_params.get("country") or "US").upper()
        postal_code = query_params.get("postal_code", "")
        location = query_params.get("location", "")
        radius_miles = query_params.get("radius_km", 100)  # Default 100 miles
        
        # For US searches with valid ZIP code
        if country == "US" and postal_code:
            clean_zip = postal_code.strip().replace(" ", "")
            if clean_zip.isdigit() and len(clean_zip) == 5:
                params["zip"] = clean_zip
                params["radius"] = radius_miles
                logger.debug("marketcheck_location_zip", zip=clean_zip, radius=radius_miles)
                return
        
        # For Canadian searches, use nearby US border states
        if country == "CA":
            border_state = self._get_us_border_state_for_canada(location, postal_code)
            if border_state:
                params["state"] = border_state
                logger.debug("marketcheck_location_border_state", state=border_state)
                return
        
        # Try city/state from location string
        if location:
            location_clean = location.strip()
            # Check if it's a US state abbreviation or name
            us_state = self._extract_us_state(location_clean)
            if us_state:
                params["state"] = us_state
                logger.debug("marketcheck_location_state", state=us_state)
                return
            # Otherwise use city filter
            params["city"] = location_clean
            logger.debug("marketcheck_location_city", city=location_clean)
            return
        
        # No location specified - return nationwide results
        logger.debug("marketcheck_location_nationwide")
    
    def _get_us_border_state_for_canada(self, location: str, postal_code: str) -> Optional[str]:
        """
        Map Canadian locations to nearby US border states for search.
        
        Returns US state code for the closest border state.
        """
        location_lower = (location or "").lower()
        postal_prefix = (postal_code or "").upper()[:1]
        
        # Map Canadian regions to nearby US states
        canada_to_us_state = {
            # British Columbia -> Washington
            "vancouver": "WA", "victoria": "WA", "bc": "WA",
            # Alberta -> Montana
            "calgary": "MT", "edmonton": "MT", "alberta": "MT",
            # Ontario -> Michigan/New York
            "toronto": "NY", "ottawa": "NY", "ontario": "MI",
            # Quebec -> New York/Vermont
            "montreal": "NY", "quebec": "VT",
            # Manitoba -> North Dakota
            "winnipeg": "ND", "manitoba": "ND",
        }
        
        for city, state in canada_to_us_state.items():
            if city in location_lower:
                return state
        
        # Fallback by postal code prefix
        postal_to_state = {
            "V": "WA",  # BC
            "T": "MT",  # Alberta
            "M": "NY",  # Toronto
            "K": "NY",  # Ottawa
            "H": "NY",  # Montreal
            "R": "ND",  # Manitoba
        }
        
        return postal_to_state.get(postal_prefix)
    
    def _extract_us_state(self, location: str) -> Optional[str]:
        """Extract US state code from location string."""
        us_states = {
            "alabama": "AL", "alaska": "AK", "arizona": "AZ", "arkansas": "AR",
            "california": "CA", "colorado": "CO", "connecticut": "CT", "delaware": "DE",
            "florida": "FL", "georgia": "GA", "hawaii": "HI", "idaho": "ID",
            "illinois": "IL", "indiana": "IN", "iowa": "IA", "kansas": "KS",
            "kentucky": "KY", "louisiana": "LA", "maine": "ME", "maryland": "MD",
            "massachusetts": "MA", "michigan": "MI", "minnesota": "MN", "mississippi": "MS",
            "missouri": "MO", "montana": "MT", "nebraska": "NE", "nevada": "NV",
            "new hampshire": "NH", "new jersey": "NJ", "new mexico": "NM", "new york": "NY",
            "north carolina": "NC", "north dakota": "ND", "ohio": "OH", "oklahoma": "OK",
            "oregon": "OR", "pennsylvania": "PA", "rhode island": "RI", "south carolina": "SC",
            "south dakota": "SD", "tennessee": "TN", "texas": "TX", "utah": "UT",
            "vermont": "VT", "virginia": "VA", "washington": "WA", "west virginia": "WV",
            "wisconsin": "WI", "wyoming": "WY"
        }
        
        location_lower = location.lower().strip()
        
        # Check if it's a state abbreviation (2 letters)
        if len(location_lower) == 2 and location_lower.upper() in us_states.values():
            return location_lower.upper()
        
        # Check if it contains a state name
        for state_name, code in us_states.items():
            if state_name in location_lower:
                return code
        
        return None
    
    def _convert_listings_to_car_format(self, listings: List[Dict], query_params: Dict[str, Any] = None) -> List[Dict[str, Any]]:
        """Convert MarketCheck listings to our car format."""
        cars = []
        target_country = (query_params or {}).get("country") or "US"
        currency_prefix = "C$" if target_country == "CA" else "$"
        
        for listing in listings:
            try:
                vin = listing.get("vin", "")
                raw_price = listing.get("price", 0)
                
                # Handle price
                if isinstance(raw_price, str):
                    try:
                        raw_price = int(raw_price.replace("$", "").replace(",", "").strip())
                    except (ValueError, TypeError):
                        logger.warning("marketcheck_invalid_price", price=raw_price, vin=vin)
                        continue
                elif not isinstance(raw_price, (int, float)):
                    logger.warning("marketcheck_unexpected_price_type", price=raw_price, vin=vin)
                    continue
                
                if not raw_price or raw_price <= 0:
                    continue
                
                # Build info is nested under 'build' object
                build = listing.get("build", {}) or {}
                year = build.get("year") or listing.get("year", 2023)
                make = build.get("make") or listing.get("make", "Unknown")
                model = build.get("model") or listing.get("model", "Car")
                trim = build.get("trim") or listing.get("trim", "")
                body_type = build.get("body_type") or listing.get("body_type", "")
                transmission = build.get("transmission") or listing.get("transmission", "")
                engine = build.get("engine") or listing.get("engine", "")
                fuel_type = build.get("fuel_type") or listing.get("fuel_type", "")
                drivetrain = build.get("drivetrain") or listing.get("drivetrain", "")
                
                mileage = listing.get("miles", 0) or listing.get("mileage", 0)
                
                # Get images from MarketCheck - nested under 'media'
                images = []
                media = listing.get("media", {})
                if isinstance(media, dict):
                    photo_list = media.get("photo_links", []) or media.get("photos", [])
                    if isinstance(photo_list, list):
                        images = [img for img in photo_list if isinstance(img, str) and img]
                
                # Filter out invalid URLs (SVGs, etc.)
                if images:
                    images = [
                        img for img in images 
                        if img and isinstance(img, str) and not img.lower().endswith('.svg')
                    ]
                
                # Dealer info is nested under 'dealer' object
                dealer = listing.get("dealer", {}) or {}
                dealer_name = dealer.get("name") or listing.get("dealer_name", "Auto Dealer")
                dealer_city = dealer.get("city") or listing.get("city", "")
                dealer_state = dealer.get("state") or listing.get("state", "")
                dealer_phone = dealer.get("phone") or listing.get("dealer_phone", "")
                dealer_street = dealer.get("street") or listing.get("dealer_address", "")
                dealer_zip = dealer.get("zip") or ""
                dealer_address = f"{dealer_street}, {dealer_city}, {dealer_state} {dealer_zip}".strip(", ")
                
                region_suffix = ", Canada" if target_country == "CA" else ""
                full_location = f"{dealer_city}, {dealer_state}{region_suffix}" if dealer_city else f"{dealer_state}{region_suffix}" or "Unknown Location"
                
                # Extract features from listing and build data
                features = []
                exterior_color = listing.get("exterior_color") or listing.get("base_ext_color")
                interior_color = listing.get("interior_color") or listing.get("base_int_color")
                
                if exterior_color:
                    features.append(f"{exterior_color} Exterior")
                if interior_color:
                    features.append(f"{interior_color} Interior")
                if body_type:
                    features.append(body_type.title())
                if transmission:
                    features.append(transmission)
                if drivetrain:
                    features.append(drivetrain)
                if engine:
                    features.append(engine)
                
                # Build description
                description = f"{year} {make} {model}"
                if trim:
                    description += f" {trim}"
                if body_type:
                    description += f" - {body_type}"
                
                # Get dealer listing URL - prioritize actual dealer URLs from MarketCheck
                # MarketCheck provides direct links to dealer listings
                # Check both snake_case and camelCase field names
                source_url = (
                    listing.get("vdp_url") or listing.get("vdpUrl") or  # Vehicle Detail Page - direct link to specific car listing
                    listing.get("inventory_url") or listing.get("inventoryUrl") or  # Dealer inventory page
                    listing.get("dealer_url") or listing.get("dealerUrl") or  # Dealer website
                    listing.get("dealer_website") or listing.get("dealerWebsite") or  # Alternative dealer website field
                    listing.get("listing_url") or listing.get("listingUrl") or  # Listing URL
                    listing.get("url") or  # Generic URL field
                    None
                )
                
                # Validate URL - ensure it's a proper HTTP/HTTPS URL
                if source_url and isinstance(source_url, str):
                    source_url = source_url.strip()
                    if not (source_url.startswith("http://") or source_url.startswith("https://")):
                        source_url = None
                
                # Fall back to Google search only if no valid dealer URL is available
                if not source_url:
                    search_parts = [str(year), make, model, dealer_name]
                    if dealer_city:
                        search_parts.append(dealer_city)
                    if dealer_state:
                        search_parts.append(dealer_state)
                    search_query = " ".join(filter(None, search_parts))
                    source_url = f"https://www.google.com/search?q={quote_plus(search_query)}"
                    logger.debug("marketcheck_using_google_fallback", vin=vin, dealer=dealer_name)
                else:
                    logger.debug("marketcheck_using_dealer_url", vin=vin, url=source_url[:100] if len(source_url) > 100 else source_url)
                
                converted_price = raw_price
                if target_country == "CA" and isinstance(raw_price, (int, float)):
                    converted_price = int(raw_price * 1.35)
                
                logger.debug(
                    "marketcheck_listing_parsed",
                    make=make,
                    model=model,
                    year=year,
                    price=converted_price
                )
                
                # MPG from build object
                highway_mpg = build.get("highway_mpg")
                city_mpg = build.get("city_mpg")
                mpg_str = None
                if highway_mpg and city_mpg:
                    mpg_str = f"{city_mpg}/{highway_mpg} mpg"
                elif highway_mpg:
                    mpg_str = f"{highway_mpg} mpg hwy"
                
                car = {
                    "brand": make,
                    "model": model,
                    "year": year,
                    "price": converted_price,
                    "mileage": mileage,
                    "location": full_location,
                    "dealer_name": dealer_name,
                    "dealer_phone": dealer_phone,
                    "dealer_address": dealer_address,
                    "source": "MarketCheck",
                    "sourceUrl": source_url,
                    "description": description,
                    "features": features if features else ["Well Maintained"],
                    "images": images[:8] if images else [],
                    "vin": vin,
                    "fuel_type": fuel_type,
                    "transmission": transmission,
                    "drivetrain": drivetrain,
                    "power": build.get("horsepower") or engine,
                    "mpg": mpg_str,
                }
                
                if target_country == "CA" and isinstance(car["price"], (int, float)):
                    car["display_currency"] = "CAD"
                cars.append(car)
                
            except Exception as e:
                logger.warning("marketcheck_listing_conversion_failed", error=str(e))
                continue
        
        return cars
