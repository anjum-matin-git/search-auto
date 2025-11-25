"""
LangChain tools for car search agent.
Provides search, filtering, and persistence capabilities.
"""
from typing import Optional, Dict, Any, List
from datetime import datetime
import asyncio

from langchain_core.tools import tool

from integrations.marketcheck_api import MarketCheckAPI
from core.logging import get_logger

logger = get_logger(__name__)


# =============================================================================
# Internal Helper Functions
# =============================================================================

def filter_by_features(
    cars: List[Dict[str, Any]],
    required_features: List[str]
) -> List[Dict[str, Any]]:
    """Filter cars by required features (color, type, etc.)."""
    if not required_features:
        return cars
    
    def matches_features(car: Dict[str, Any]) -> bool:
        car_features = [f.lower() for f in car.get("features", [])]
        car_desc = (car.get("description") or "").lower()
        car_color = (car.get("color") or "").lower()
        
        for req in required_features:
            req_lower = req.lower()
            if any(req_lower in f for f in car_features):
                continue
            if req_lower in car_desc:
                continue
            if req_lower in car_color:
                continue
            return False
        return True
    
    filtered = [c for c in cars if matches_features(c)]
    logger.info("filtered_by_features", original=len(cars), filtered=len(filtered))
    return filtered


def calculate_relevance_score(car: Dict[str, Any], query: str) -> int:
    """Calculate relevance score for a car based on query."""
    score = 50  # Base score
    query_lower = query.lower()
    
    # Brand match
    brand = (car.get("brand") or "").lower()
    if brand and brand in query_lower:
        score += 20
    
    # Model match
    model = (car.get("model") or "").lower()
    if model and model in query_lower:
        score += 15
    
    # Has images
    if car.get("images"):
        score += 10
    
    # Has valid price
    if car.get("price") and car["price"] > 0:
        score += 5
    
    return min(score, 100)


def rank_by_relevance(
    cars: List[Dict[str, Any]],
    query: str
) -> List[Dict[str, Any]]:
    """Rank cars by relevance to user query."""
    for car in cars:
        car["match_score"] = calculate_relevance_score(car, query)
    
    ranked = sorted(cars, key=lambda x: x.get("match_score", 0), reverse=True)
    
    if ranked:
        logger.info("ranked_results", top_score=ranked[0].get("match_score"))
    
    return ranked


def normalize_car_data(car: Dict[str, Any]) -> Dict[str, Any]:
    """Normalize car data to consistent format."""
    return {
        "brand": car.get("brand"),
        "model": car.get("model"),
        "year": car.get("year"),
        "price": car.get("price"),
        "mileage": car.get("mileage"),
        "location": car.get("location"),
        "dealer": car.get("dealer_name") or car.get("dealer"),
        "description": (car.get("description") or "")[:200],
        "features": car.get("features", [])[:5],
        "vin": car.get("vin") or "",
        "images": car.get("images", [])[:5],
        "source_url": car.get("sourceUrl") or car.get("source_url"),
        "match_score": car.get("match_score", 50)
    }


# =============================================================================
# LangChain Tools
# =============================================================================

@tool
async def search_car_listings(
    brand: Optional[str] = None,
    model: Optional[str] = None,
    year_min: Optional[int] = None,
    year_max: Optional[int] = None,
    price_min: Optional[int] = None,
    price_max: Optional[int] = None,
    location: Optional[str] = None,
    postal_code: Optional[str] = None,
    country: str = "US",
    body_type: Optional[str] = None,
    fuel_type: Optional[str] = None,
    required_features: Optional[List[str]] = None,
    user_query: Optional[str] = None,
    limit: int = 10,
    page: int = 1
) -> List[Dict[str, Any]]:
    """
    Search for car listings from dealer inventory.
    
    Args:
        brand: Car manufacturer (Toyota, BMW, etc.)
        model: Car model (Camry, X5, etc.)
        year_min: Minimum year
        year_max: Maximum year
        price_min: Minimum price in dollars
        price_max: Maximum price in dollars
        location: City or region
        postal_code: Postal/ZIP code
        country: Country code (CA or US)
        body_type: Vehicle body type (SUV, Sedan, Truck, Coupe, etc.)
        fuel_type: Fuel type (Electric, Hybrid, Gasoline, Diesel)
        required_features: Features to filter by (red, AWD, sunroof)
        user_query: Original query for relevance ranking
        limit: Max results to return
        page: Page number for pagination
    
    Returns:
        List of matching car listings
    """
    logger.info(
        "tool_search_start",
        brand=brand,
        model=model,
        body_type=body_type,
        fuel_type=fuel_type,
        price_max=price_max,
        features=required_features,
        page=page
    )
    
    # Build API parameters
    params = {
        "country": country,
        "radius_km": 150,
        "limit": max(limit * 2, 20),  # Fetch extra for filtering
        "page": page
    }
    
    if brand:
        params["brand"] = brand
    if model:
        params["model"] = model
    if year_min:
        params["year_min"] = year_min
    if year_max:
        params["year_max"] = year_max
    if price_min:
        params["price_min"] = price_min
    if price_max:
        params["price_max"] = price_max
    if location:
        params["location"] = location
    if postal_code:
        params["postal_code"] = postal_code
    if body_type:
        params["body_type"] = body_type
    if fuel_type:
        params["fuel_type"] = fuel_type
    
    # Execute search - Using MarketCheck as primary source (better results)
    raw_cars = []
    existing_vins = set()  # Track by VIN for deduplication
    existing_keys = set()  # Track by brand+model+year+price for cars without VIN
    
    # Primary: MarketCheck API (better and richer results)
    marketcheck_api = MarketCheckAPI()
    if marketcheck_api.enabled:
        try:
            marketcheck_results = await marketcheck_api.search_listings(params)
            for car in marketcheck_results:
                vin = car.get("vin", "")
                key = f"{car.get('brand')}_{car.get('model')}_{car.get('year')}_{car.get('price')}"
                
                # Deduplicate by VIN or key
                if vin:
                    if vin not in existing_vins:
                        existing_vins.add(vin)
                        raw_cars.append(car)
                elif key not in existing_keys:
                    existing_keys.add(key)
                    raw_cars.append(car)
            
            logger.info("marketcheck_results", count=len(marketcheck_results), added=len(raw_cars))
        except Exception as e:
            logger.warning("marketcheck_error", error=str(e))
    
    
    logger.info("total_api_results", count=len(raw_cars))
    
    # Normalize data
    cars = [normalize_car_data(car) for car in raw_cars]
    
    # Apply feature filtering
    if required_features:
        cars = filter_by_features(cars, required_features)
    
    # Rank by relevance
    if user_query:
        cars = rank_by_relevance(cars, user_query)
    
    # Return requested limit
    result = cars[:limit]
    
    logger.info("tool_search_complete", returned=len(result))
    return result


@tool
def save_search_results(
    user_id: int,
    query: str,
    results: List[Dict[str, Any]],
    summary: str
) -> Dict[str, Any]:
    """
    Save search results to database and conversation.
    
    Args:
        user_id: User's ID
        query: Search query
        results: List of car data
        summary: Summary message for user
    
    Returns:
        Dict with search_id, cars_saved, success status
    """
    from db.base import SessionLocal
    from db.models import Conversation, ConversationMessage, Search, SearchResult, Car
    
    logger.info("tool_save_start", user_id=user_id, results_count=len(results))
    
    db = SessionLocal()
    try:
        # Get or create conversation
        conversation = db.query(Conversation).filter(
            Conversation.user_id == user_id
        ).first()
        
        if not conversation:
            conversation = Conversation(
                user_id=user_id,
                title="Car Search",
                created_at=datetime.utcnow()
            )
            db.add(conversation)
            db.flush()
        
        # Check for duplicate message
        last_msg = db.query(ConversationMessage).filter(
            ConversationMessage.conversation_id == conversation.id
        ).order_by(ConversationMessage.created_at.desc()).first()
        
        if not (last_msg and last_msg.role == "user" and query.lower() in last_msg.content.lower()):
            db.add(ConversationMessage(
                conversation_id=conversation.id,
                role="user",
                content=query,
                created_at=datetime.utcnow()
            ))
        
        # Add assistant response
        db.add(ConversationMessage(
            conversation_id=conversation.id,
            role="assistant",
            content=summary,
            created_at=datetime.utcnow()
        ))
        
        # Create search record
        search = Search(
            user_id=user_id,
            query=query,
            created_at=datetime.utcnow()
        )
        db.add(search)
        db.flush()
        
        # Save cars
        saved_count = 0
        for i, car_data in enumerate(results):
            try:
                match_score = car_data.get("match_score", 50)
                if match_score > 1:
                    match_score = match_score / 100.0
                
                car = Car(
                    car_data={
                        "vin": car_data.get("vin") or "",
                        "brand": car_data.get("brand"),
                        "model": car_data.get("model"),
                        "year": car_data.get("year"),
                        "price": car_data.get("price"),
                        "location": car_data.get("location"),
                        "dealer": car_data.get("dealer"),
                        "images": car_data.get("images", [])[:3],
                    },
                    active=True,
                    created_at=datetime.utcnow()
                )
                db.add(car)
                db.flush()
                
                db.add(SearchResult(
                    search_id=search.id,
                    car_id=car.id,
                    rank=i + 1,
                    match_score=match_score
                ))
                saved_count += 1
                
            except Exception as e:
                logger.warning("car_save_failed", error=str(e))
                continue
        
        db.commit()
        
        logger.info(
            "tool_save_complete",
            search_id=search.id,
            cars_saved=saved_count
        )
        
        return {
            "success": True,
            "search_id": search.id,
            "cars_saved": saved_count,
            "conversation_id": conversation.id
        }
        
    except Exception as e:
        db.rollback()
        logger.error("tool_save_error", error=str(e))
        return {"success": False, "error": str(e)}
    finally:
        db.close()


@tool
def send_message_to_user(user_id: int, message: str) -> Dict[str, Any]:
    """
    Send a message to user's conversation (no car results).
    
    Args:
        user_id: User's ID
        message: Message content
    
    Returns:
        Dict with message_id and success status
    """
    from db.base import SessionLocal
    from db.models import Conversation, ConversationMessage
    
    logger.info("tool_message_start", user_id=user_id)
    
    db = SessionLocal()
    try:
        conversation = db.query(Conversation).filter(
            Conversation.user_id == user_id
        ).first()
        
        if not conversation:
            conversation = Conversation(
                user_id=user_id,
                title="Car Search",
                created_at=datetime.utcnow()
            )
            db.add(conversation)
            db.flush()
        
        msg = ConversationMessage(
            conversation_id=conversation.id,
            role="assistant",
            content=message,
            created_at=datetime.utcnow()
        )
        db.add(msg)
        db.commit()
        
        logger.info("tool_message_complete", message_id=msg.id)
        
        return {
            "success": True,
            "message_id": msg.id,
            "conversation_id": conversation.id
        }
        
    except Exception as e:
        db.rollback()
        logger.error("tool_message_error", error=str(e))
        return {"success": False, "error": str(e)}
    finally:
        db.close()


# Backwards compatibility alias
post_message_to_user = send_message_to_user

# Export all tools
ALL_TOOLS = [
    search_car_listings,
    save_search_results,
    send_message_to_user
]
