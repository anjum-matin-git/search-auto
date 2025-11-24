"""
Kijiji Autos scraper for Canadian car listings.
"""
import httpx
from bs4 import BeautifulSoup
from typing import List, Dict, Optional
import re
from core.logging import get_logger

logger = get_logger(__name__)


class KijijiScraper:
    """Scrapes Kijiji Autos for Canadian vehicles."""
    
    def __init__(self):
        self.base_url = "https://www.kijiji.ca"
        self.headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
            "Accept": "text/html,application/xhtml+xml",
            "Accept-Language": "en-CA,en;q=0.9",
        }
    
    async def search(
        self,
        make: Optional[str] = None,
        model: Optional[str] = None,
        location: Optional[str] = None,
        postal_code: Optional[str] = None,
        max_results: int = 20
    ) -> List[Dict]:
        """Search Kijiji for vehicles."""
        try:
            search_url = self._build_search_url(make, model, location)
            
            logger.info("kijiji_scraper_search", url=search_url, make=make)
            
            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.get(search_url, headers=self.headers)
                response.raise_for_status()
                
                soup = BeautifulSoup(response.text, 'html.parser')
                listings = self._parse_listings(soup, max_results)
                
                logger.info("kijiji_scraper_success", count=len(listings))
                return listings
                
        except Exception as e:
            logger.error("kijiji_scraper_failed", error=str(e))
            return []
    
    def _build_search_url(self, make: Optional[str], model: Optional[str], location: Optional[str]) -> str:
        """Build Kijiji search URL."""
        query_parts = []
        if make:
            query_parts.append(make)
        if model:
            query_parts.append(model)
        
        query = "+".join(query_parts) if query_parts else "cars"
        location_slug = location.lower().replace(" ", "-") if location else "canada"
        
        return f"{self.base_url}/b-cars-vehicles/{location_slug}/c27l0?q={query}"
    
    def _parse_listings(self, soup: BeautifulSoup, max_results: int) -> List[Dict]:
        """Parse Kijiji listings."""
        listings = []
        items = soup.find_all('div', class_=re.compile(r'search-item|listing'))
        
        for item in items[:max_results]:
            try:
                listing = self._parse_single_listing(item)
                if listing:
                    listings.append(listing)
            except:
                continue
        
        return listings
    
    def _parse_single_listing(self, item) -> Optional[Dict]:
        """Parse single Kijiji listing."""
        try:
            title_elem = item.find('a', class_=re.compile(r'title'))
            if not title_elem:
                return None
            
            title = title_elem.get_text(strip=True)
            url = title_elem.get('href', '')
            if url and not url.startswith('http'):
                url = f"{self.base_url}{url}"
            
            price_elem = item.find('div', class_=re.compile(r'price'))
            price = self._extract_price(price_elem.get_text(strip=True) if price_elem else "0")
            
            if not price:
                return None
            
            img_elem = item.find('img')
            image = img_elem.get('src', '') if img_elem else ""
            
            location_elem = item.find('div', class_=re.compile(r'location'))
            location = location_elem.get_text(strip=True) if location_elem else "Canada"
            
            year, make, model = self._parse_title(title)
            
            return {
                "brand": make,
                "model": model,
                "year": year,
                "price": price,
                "mileage": 0,
                "location": location,
                "dealer_name": "Kijiji Seller",
                "dealer_phone": "",
                "dealer_address": location,
                "source": "Kijiji",
                "sourceUrl": url,
                "url": url,
                "description": title,
                "features": ["Private Seller"],
                "images": [image] if image else [],
                "vin": "",
                "acceleration": 7.0,
                "top_speed": 130,
                "power": 200,
                "mpg": 28.0,
            }
        except:
            return None
    
    def _extract_price(self, price_text: str) -> int:
        """Extract price from text."""
        try:
            clean = re.sub(r'[$,\s]', '', price_text)
            match = re.search(r'\d+', clean)
            return int(match.group()) if match else 0
        except:
            return 0
    
    def _parse_title(self, title: str) -> tuple:
        """Parse year, make, model from title."""
        parts = title.split()
        year = 2023
        make = "Unknown"
        model = "Car"
        
        if len(parts) >= 2:
            if parts[0].isdigit() and len(parts[0]) == 4:
                year = int(parts[0])
                make = parts[1] if len(parts) > 1 else "Unknown"
                model = " ".join(parts[2:]) if len(parts) > 2 else "Car"
            else:
                make = parts[0]
                model = " ".join(parts[1:])
        
        return year, make, model

