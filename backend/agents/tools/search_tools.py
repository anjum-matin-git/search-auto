"""
LangChain tools for autonomous car search agent.
Converts existing workflow steps into reusable tools.
"""
from typing import Optional, Dict, Any, List
from langchain_core.tools import tool
from integrations.autodev_api import AutoDevAPI
from integrations.openai_client import OpenAIClient
from core.logging import get_logger

logger = get_logger(__name__)


# Helper functions (internal logic, not exposed as tools directly)
def _filter_cars_logic(
    cars: List[Dict],
    required_features: Optional[List[str]] = None,
    preferred_brands: Optional[List[str]] = None
) -> List[Dict]:
    """Internal helper to filter cars."""
    filtered = cars
    
    # Filter by features
    if required_features:
        def has_features(car):
            car_features = [f.lower() for f in car.get("features", [])]
            car_desc = (car.get("description") or "").lower()
            return all(
                any(req.lower() in cf for cf in car_features) or req.lower() in car_desc
                for req in required_features
            )
        filtered = [c for c in filtered if has_features(c)]
    
    # Filter by brands
    if preferred_brands:
        filtered = [
            c for c in filtered 
            if c.get("brand", "").lower() in [b.lower() for b in preferred_brands]
        ]
        
    return filtered

def _rank_cars_logic(
    cars: List[Dict],
    user_query: str
) -> List[Dict]:
    """Internal helper to rank cars."""
    # Simple relevance scoring
    def calculate_score(car):
        score = 50  # Base score
        
        # Boost for matching query terms
        query_lower = user_query.lower()
        if car.get("brand", "").lower() in query_lower:
            score += 20
        if car.get("model", "").lower() in query_lower:
            score += 20
        
        # Penalize for missing data
        if not car.get("price"):
            score -= 10
        if not car.get("images"):
            score -= 5
        
        return score
    
    # Add scores and sort
    for car in cars:
        car["match_score"] = calculate_score(car)
    
    ranked = sorted(cars, key=lambda x: x.get("match_score", 0), reverse=True)
    return ranked


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
    country: str = "CA",
    required_features: Optional[List[str]] = None,
    user_query: Optional[str] = None
) -> List[Dict[str, Any]]:
    """
    Search for car listings from Auto.dev API and filter/rank them in one step.
    Use this tool to find actual cars for sale.
    
    Args:
        brand: Car manufacturer (e.g., "Toyota", "Honda")
        model: Car model (e.g., "Camry", "Accord")
        year_min: Minimum year
        year_max: Maximum year
        price_min: Minimum price in dollars
        price_max: Maximum price in dollars
        location: City or region
        postal_code: Postal code for location-based search
        country: Country code (CA or US)
        required_features: List of features to filter by (e.g., ["red", "sunroof", "AWD"])
        user_query: Original user query string (used for relevance ranking)
        
    Returns:
        List of filtered and ranked car listings
    """
    logger.info(
        "tool_search_listings",
        brand=brand,
        model=model,
        location=location,
        features=required_features
    )
    
    # Build query params
    query_params = {}
    if brand:
        query_params["brand"] = brand
    if model:
        query_params["model"] = model
    if year_min:
        query_params["year_min"] = year_min
    if year_max:
        query_params["year_max"] = year_max
    if price_min:
        query_params["price_min"] = price_min
    if price_max:
        query_params["price_max"] = price_max
    if location:
        query_params["location"] = location
    if postal_code:
        query_params["postal_code"] = postal_code
    query_params["country"] = country
    query_params["radius_km"] = 150
    
    # Search using Auto.dev API
    autodev = AutoDevAPI()
    cars = await autodev.search_listings(query_params)
    
    logger.info("listings_found", count=len(cars))
    
    # Convert to simplified format first
    simplified_cars = [
        {
            "brand": car.get("brand"),
            "model": car.get("model"),
            "year": car.get("year"),
            "price": car.get("price"),
            "mileage": car.get("mileage"),
            "location": car.get("location"),
            "dealer": car.get("dealer_name") or car.get("dealer"),
            "description": car.get("description"),
            "features": car.get("features", [])[:3],
            "vin": car.get("vin"),
            "images": car.get("images", []),
            "sourceUrl": car.get("sourceUrl")
        }
        for car in cars[:20]  # Process top 20
    ]
    
    # Apply internal filtering if features requested
    if required_features:
        simplified_cars = _filter_cars_logic(simplified_cars, required_features=required_features)
        logger.info("filtered_results", final_count=len(simplified_cars))
        
    # Apply internal ranking if query provided
    if user_query:
        simplified_cars = _rank_cars_logic(simplified_cars, user_query)
        logger.info("ranked_results", top_score=simplified_cars[0].get("match_score") if simplified_cars else 0)
    
    return simplified_cars[:10]  # Return top 10 relevant results


@tool
def save_search_results(
    user_id: int,
    query: str,
    results: List[Dict[str, Any]],
    summary: str
) -> Dict[str, Any]:
    """
    Save search results and post a message to the user's conversation.
    Use this tool when you have found cars and want to present them to the user.
    
    Args:
        user_id: The user's ID
        query: The original search query
        results: List of car dictionaries with details (brand, model, price, etc.)
        summary: Your summary/recommendation message to show the user
        
    Returns:
        Dictionary with success status and conversation message ID
    """
    from db.base import SessionLocal
    from db.models import Conversation, ConversationMessage, Search, SearchResult, Car
    from datetime import datetime
    
    logger.info("tool_save_search_results", user_id=user_id, query=query, results_count=len(results))
    
    db = SessionLocal()
    try:
        # Get or create conversation for user
        conversation = db.query(Conversation).filter(
            Conversation.user_id == user_id
        ).first()
        
        if not conversation:
            conversation = Conversation(
                user_id=user_id,
                title="Car Search Assistant",
                created_at=datetime.utcnow()
            )
            db.add(conversation)
            db.flush()
        
        # Save user's query as a message
        user_message = ConversationMessage(
            conversation_id=conversation.id,
            role="user",
            content=query,
            created_at=datetime.utcnow()
        )
        db.add(user_message)
        
        # Save assistant's response
        assistant_message = ConversationMessage(
            conversation_id=conversation.id,
            role="assistant",
            content=summary,
            created_at=datetime.utcnow()
        )
        db.add(assistant_message)
        
        # Save search record
        search = Search(
            user_id=user_id,
            query=query,
            created_at=datetime.utcnow()
        )
        db.add(search)
        db.flush()
        
        # Save each car result
        saved_count = 0
        for car_data in results[:10]:  # Limit to top 10
            try:
                vin = car_data.get("vin")
                if not vin:
                    continue
                
                # Check if car already exists (skip for now)
                existing_car = None
                
                if not existing_car:
                    # Create new car with all data in car_data JSON field
                    car = Car(
                        car_data={
                            "vin": vin,
                            "brand": car_data.get("brand"),
                            "model": car_data.get("model"),
                            "year": car_data.get("year"),
                            "price": car_data.get("price"),
                            "location": car_data.get("location"),
                            "dealer": car_data.get("dealer"),
                            "images": car_data.get("images", [])[:3],
                            "relevance_score": car_data.get("relevance_score", 0.0)
                        },
                        active=True,
                        created_at=datetime.utcnow()
                    )
                    db.add(car)
                    db.flush()
                    car_id = car.id
                else:
                    car_id = existing_car.id
                
                # Link car to search
                # Get match_score from internal ranking (stored as match_score)
                match_score = car_data.get("match_score", 0.0)
                # Convert to 0-1 range if needed
                if match_score > 1:
                    match_score = match_score / 100.0
                
                search_result = SearchResult(
                    search_id=search.id,
                    car_id=car_id,
                    rank=saved_count + 1,
                    match_score=match_score
                )
                db.add(search_result)
                saved_count += 1
                
            except Exception as e:
                logger.warning("failed_to_save_car", error=str(e), vin=car_data.get("vin"))
                continue
        
        db.commit()
        
        logger.info(
            "search_results_saved",
            user_id=user_id,
            search_id=search.id,
            cars_saved=saved_count,
            message_id=assistant_message.id
        )
        
        return {
            "success": True,
            "search_id": search.id,
            "cars_saved": saved_count,
            "message_id": assistant_message.id,
            "conversation_id": conversation.id
        }
        
    except Exception as e:
        db.rollback()
        logger.error("save_search_error", error=str(e), user_id=user_id)
        return {
            "success": False,
            "error": str(e)
        }
    finally:
        db.close()


@tool
def post_message_to_user(user_id: int, message: str) -> Dict[str, Any]:
    """
    Post a message to the user's conversation.
    Use this when you want to communicate with the user (e.g., no results found, need clarification).
    
    Args:
        user_id: The user's ID
        message: Your message to the user
        
    Returns:
        Dictionary with success status and message ID
    """
    from db.base import SessionLocal
    from db.models import Conversation, ConversationMessage
    from datetime import datetime
    
    logger.info("tool_post_message", user_id=user_id, message_length=len(message))
    
    db = SessionLocal()
    try:
        # Get or create conversation
        conversation = db.query(Conversation).filter(
            Conversation.user_id == user_id
        ).first()
        
        if not conversation:
            conversation = Conversation(
                user_id=user_id,
                title="Car Search Assistant",
                created_at=datetime.utcnow()
            )
            db.add(conversation)
            db.flush()
        
        # Save assistant's message
        assistant_message = ConversationMessage(
            conversation_id=conversation.id,
            role="assistant",
            content=message,
            created_at=datetime.utcnow()
        )
        db.add(assistant_message)
        db.commit()
        
        logger.info("message_posted", message_id=assistant_message.id, user_id=user_id)
        
        return {
            "success": True,
            "message_id": assistant_message.id,
            "conversation_id": conversation.id
        }
        
    except Exception as e:
        db.rollback()
        logger.error("post_message_error", error=str(e), user_id=user_id)
        return {
            "success": False,
            "error": str(e)
        }
    finally:
        db.close()


# Export all tools
ALL_TOOLS = [
    search_car_listings,
    save_search_results,
    post_message_to_user
]
