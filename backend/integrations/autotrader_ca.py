"""
AutoTrader.ca integration for Canadian car listings.
Uses Apify's AutoTrader Canada scraper for real Canadian inventory.
"""
from typing import List, Dict, Any, Optional, Tuple
import asyncio
import re
from urllib.parse import urlencode

from apify_client import ApifyClient
import pgeocode
from tenacity import retry, stop_after_attempt, wait_exponential

from core.config import settings
from core.logging import get_logger

logger = get_logger(__name__)


CANADIAN_CITY_POSTALS = {
    "vancouver": "V5K0A1",
    "toronto": "M5H2N2",
    "montreal": "H1A0A1",
    "calgary": "T2P5E1",
    "ottawa": "K1A0A6",
    "edmonton": "T5J2R7",
    "winnipeg": "R3C0A5",
    "mississauga": "L5B1M2",
    "victoria": "V8W1P8",
    "hamilton": "L8P4R5",
    "quebec": "G1R4P5",
    "halifax": "B3J3R7",
    "surrey": "V3T0A3",
    "richmond": "V6X0A4",
    "markham": "L3R0G6",
}

PROVINCE_NAMES = {
    "bc": "British Columbia",
    "ab": "Alberta",
    "sk": "Saskatchewan",
    "mb": "Manitoba",
    "on": "Ontario",
    "qc": "Quebec",
    "nb": "New Brunswick",
    "ns": "Nova Scotia",
    "pe": "Prince Edward Island",
    "nl": "Newfoundland and Labrador",
    "yt": "Yukon",
    "nt": "Northwest Territories",
    "nu": "Nunavut",
}

PROVINCE_ALIASES = {
    "bc": ["british columbia", "bc", "b.c."],
    "ab": ["alberta", "ab"],
    "sk": ["saskatchewan", "sk"],
    "mb": ["manitoba", "mb"],
    "on": ["ontario", "on"],
    "qc": ["quebec", "qc", "québec"],
    "nb": ["new brunswick", "nb"],
    "ns": ["nova scotia", "ns"],
    "pe": ["prince edward island", "pe", "pei"],
    "nl": ["newfoundland", "nl", "newfoundland and labrador"],
}

PROVINCE_DEFAULT_CITY = {
    "bc": "vancouver",
    "ab": "calgary",
    "sk": "saskatoon",
    "mb": "winnipeg",
    "on": "toronto",
    "qc": "montreal",
    "nb": "fredericton",
    "ns": "halifax",
    "pe": "charlottetown",
    "nl": "st-johns",
}

CITY_PROVINCE_MAP = {
    "vancouver": {"city_slug": "vancouver", "province_slug": "bc", "province_name": PROVINCE_NAMES["bc"], "postal": "V5K0A1"},
    "toronto": {"city_slug": "toronto", "province_slug": "on", "province_name": PROVINCE_NAMES["on"], "postal": "M5H2N2"},
    "montreal": {"city_slug": "montreal", "province_slug": "qc", "province_name": PROVINCE_NAMES["qc"], "postal": "H1A0A1"},
    "calgary": {"city_slug": "calgary", "province_slug": "ab", "province_name": PROVINCE_NAMES["ab"], "postal": "T2P5E1"},
    "ottawa": {"city_slug": "ottawa", "province_slug": "on", "province_name": PROVINCE_NAMES["on"], "postal": "K1A0A6"},
    "edmonton": {"city_slug": "edmonton", "province_slug": "ab", "province_name": PROVINCE_NAMES["ab"], "postal": "T5J2R7"},
    "winnipeg": {"city_slug": "winnipeg", "province_slug": "mb", "province_name": PROVINCE_NAMES["mb"], "postal": "R3C0A5"},
    "mississauga": {"city_slug": "mississauga", "province_slug": "on", "province_name": PROVINCE_NAMES["on"], "postal": "L5B1M2"},
    "victoria": {"city_slug": "victoria", "province_slug": "bc", "province_name": PROVINCE_NAMES["bc"], "postal": "V8W1P8"},
    "hamilton": {"city_slug": "hamilton", "province_slug": "on", "province_name": PROVINCE_NAMES["on"], "postal": "L8P4R5"},
    "quebec": {"city_slug": "quebec", "province_slug": "qc", "province_name": PROVINCE_NAMES["qc"], "postal": "G1R4P5"},
    "halifax": {"city_slug": "halifax", "province_slug": "ns", "province_name": PROVINCE_NAMES["ns"], "postal": "B3J3R7"},
    "surrey": {"city_slug": "surrey", "province_slug": "bc", "province_name": PROVINCE_NAMES["bc"], "postal": "V3T0A3"},
    "richmond": {"city_slug": "richmond", "province_slug": "bc", "province_name": PROVINCE_NAMES["bc"], "postal": "V6X0A4"},
    "markham": {"city_slug": "markham", "province_slug": "on", "province_name": PROVINCE_NAMES["on"], "postal": "L3R0G6"},
    "saskatoon": {"city_slug": "saskatoon", "province_slug": "sk", "province_name": PROVINCE_NAMES["sk"], "postal": "S7K0C1"},
    "charlottetown": {"city_slug": "charlottetown", "province_slug": "pe", "province_name": PROVINCE_NAMES["pe"], "postal": "C1A0A1"},
    "fredericton": {"city_slug": "fredericton", "province_slug": "nb", "province_name": PROVINCE_NAMES["nb"], "postal": "E3B0R1"},
    "st-johns": {"city_slug": "st-johns", "province_slug": "nl", "province_name": PROVINCE_NAMES["nl"], "postal": "A1C0A6"},
}

DEFAULT_LOCATION_CONTEXT = CITY_PROVINCE_MAP["toronto"]
POSTAL_CODE_PATTERN = re.compile(r"^[ABCEGHJ-NPRSTVXY]\d[ABCEGHJ-NPRSTV-Z]\d[ABCEGHJ-NPRSTV-Z]\d$")


class AutoTraderCA:
    """Client for AutoTrader.ca via Apify scraper - real Canadian dealer inventory."""
    
    def __init__(self):
        self.api_key = settings.apify_api_key
        self.actor_id = settings.autotrader_ca_actor_id
        self.max_depth = settings.autotrader_ca_max_depth
        self.max_concurrency = settings.autotrader_ca_max_concurrency
        
        if not self.api_key:
            logger.warning("autotrader_ca_no_key", message="APIFY_API_KEY not set")
            self.enabled = False
            self.client = None
        else:
            self.enabled = True
            self.client = ApifyClient(self.api_key)
            logger.info(
                "autotrader_ca_client_initialized",
                actor_id=self.actor_id,
                max_depth=self.max_depth,
                max_concurrency=self.max_concurrency,
            )
        
        # Geocoder for Canadian postal codes
        self.geocoder = pgeocode.Nominatim("ca")
    
    @retry(
        stop=stop_after_attempt(3),
        wait=wait_exponential(multiplier=1, min=2, max=10),
        reraise=False
    )
    async def search_listings(self, query_params: Dict[str, Any]) -> List[Dict[str, Any]]:
        """
        Search AutoTrader.ca for Canadian car listings.
        
        Args:
            query_params: Search parameters including:
                - brand: str (e.g. "Range Rover", "Toyota")
                - model: str (e.g. "Sport", "Camry")
                - location: str (city or postal code)
                - postal_code: str (Canadian postal code)
                - price_min: int
                - price_max: int
                - year_min: int
                - year_max: int
                - mileage_max: int
        
        Returns:
            List of car dicts with Canadian inventory
        """
        if not self.enabled:
            logger.warning("autotrader_ca_disabled")
            return []
        
        logger.info("autotrader_ca_searching", params=query_params)
        
        try:
            # Build AutoTrader.ca search URL
            search_url = self._build_search_url(query_params)
            
            # Configure Apify actor run
            run_input: Dict[str, Any] = {
                "start_urls": [{"url": search_url}],
            }
            if self.max_depth and self.max_depth > 0:
                run_input["max_depth"] = self.max_depth
            if self.max_concurrency and self.max_concurrency > 0:
                run_input["max_concurrency"] = self.max_concurrency
            
            logger.info(
                "autotrader_ca_starting_run",
                actor=self.actor_id,
                url=search_url,
                run_input=run_input,
            )
            
            # Run the Apify actor in a background thread to avoid blocking the event loop
            items = await asyncio.to_thread(self._execute_actor_run, run_input)
            logger.info("autotrader_ca_raw_items", count=len(items))
            
            # Convert to our car format
            cars = self._convert_listings_to_car_format(items, query_params)
            
            logger.info("autotrader_ca_search_success", listings_found=len(cars))
            
            return cars
            
        except Exception as e:
            logger.error("autotrader_ca_search_failed", error=str(e), exc_info=True)
            return []

    def _execute_actor_run(self, run_input: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Execute Apify actor synchronously (called inside a thread)."""
        actor = self.client.actor(self.actor_id)
        run = actor.call(run_input=run_input)
        dataset_id = run.get("defaultDatasetId")
        if not dataset_id:
            logger.warning("autotrader_ca_no_dataset_id", run=run)
            return []
        
        items = [item for item in self.client.dataset(dataset_id).iterate_items()]
        return items
    
    def _build_search_url(self, query_params: Dict[str, Any]) -> str:
        """Build AutoTrader.ca search URL from query parameters."""
        location = query_params.get("location", "")
        postal_code = query_params.get("postal_code", "")
        location_context = self._resolve_location_context(location, postal_code)
        
        brand_slug = self._slugify(query_params.get("brand", ""))
        model_slug = self._slugify(query_params.get("model", ""))
        
        path_segments = ["cars"]
        if brand_slug:
            path_segments.append(brand_slug)
        if model_slug:
            path_segments.append(model_slug)
        path_segments.append(location_context["province_slug"])
        path_segments.append(location_context["city_slug"])
        
        base_url = "https://www.autotrader.ca/" + "/".join(path_segments) + "/"
        
        params: Dict[str, Any] = {
            "rcp": 100,
            "rcs": 0,
            "hprc": "True",
            "inMarket": "advancedSearch",
            "srt": 35,
        }
        
        if location_context["postal"]:
            params["loc"] = location_context["postal"]
        if location_context["province_name"]:
            params["prv"] = location_context["province_name"]
        
        radius_km = query_params.get("radius_km")
        if isinstance(radius_km, (int, float)):
            params["prx"] = min(int(radius_km), 250)
        
        price_min = query_params.get("price_min")
        if isinstance(price_min, (int, float)):
            params["priceMin"] = int(price_min)
        
        price_max = query_params.get("price_max")
        if isinstance(price_max, (int, float)):
            params["priceMax"] = int(price_max)
        
        year_min = query_params.get("year_min")
        if isinstance(year_min, (int, float)):
            params["yearMin"] = int(year_min)
        
        year_max = query_params.get("year_max")
        if isinstance(year_max, (int, float)):
            params["yearMax"] = int(year_max)
        
        mileage_max = query_params.get("mileage_max")
        if isinstance(mileage_max, (int, float)):
            params["odometerMax"] = int(mileage_max)
        
        query_string = urlencode(params)
        return f"{base_url}?{query_string}"
    
    def _resolve_location_context(self, location: str, postal_code: str) -> Dict[str, str]:
        """Determine best-effort province/city/postal for AutoTrader URLs."""
        context = DEFAULT_LOCATION_CONTEXT.copy()
        normalized_postal = self._normalize_postal(postal_code)
        normalized_location = (location or "").lower()
        
        matched_city = None
        for city_key, meta in CITY_PROVINCE_MAP.items():
            if city_key in normalized_location:
                matched_city = city_key
                context = meta.copy()
                break
        
        if not matched_city and normalized_location:
            province_slug = None
            for slug, aliases in PROVINCE_ALIASES.items():
                if any(alias in normalized_location for alias in aliases):
                    province_slug = slug
                    break
            if province_slug:
                default_city = PROVINCE_DEFAULT_CITY.get(province_slug, "toronto")
                context = CITY_PROVINCE_MAP.get(default_city, DEFAULT_LOCATION_CONTEXT).copy()
        
        if normalized_postal:
            context["postal"] = normalized_postal
        elif matched_city:
            context["postal"] = CITY_PROVINCE_MAP[matched_city]["postal"]
        
        return context
    
    def _normalize_postal(self, postal_code: Optional[str]) -> Optional[str]:
        """Normalize a Canadian postal code (remove spaces, uppercase)."""
        if not postal_code:
            return None
        cleaned = re.sub(r"[^A-Za-z0-9]", "", postal_code).upper()
        if not POSTAL_CODE_PATTERN.match(cleaned):
            return None
        return cleaned
    
    def _slugify(self, value: str) -> str:
        """Convert string to AutoTrader-friendly slug."""
        if not value:
            return ""
        return re.sub(r"[^a-z0-9]+", "-", value.strip().lower()).strip("-")
    
    def _convert_listings_to_car_format(
        self, 
        listings: List[Dict], 
        query_params: Dict[str, Any]
    ) -> List[Dict[str, Any]]:
        """
        Convert AutoTrader.ca listings to our car format.
        
        The Apify scraper returns fields like:
        - title, price, year, make, model, mileage, location
        - dealer info, images, url, etc.
        """
        cars = []
        
        # Extract filter criteria for strict matching
        required_brand = (query_params.get("brand") or "").lower().strip()
        required_model = (query_params.get("model") or "").lower().strip()
        
        for listing in listings:
            try:
                # Extract basic fields
                title = listing.get("title", "")
                price = (
                    listing.get("price_cad")
                    or self._extract_price(listing.get("price"))
                    or self._extract_price(listing.get("price_str"))
                )
                
                # Skip if no valid price
                if price == 0:
                    continue
                
                # Extract make/model/year
                make = listing.get("make", "")
                model = listing.get("model", "")
                year = listing.get("year", 2024)
                
                # If make/model not in structured fields, parse from title
                if not make or not model:
                    make, model, year = self._parse_title(title, year)
                
                # STRICT FILTERING: Only include if brand matches (when specified)
                if required_brand:
                    if required_brand not in make.lower():
                        logger.debug(
                            "autotrader_ca_brand_mismatch",
                            required=required_brand,
                            actual=make,
                            title=title
                        )
                        continue
                
                # STRICT FILTERING: Only include if model matches (when specified)
                if required_model:
                    if required_model not in model.lower():
                        logger.debug(
                            "autotrader_ca_model_mismatch",
                            required=required_model,
                            actual=model,
                            title=title
                        )
                        continue
                
                # Extract other fields
                mileage_value = (
                    listing.get("mileage_km")
                    or listing.get("mileage")
                    or listing.get("mileage_str")
                )
                mileage_numeric = None
                mileage_display = None
                if isinstance(mileage_value, (int, float)):
                    mileage_numeric = int(mileage_value)
                    mileage_display = f"{mileage_numeric:,} km"
                elif isinstance(mileage_value, str):
                    mileage_numeric = self._extract_mileage(mileage_value)
                    mileage_display = mileage_value
                else:
                    mileage_numeric = 0
                
                city = listing.get("city")
                province = listing.get("province")
                location = ", ".join(filter(None, [city, province])) or "Canada"
                
                # Images
                images = self._extract_images(listing)
                
                # Dealer info
                dealer_name = listing.get("seller_name") or "AutoTrader Seller"
                dealer_phone = listing.get("seller_phone") or ""
                dealer_address = location
                if listing.get("is_private_seller"):
                    dealer_name = dealer_name or "Private Seller"
                
                # Source URL
                source_url = listing.get("url", "")
                
                # Description
                description = listing.get("description", title)
                
                # Features
                features = self._extract_features(listing)
                
                # VIN
                vin = listing.get("vin", "")
                
                # Build car dict
                car = {
                    "brand": make,
                    "model": model,
                    "year": year,
                    "price": price,
                    "mileage": mileage_display or mileage_numeric,
                    "location": location,
                    "dealer_name": dealer_name,
                    "dealer_phone": dealer_phone,
                    "dealer_address": dealer_address,
                    "source": "AutoTrader.ca",
                    "url": source_url,
                    "sourceUrl": source_url,
                    "description": description,
                    "features": features,
                    "images": images[:5],  # Limit to 5 images
                    "vin": vin,
                    "type": self._infer_type(title, model),
                    "display_currency": "CAD",
                    "status": listing.get("status"),
                    "body_type": listing.get("body_type"),
                    "transmission": listing.get("transmission"),
                    "fuel_type": listing.get("fuel_type"),
                }
                
                cars.append(car)
                
                logger.debug(
                    "autotrader_ca_listing_converted",
                    brand=make,
                    model=model,
                    year=year,
                    price=price
                )
                
            except Exception as e:
                logger.warning(
                    "autotrader_ca_listing_conversion_failed",
                    error=str(e),
                    listing_title=listing.get("title", "unknown")
                )
                continue
        
        logger.info(
            "autotrader_ca_conversion_complete",
            total_listings=len(listings),
            converted_cars=len(cars),
            filtered_out=len(listings) - len(cars)
        )
        
        return cars
    
    def _extract_images(self, listing: Dict[str, Any]) -> List[str]:
        """Normalize image URLs from listing."""
        images = listing.get("image_urls") or listing.get("images") or []
        
        if isinstance(images, str):
            images = [images]
        elif not isinstance(images, list):
            images = []
        
        if not images:
            # CSV exports flatten into image_urls/0, image_urls/1, ...
            flattened = []
            for key, value in listing.items():
                if key.startswith("image_urls/") and value:
                    flattened.append(value)
            images = flattened
        
        return [img for img in images if isinstance(img, str) and img]
    
    def _extract_price(self, price_value: Any) -> int:
        """Extract numeric price from various formats."""
        if isinstance(price_value, (int, float)):
            return int(price_value)
        
        if isinstance(price_value, str):
            # Remove currency symbols, commas, spaces
            numbers = re.sub(r'[^\d]', '', price_value)
            try:
                return int(numbers) if numbers else 0
            except:
                return 0
        
        return 0
    
    def _extract_mileage(self, mileage_value: Any) -> int:
        """Extract numeric mileage from various formats."""
        if isinstance(mileage_value, (int, float)):
            return int(mileage_value)
        
        if isinstance(mileage_value, str):
            # Remove commas, spaces, 'km', etc.
            numbers = re.sub(r'[^\d]', '', mileage_value)
            try:
                return int(numbers) if numbers else 0
            except:
                return 0
        
        return 0
    
    def _parse_title(self, title: str, default_year: int = 2024) -> Tuple[str, str, int]:
        """
        Parse car title like '2023 Land Rover Range Rover Sport' 
        into (brand, model, year).
        """
        # Extract year
        year_match = re.search(r'\b(19|20)\d{2}\b', title)
        year = int(year_match.group()) if year_match else default_year
        
        # Remove year from title
        title_clean = re.sub(r'\b(19|20)\d{2}\b', '', title).strip()
        
        # Split into parts
        parts = title_clean.split()
        
        if len(parts) >= 2:
            # First word is usually the brand
            brand = parts[0]
            # Rest is the model
            model = ' '.join(parts[1:])
        elif len(parts) == 1:
            brand = parts[0]
            model = "Unknown"
        else:
            brand = "Unknown"
            model = "Car"
        
        return brand, model, year
    
    def _extract_features(self, listing: Dict) -> List[str]:
        """Extract features from listing."""
        features = []
        
        # Check various possible feature fields
        feature_fields = ["features", "options", "equipment"]
        
        for field in feature_fields:
            if field in listing:
                feature_data = listing[field]
                
                if isinstance(feature_data, list):
                    features.extend(feature_data)
                elif isinstance(feature_data, str):
                    # Split by comma or semicolon
                    features.extend([f.strip() for f in re.split(r'[,;]', feature_data)])
        
        # Deduplicate and limit
        features = list(dict.fromkeys(features))[:10]
        
        # If no features found, add some defaults
        if not features:
            features = ["Power Windows", "Air Conditioning", "Cruise Control"]
        
        return features
    
    def _infer_type(self, title: str, model: str) -> str:
        """Infer vehicle type from title and model."""
        combined = f"{title} {model}".lower()
        
        if any(keyword in combined for keyword in ["suv", "crossover", "4x4", "awd"]):
            return "SUV"
        elif any(keyword in combined for keyword in ["truck", "pickup", "f-150", "ram", "silverado"]):
            return "Truck"
        elif any(keyword in combined for keyword in ["sedan", "accord", "camry", "civic"]):
            return "Sedan"
        elif any(keyword in combined for keyword in ["coupe", "sports", "convertible"]):
            return "Coupe"
        elif any(keyword in combined for keyword in ["van", "minivan", "caravan"]):
            return "Van"
        else:
            return "Car"

