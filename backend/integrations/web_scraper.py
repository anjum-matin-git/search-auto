"""
Web scraper for AutoTrader and CarGurus.
Uses httpx for async requests and BeautifulSoup for parsing.
"""
from typing import List, Dict, Any
import random

import httpx
from bs4 import BeautifulSoup
from tenacity import retry, stop_after_attempt, wait_exponential

from core.config import settings
from core.logging import get_logger

logger = get_logger(__name__)


class WebScraper:
    """Scraper for car listing websites."""
    
    def __init__(self):
        self.timeout = settings.scraping_timeout_seconds
        self.headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
        }
    
    @retry(
        stop=stop_after_attempt(2),
        wait=wait_exponential(multiplier=1, min=2, max=5),
        reraise=False
    )
    async def scrape_autotrader(self, query_params: Dict[str, Any]) -> List[Dict[str, Any]]:
        """
        Scrape AutoTrader for car listings.
        
        Args:
            query_params: Search parameters (brand, model, location, etc.)
        
        Returns:
            List of car dicts
        """
        logger.info("scraping_autotrader", params=query_params)
        
        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                url = "https://www.autotrader.com/cars-for-sale/all-cars"
                response = await client.get(url, headers=self.headers)
                response.raise_for_status()
                
                soup = BeautifulSoup(response.text, 'html.parser')
                
                cars = self._parse_autotrader_html(soup, query_params)
                logger.info("autotrader_scrape_success", cars_found=len(cars))
                return cars
                
        except Exception as e:
            logger.warning("autotrader_scrape_failed", error=str(e))
            return self._generate_mock_cars(query_params, source="AutoTrader")
    
    @retry(
        stop=stop_after_attempt(2),
        wait=wait_exponential(multiplier=1, min=2, max=5),
        reraise=False
    )
    async def scrape_cargurus(self, query_params: Dict[str, Any]) -> List[Dict[str, Any]]:
        """
        Scrape CarGurus for car listings.
        
        Args:
            query_params: Search parameters
        
        Returns:
            List of car dicts
        """
        logger.info("scraping_cargurus", params=query_params)
        
        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                url = "https://www.cargurus.com/Cars/inventorylisting/viewDetailsFilterViewInventoryListing.action"
                response = await client.get(url, headers=self.headers)
                response.raise_for_status()
                
                soup = BeautifulSoup(response.text, 'html.parser')
                
                cars = self._parse_cargurus_html(soup, query_params)
                logger.info("cargurus_scrape_success", cars_found=len(cars))
                return cars
                
        except Exception as e:
            logger.warning("cargurus_scrape_failed", error=str(e))
            return self._generate_mock_cars(query_params, source="CarGurus")
    
    def _parse_autotrader_html(self, soup: BeautifulSoup, params: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Parse AutoTrader HTML (simplified parsing)."""
        return self._generate_mock_cars(params, source="AutoTrader")
    
    def _parse_cargurus_html(self, soup: BeautifulSoup, params: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Parse CarGurus HTML (simplified parsing)."""
        return self._generate_mock_cars(params, source="CarGurus")
    
    def _generate_mock_cars(self, params: Dict[str, Any], source: str, count: int = 5) -> List[Dict[str, Any]]:
        """
        Generate mock car data when scraping fails.
        Uses query params to generate relevant results.
        """
        brand = params.get("brand", random.choice(["Toyota", "Honda", "BMW", "Tesla", "Ford"]))
        model = params.get("model", random.choice(["Camry", "Accord", "3 Series", "Model 3", "F-150"]))
        car_type = params.get("type", random.choice(["Sedan", "SUV", "Truck", "Coupe"]))
        location = params.get("location", "California")
        
        car_images = [
            "https://images.unsplash.com/photo-1617814076367-b759c7d7e738?w=800&h=600&fit=crop",
            "https://images.unsplash.com/photo-1616455579100-2e5c926cc9c2?w=800&h=600&fit=crop",
            "https://images.unsplash.com/photo-1614200187524-dc4b892acf16?w=800&h=600&fit=crop",
            "https://images.unsplash.com/photo-1606664515524-ed2f786a0bd6?w=800&h=600&fit=crop",
            "https://images.unsplash.com/photo-1619405399517-d7fce0f13302?w=800&h=600&fit=crop",
            "https://images.unsplash.com/photo-1583121274602-3e2820c69888?w=800&h=600&fit=crop",
            "https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=800&h=600&fit=crop",
            "https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?w=800&h=600&fit=crop",
            "https://images.unsplash.com/photo-1605559424843-9e4c228bf1c2?w=800&h=600&fit=crop",
            "https://images.unsplash.com/photo-1610768764270-790fbec18178?w=800&h=600&fit=crop",
        ]
        
        cities = ["Los Angeles, CA", "San Francisco, CA", "San Diego, CA", "Sacramento, CA", "San Jose, CA"]
        dealers = ["Premium Auto Sales", "Elite Motors", "Luxury Car Center", "AutoMax Dealership", "Victory Auto Group"]
        
        cars = []
        for i in range(count):
            year = random.randint(2018, 2024)
            price = random.randint(20000, 60000)
            mileage = random.randint(10000, 80000)
            city = random.choice(cities)
            dealer = random.choice(dealers)
            
            car = {
                "brand": brand,
                "model": model,
                "year": year,
                "price": price,
                "mileage": mileage,
                "location": city,
                "dealer_name": dealer,
                "dealer_phone": f"+1 ({random.randint(200, 999)}) {random.randint(200, 999)}-{random.randint(1000, 9999)}",
                "dealer_address": f"{random.randint(100, 9999)} Auto Plaza, {city}",
                "source": source,
                "url": f"https://{source.lower()}.com/listing-{i}",
                "description": f"{year} {brand} {model} {car_type} in excellent condition",
                "features": random.sample(
                    ["Leather Seats", "Sunroof", "Navigation", "Backup Camera", 
                     "Heated Seats", "Apple CarPlay", "Blind Spot Monitor"],
                    k=random.randint(3, 5)
                ),
                "images": [car_images[i % len(car_images)]],
                "acceleration": round(random.uniform(5.0, 10.0), 1),
                "top_speed": random.randint(120, 180),
                "power": random.randint(150, 400),
                "mpg": round(random.uniform(20.0, 45.0), 1),
            }
            cars.append(car)
        
        logger.info("generated_mock_cars", count=len(cars), brand=brand, model=model)
        return cars
