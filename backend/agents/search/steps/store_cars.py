"""
Step 3: Store scraped cars in database with embeddings.
"""
from typing import Dict, Any, List

from agents.search.state import SearchState
from integrations.openai_client import OpenAIClient
from db.base import SessionLocal
from db.repositories import CarRepository
from core.logging import get_logger

logger = get_logger(__name__)


async def store_cars(state: SearchState) -> Dict[str, Any]:
    """
    Store scraped cars in database with vector embeddings.
    Creates embeddings for each car based on its features.
    
    Args:
        state: Current workflow state with 'all_scraped_cars'
    
    Returns:
        Updated state with 'stored_car_ids'
    """
    logger.info("step_store_cars_start", cars_count=len(state["all_scraped_cars"]))
    
    openai_client = OpenAIClient()
    db = SessionLocal()
    car_repo = CarRepository(db)
    
    try:
        stored_car_ids: List[int] = []
        
        for car_data in state["all_scraped_cars"]:
            embedding = await openai_client.create_car_embedding(car_data)
            
            car_data_with_embedding = {
                **car_data,
                "embedding": embedding,
                "active": True,
            }
            
            car = car_repo.create(**car_data_with_embedding)
            stored_car_ids.append(car.id)
        
        logger.info("step_store_cars_complete", stored_count=len(stored_car_ids))
        
        return {
            "stored_car_ids": stored_car_ids,
        }
        
    finally:
        db.close()
