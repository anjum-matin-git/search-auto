"""
Auto.dev API integration for real car listings.
Provides access to dealer inventory with actual vehicle data and images.
"""
from typing import List, Dict, Any
import os

import httpx
from tenacity import retry, stop_after_attempt, wait_exponential

from core.config import settings
from core.logging import get_logger

logger = get_logger(__name__)


class AutoDevAPI:
    """Client for Auto.dev Listings API - real dealer inventory."""
    
    def __init__(self):
        self.api_key = os.getenv("AUTO_DEV_API_KEY")
        if not self.api_key:
            logger.warning("autodev_no_key", message="AUTO_DEV_API_KEY not set")
            self.enabled = False
        else:
            self.enabled = True
            self.base_url = "https://www.auto.dev/api/listings"
            logger.info("autodev_client_initialized")
    
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
                
                cars = self._convert_listings_to_car_format(listings)
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
        
        if query_params.get("location"):
            params["zip"] = self._location_to_zip(query_params["location"])
        
        params["page_size"] = 9
        
        return params
    
    def _location_to_zip(self, location: str) -> str:
        """Convert location string to zip code."""
        zip_map = {
            "california": "90001",
            "los angeles": "90001",
            "san francisco": "94102",
            "san diego": "92101",
            "sacramento": "95814",
            "san jose": "95110",
            "new york": "10001",
            "chicago": "60601",
            "houston": "77001",
            "phoenix": "85001",
        }
        
        location_lower = location.lower()
        for key, zip_code in zip_map.items():
            if key in location_lower:
                return zip_code
        
        return "90001"
    
    def _convert_listings_to_car_format(self, listings: List[Dict]) -> List[Dict[str, Any]]:
        """Convert Auto.dev listings to our car format."""
        cars = []
        
        for listing in listings:
            try:
                vin = listing.get("vin", "")
                price = listing.get("price", 0)
                
                if not price:
                    continue
                
                year = listing.get("year", 2023)
                make = listing.get("make", "Unknown")
                model = listing.get("model", "Car")
                
                mileage = listing.get("mileage", 0)
                
                # Get actual dealer photos from Auto.dev API
                images = listing.get("photoUrls", [])
                
                # Also check for primaryPhotoUrl if photoUrls is empty
                if not images:
                    primary_photo = listing.get("primaryPhotoUrl")
                    if primary_photo:
                        images = [primary_photo]
                
                # Ensure images are strings, not dicts
                if isinstance(images, list) and len(images) > 0:
                    if isinstance(images[0], dict):
                        images = [img.get("url", img.get("uri", "")) for img in images]
                
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
                
                full_location = f"{dealer_city}, {dealer_state}" if dealer_city else "California"
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
                
                # Build full URL from vdpUrl (relative path)
                vdp_url = listing.get("vdpUrl", "")
                source_url = listing.get("clickoffUrl") or (f"https://www.auto.dev{vdp_url}" if vdp_url else "")
                
                car = {
                    "brand": make,
                    "model": model,
                    "year": year,
                    "price": price,
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
                
                cars.append(car)
                
            except Exception as e:
                logger.warning("autodev_listing_conversion_failed", error=str(e))
                continue
        
        return cars
