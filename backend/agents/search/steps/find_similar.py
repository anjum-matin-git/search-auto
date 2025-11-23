"""
Step 4: Find similar cars using ChromaDB vector similarity search.
"""
from typing import Dict, Any, List

from agents.search.state import SearchState
from integrations.chroma_client import get_chroma_client
from db.base import SessionLocal
from db.repositories import CarRepository
from core.config import settings
from core.logging import get_logger

logger = get_logger(__name__)


async def find_similar(state: SearchState) -> Dict[str, Any]:
    """
    Find cars similar to the query using ChromaDB vector similarity search.
    Uses cosine similarity on embeddings stored in ChromaDB.
    
    Args:
        state: Current workflow state with 'query_embedding'
    
    Returns:
        Updated state with 'matched_cars' and 'match_scores'
    """
    logger.info("step_find_similar_start")
    
    chroma_client = get_chroma_client()
    db = SessionLocal()
    car_repo = CarRepository(db)
    
    try:
        # Search ChromaDB for similar cars
        chroma_results = chroma_client.search_similar_cars(
            query_embedding=state["query_embedding"],
            n_results=settings.max_search_results
        )
        
        matched_cars: List[Dict[str, Any]] = []
        match_scores: List[float] = []
        
        # Get car IDs from ChromaDB results
        car_ids = [int(car_id) for car_id in chroma_results['ids'][0]]
        distances = chroma_results['distances'][0]
        
        # Fetch full car details from PostgreSQL
        for car_id, distance in zip(car_ids, distances):
            car = car_repo.get_by_id(car_id)
            if car and car.active:
                # car_data is already a dict stored as JSON
                car_dict = {"id": car.id, **car.car_data}
                matched_cars.append(car_dict)
                # Convert distance to similarity score (lower distance = higher similarity)
                match_scores.append(1.0 - distance)
        
        logger.info("step_find_similar_complete", matched_count=len(matched_cars))
        
        return {
            "matched_cars": matched_cars,
            "match_scores": match_scores,
        }
        
    finally:
        db.close()
