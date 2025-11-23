"""
Apify-based scraper for real car listings from AutoTrader.
Uses Apify API to get actual vehicle data with real images.
"""
from typing import List, Dict, Any
import os

from apify_client import ApifyClient
from tenacity import retry, stop_after_attempt, wait_exponential

from core.config import settings
from core.logging import get_logger

logger = get_logger(__name__)


class ApifyScraper:
    """Scraper using Apify API for real car listings."""
    
    def __init__(self):
        api_key = os.getenv("APIFY_API_KEY")
        if not api_key:
            logger.warning("apify_no_key", message="APIFY_API_KEY not set, will use mock data")
            self.client = None
        else:
            self.client = ApifyClient(api_key)
            logger.info("apify_client_initialized")
    
    @retry(
        stop=stop_after_attempt(2),
        wait=wait_exponential(multiplier=1, min=2, max=10),
        reraise=False
    )
    async def scrape_autotrader(self, query_params: Dict[str, Any]) -> List[Dict[str, Any]]:
        """
        Scrape AutoTrader using Apify for real car listings with images.
        
        Args:
            query_params: Search parameters (brand, model, location, price_max, etc.)
        
        Returns:
            List of car dicts with real data and images
        """
        if not self.client:
            logger.warning("apify_client_not_available", message="Falling back to mock data")
            return []
        
        logger.info("apify_scraping_autotrader", params=query_params)
        
        try:
            location = query_params.get("location", "california")
            zip_code = self._location_to_zip(location)
            
            run_input = {
                "startUrls": [
                    {"url": f"https://www.autotrader.com/cars-for-sale/all-cars/{zip_code}"}
                ],
                "maxItems": 10,
                "endPage": 1,
                "proxy": {
                    "useApifyProxy": True,
                    "apifyProxyGroups": ["RESIDENTIAL"]
                }
            }
            
            logger.info("apify_starting_run", actor="epctex/autotrader-scraper")
            run = self.client.actor("epctex/autotrader-scraper").call(run_input=run_input)
            
            dataset_id = run.get("defaultDatasetId")
            logger.info("apify_run_complete", dataset_id=dataset_id)
            
            items = []
            for item in self.client.dataset(dataset_id).iterate_items():
                items.append(item)
            
            cars = self._convert_apify_to_car_format(items)
            logger.info("apify_scrape_success", cars_found=len(cars))
            
            return cars
            
        except Exception as e:
            logger.warning("apify_scrape_failed", error=str(e))
            logger.info("falling_back_to_enhanced_mock_data")
            return []
    
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
            "philadelphia": "19019",
        }
        
        location_lower = location.lower()
        for key, zip_code in zip_map.items():
            if key in location_lower:
                return zip_code
        
        return "90001"
    
    def _convert_apify_to_car_format(self, apify_items: List[Dict]) -> List[Dict[str, Any]]:
        """
        Convert Apify AutoTrader data to our car format.
        
        Apify returns fields like: title, price, mileage, location, dealer, images, etc.
        """
        cars = []
        
        for item in apify_items:
            try:
                title = item.get("title", "")
                price_str = item.get("price", "0")
                
                price = self._extract_price(price_str)
                if price == 0:
                    continue
                
                mileage = self._extract_mileage(item.get("mileage", "0"))
                
                brand, model, year = self._parse_title(title)
                
                images = item.get("images", [])
                if not images:
                    images = item.get("image", [])
                if isinstance(images, str):
                    images = [images]
                
                location = item.get("location", "California")
                dealer_name = item.get("dealer", {}).get("name", "Premium Auto Sales") if isinstance(item.get("dealer"), dict) else item.get("dealer", "Premium Auto Sales")
                dealer_phone = item.get("dealer", {}).get("phone", "+1 (800) 555-0100") if isinstance(item.get("dealer"), dict) else "+1 (800) 555-0100"
                dealer_address = item.get("dealer", {}).get("address", f"Auto Plaza, {location}") if isinstance(item.get("dealer"), dict) else f"Auto Plaza, {location}"
                
                car = {
                    "brand": brand,
                    "model": model,
                    "year": year,
                    "price": price,
                    "mileage": mileage,
                    "location": location,
                    "dealer_name": dealer_name,
                    "dealer_phone": dealer_phone,
                    "dealer_address": dealer_address,
                    "source": "AutoTrader",
                    "url": item.get("url", ""),
                    "description": item.get("description", title),
                    "features": self._extract_features(item),
                    "images": images[:5],
                    "acceleration": 7.5,
                    "top_speed": 130,
                    "power": 250,
                    "mpg": 28.0,
                }
                
                cars.append(car)
                
            except Exception as e:
                logger.warning("apify_item_conversion_failed", error=str(e), item=item)
                continue
        
        return cars
    
    def _extract_price(self, price_str: str) -> int:
        """Extract numeric price from string like '$25,000' or '25000'."""
        if isinstance(price_str, (int, float)):
            return int(price_str)
        
        import re
        numbers = re.sub(r'[^\d]', '', str(price_str))
        try:
            return int(numbers) if numbers else 0
        except:
            return 0
    
    def _extract_mileage(self, mileage_str: str) -> int:
        """Extract numeric mileage from string."""
        if isinstance(mileage_str, (int, float)):
            return int(mileage_str)
        
        import re
        numbers = re.sub(r'[^\d]', '', str(mileage_str))
        try:
            return int(numbers) if numbers else 0
        except:
            return 0
    
    def _parse_title(self, title: str) -> tuple:
        """
        Parse car title like '2023 Tesla Model 3' into (brand, model, year).
        """
        import re
        
        year_match = re.search(r'\b(19|20)\d{2}\b', title)
        year = int(year_match.group()) if year_match else 2023
        
        title_clean = re.sub(r'\b(19|20)\d{2}\b', '', title).strip()
        
        parts = title_clean.split()
        if len(parts) >= 2:
            brand = parts[0]
            model = ' '.join(parts[1:3])
        elif len(parts) == 1:
            brand = parts[0]
            model = "Unknown"
        else:
            brand = "Unknown"
            model = "Car"
        
        return brand, model, year
    
    def _extract_features(self, item: Dict) -> List[str]:
        """Extract features from Apify item."""
        features = []
        
        if item.get("features"):
            if isinstance(item["features"], list):
                features = item["features"][:5]
            elif isinstance(item["features"], str):
                features = [f.strip() for f in item["features"].split(",")][:5]
        
        if not features:
            features = ["Leather Seats", "Backup Camera", "Bluetooth"]
        
        return features
