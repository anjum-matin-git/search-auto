"""
MarketCheck API integration for car listings.
Provides access to real dealer inventory with vehicle data and images.
Documentation: https://docs.marketcheck.com/docs/get-started/api
"""
from typing import List, Dict, Any, Optional
from urllib.parse import quote_plus
import math

import httpx
import pgeocode
from tenacity import retry, stop_after_attempt, wait_exponential

from core.config import settings
from core.logging import get_logger

logger = get_logger(__name__)


CANADIAN_CITY_POSTALS = {
    "vancouver": "V5K",
    "toronto": "M5H",
    "montreal": "H1A",
    "calgary": "T2P",
    "ottawa": "K1A",
    "edmonton": "T5J",
    "winnipeg": "R3C",
    "mississauga": "L5B",
    "victoria": "V8W",
    "hamilton": "L8P",
}


class MarketCheckAPI:
    """Client for MarketCheck Listings API - real dealer inventory."""
    
    def __init__(self):
        self.api_key = settings.marketcheck_api_key
        if not self.api_key:
            logger.warning("marketcheck_no_key", message="MARKETCHECK_API_KEY not set")
            self.enabled = False
        else:
            self.enabled = True
            self.base_url = "https://api.marketcheck.com/v2/search/car/active"
            logger.info("marketcheck_client_initialized")
        # Geocoders for CA/US lookups
        self.geocoders = {
            "CA": pgeocode.Nominatim("ca"),
            "US": pgeocode.Nominatim("us"),
        }
    
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
                    self.base_url,
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
        """Convert our query params to MarketCheck API format."""
        params = {
            "api_key": self.api_key,
        }
        
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
        
        # MarketCheck supports car_type parameter
        params["car_type"] = "used"  # Default to used cars
        
        # Location handling
        country, latitude, longitude, resolved_zip = self._resolve_geo_targets(query_params)
        
        # MarketCheck only accepts US ZIP codes (5 digits)
        # For Canadian searches, use lat/long only
        if resolved_zip and country == "US" and resolved_zip.isdigit() and len(resolved_zip) == 5:
            params["zip"] = resolved_zip
        
        if latitude is not None and longitude is not None:
            params["latitude"] = latitude
            params["longitude"] = longitude
            params["radius"] = query_params.get("radius_km", 150)
        elif not params.get("zip"):
            # Default to a US location if no geo data (avoid 422 errors)
            # Los Angeles as fallback
            params["latitude"] = 34.0522
            params["longitude"] = -118.2437
            params["radius"] = 200
        
        # Pagination
        params["rows"] = query_params.get("limit", 20)
        params["start"] = (query_params.get("page", 1) - 1) * query_params.get("limit", 20)
        
        return params
    
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

    def _resolve_geo_targets(self, query_params: Dict[str, Any]) -> tuple[str, Optional[float], Optional[float], Optional[str]]:
        """Return (country, lat, lon, postal) for API calls."""
        country = (query_params.get("country") or "US").upper()
        postal_code = query_params.get("postal_code")
        location = query_params.get("location")
        lat = lon = None
        resolved_postal = None
        
        if postal_code:
            lookup = self._postal_to_latlon(postal_code, country)
            if lookup:
                lat, lon, resolved_postal = lookup
        
        if (lat is None or lon is None) and location:
            fallback_postal = self._city_to_postal(location, country)
            if fallback_postal:
                lookup = self._postal_to_latlon(fallback_postal, country)
                if lookup:
                    lat, lon, resolved_postal = lookup
        
        return country, lat, lon, resolved_postal

    def _postal_to_latlon(self, postal_code: str, country: str) -> Optional[tuple[float, float, str]]:
        """Use pgeocode to turn postal codes into coordinates."""
        if not postal_code:
            return None
        cleaned = postal_code.replace(" ", "").upper()
        if country == "CA":
            cleaned = cleaned[:3]
        geocoder = self.geocoders.get(country)
        if not geocoder:
            return None
        record = geocoder.query_postal_code(cleaned)
        try:
            lat = float(record.latitude)
            lon = float(record.longitude)
        except (TypeError, ValueError, AttributeError):
            return None
        if math.isnan(lat) or math.isnan(lon):
            return None
        resolved = record.postal_code if getattr(record, "postal_code", None) else cleaned
        return lat, lon, resolved

    def _city_to_postal(self, location: str, country: str) -> Optional[str]:
        """Map major Canadian cities to representative postal prefixes."""
        if not location:
            return None
        location_lower = location.lower()
        if country == "CA":
            for city, postal in CANADIAN_CITY_POSTALS.items():
                if city in location_lower:
                    return postal
        return None

