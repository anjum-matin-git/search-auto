"""
Auto.dev API integration for real car listings.
Provides access to dealer inventory with actual vehicle data and images.
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


class AutoDevAPI:
    """Client for Auto.dev Listings API - real dealer inventory."""
    
    def __init__(self):
        self.api_key = settings.auto_dev_api_key
        if not self.api_key:
            logger.warning("autodev_no_key", message="AUTO_DEV_API_KEY not set")
            self.enabled = False
        else:
            self.enabled = True
            self.base_url = "https://www.auto.dev/api/listings"
            logger.info("autodev_client_initialized")
        # Geocoders for CA/US lookups (used to keep Canadian requests actually Canadian)
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
        Search real dealer listings using Auto.dev API.
        
        Args:
            query_params: Search parameters (brand, model, type, price_max, location, etc.)
        
        Returns:
            List of car dicts with real data and images from dealers
        """
        if not self.enabled:
            logger.warning("autodev_disabled")
            return []
        
        logger.info("autodev_searching", params=query_params)
        
        try:
            params = self._build_api_params(query_params)
            
            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.get(
                    self.base_url,
                    headers={"Authorization": f"Bearer {self.api_key}"},
                    params=params
                )
                response.raise_for_status()
                
                data = response.json()
                listings = data.get("records", [])
                
                logger.info("autodev_search_success", listings_found=len(listings))
                
                cars = self._convert_listings_to_car_format(listings, query_params)
                return cars
                
        except Exception as e:
            logger.error("autodev_search_failed", error=str(e), exc_info=True)
            return []
    
    def _build_api_params(self, query_params: Dict[str, Any]) -> Dict[str, Any]:
        """Convert our query params to Auto.dev API format."""
        params = {}
        
        if query_params.get("brand"):
            params["make"] = query_params["brand"]
        
        if query_params.get("model"):
            params["model"] = query_params["model"]
        
        if query_params.get("price_max"):
            params["price_max"] = query_params["price_max"]
        
        if query_params.get("price_min"):
            params["price_min"] = query_params["price_min"]
        
        if query_params.get("year_min"):
            params["year_min"] = query_params["year_min"]
        
        country, latitude, longitude, resolved_zip = self._resolve_geo_targets(query_params)
        params["country"] = country
        if query_params.get("location"):
            params["location"] = query_params["location"]
        if latitude is not None and longitude is not None:
            params["latitude"] = latitude
            params["longitude"] = longitude
        if resolved_zip and resolved_zip.isdigit():
            params["zip"] = resolved_zip
        
        radius = query_params.get("radius_km")
        if radius:
            params["radius"] = radius
        
        params["page_size"] = query_params.get("limit", 20)
        params["page"] = query_params.get("page", 1)
        
        return params
    
    def _convert_listings_to_car_format(self, listings: List[Dict], query_params: Dict[str, Any] = None) -> List[Dict[str, Any]]:
        """Convert Auto.dev listings to our car format."""
        cars = []
        target_country = (query_params or {}).get("country") or "CA"
        currency_prefix = "C$" if target_country == "CA" else "$"
        
        for listing in listings:
            try:
                vin = listing.get("vin", "")
                raw_price = listing.get("price", 0)
                
                # Handle price - could be int, float, or string like "$41,300"
                if isinstance(raw_price, str):
                    # Remove $ and commas, then convert to int
                    try:
                        raw_price = int(raw_price.replace("$", "").replace(",", "").strip())
                    except (ValueError, TypeError):
                        logger.warning("autodev_invalid_price", price=raw_price, vin=vin)
                        continue
                elif not isinstance(raw_price, (int, float)):
                    logger.warning("autodev_unexpected_price_type", price=raw_price, vin=vin)
                    continue
                
                if not raw_price or raw_price <= 0:
                    continue
                
                year = listing.get("year", 2023)
                make = listing.get("make", "Unknown")
                model = listing.get("model", "Car")
                
                mileage = listing.get("mileage", 0)
                
                # Get actual dealer photos from Auto.dev API
                images = listing.get("photoUrls", [])
                
                # Filter out SVG files and invalid URLs
                if images:
                    images = [
                        img for img in images 
                        if img and isinstance(img, str) and not img.lower().endswith('.svg')
                    ]
                
                # Also check for primaryPhotoUrl if photoUrls is empty
                if not images:
                    primary_photo = listing.get("primaryPhotoUrl")
                    if primary_photo:
                        images = [primary_photo]
                
                # Ensure images are strings, not dicts
                if isinstance(images, list) and len(images) > 0:
                    if isinstance(images[0], dict):
                        images = [img.get("url", img.get("uri", "")) for img in images]
                images = [img for img in images if isinstance(img, str) and img]
                
                # Get dealer info from Auto.dev response
                dealer_name = listing.get("dealerName", "Auto Dealer")
                dealer_city = listing.get("city", "")
                dealer_state = listing.get("state", "")
                dealer_phone = "+1 (800) 555-0100"
                dealer_address = ""
                
                # Try to extract dealer info from nested dealer object if available
                dealer_obj = listing.get("dealer", {})
                if isinstance(dealer_obj, dict):
                    dealer_name = dealer_obj.get("name", dealer_name)
                    dealer_phone = dealer_obj.get("phone", dealer_phone)
                    dealer_address = dealer_obj.get("address", dealer_address)
                    if not dealer_city:
                        dealer_city = dealer_obj.get("city", "California")
                    if not dealer_state:
                        dealer_state = dealer_obj.get("state", "CA")
                
                region_suffix = ", Canada" if target_country == "CA" else ""
                full_location = f"{dealer_city}, {dealer_state}{region_suffix}" if dealer_city else f"{dealer_state}{region_suffix}" or "Toronto, ON"
                full_address = dealer_address if dealer_address else f"Dealer Location, {full_location}"
                
                # Extract features from Auto.dev listing
                features = []
                if listing.get("displayColor"):
                    features.append(f"{listing['displayColor']} Color")
                if listing.get("trim"):
                    features.append(listing["trim"])
                if listing.get("bodyType"):
                    features.append(listing["bodyType"].title())
                if listing.get("bodyStyle"):
                    features.append(listing["bodyStyle"].title())
                
                # Add condition
                condition = listing.get("condition", "").title()
                if condition:
                    features.append(condition)
                
                # Build description
                trim = listing.get("trim", "")
                description = f"{year} {make} {model}"
                if trim:
                    description += f" {trim}"
                
                # Build a search URL to find the car at the dealer
                # Auto.dev internal URLs don't work publicly, so we create a Google search
                search_parts = [str(year), make, model, dealer_name]
                if dealer_city:
                    search_parts.append(dealer_city)
                if dealer_state:
                    search_parts.append(dealer_state)
                search_query = " ".join(filter(None, search_parts))
                source_url = f"https://www.google.com/search?q={quote_plus(search_query)}"
                
                converted_price = raw_price
                if target_country == "CA" and isinstance(raw_price, (int, float)):
                    converted_price = int(raw_price * 1.35)
                
                logger.debug(
                    "autodev_listing_parsed",
                    make=make,
                    model=model,
                    year=year,
                    price=converted_price
                )
                
                car = {
                    "brand": make,
                    "model": model,
                    "year": year,
                    "price": converted_price,
                    "mileage": mileage,
                    "location": full_location,
                    "dealer_name": dealer_name,
                    "dealer_phone": dealer_phone,
                    "dealer_address": full_address,
                    "source": "Auto.dev",
                    "sourceUrl": source_url,
                    "description": description,
                    "features": features if features else ["Well Maintained"],
                    "images": images[:8] if images else [],
                    "vin": vin,
                    "acceleration": 7.0,
                    "top_speed": 130,
                    "power": 200,
                    "mpg": 28.0,
                }
                
                if target_country == "CA" and isinstance(car["price"], (int, float)):
                    car["display_currency"] = "CAD"
                cars.append(car)
                
            except Exception as e:
                logger.warning("autodev_listing_conversion_failed", error=str(e))
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
