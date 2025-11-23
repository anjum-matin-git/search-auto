"""
Step 4: Find similar cars using vector similarity search.
"""
from typing import Dict, Any, List

from agents.search.state import SearchState
from db.base import SessionLocal
from db.repositories import CarRepository
from core.config import settings
from core.logging import get_logger

logger = get_logger(__name__)


async def find_similar(state: SearchState) -> Dict[str, Any]:
    """
    Find cars similar to the query using vector similarity search.
    Uses cosine similarity on embeddings stored in PostgreSQL.
    
    Args:
        state: Current workflow state with 'query_embedding'
    
    Returns:
        Updated state with 'matched_cars' and 'match_scores'
    """
    logger.info("step_find_similar_start")
    
    db = SessionLocal()
    car_repo = CarRepository(db)
    
    try:
        results = car_repo.find_similar(
            embedding=state["query_embedding"],
            limit=settings.max_search_results
        )
        
        matched_cars: List[Dict[str, Any]] = []
        match_scores: List[float] = []
        
        for car, score in results:
            matched_cars.append({
                "id": car.id,
                "brand": car.brand,
                "model": car.model,
                "year": car.year,
                "price": car.price,
                "mileage": car.mileage,
                "location": car.location,
                "type": car.type,
                "source": car.source,
                "url": car.url,
                "description": car.description,
                "features": car.features or [],
                "images": car.images or [],
                "acceleration": car.acceleration,
                "top_speed": car.top_speed,
                "power": car.power,
                "mpg": car.mpg,
            })
            match_scores.append(score)
        
        logger.info("step_find_similar_complete", matched_count=len(matched_cars))
        
        return {
            "matched_cars": matched_cars,
            "match_scores": match_scores,
        }
        
    finally:
        db.close()
