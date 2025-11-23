"""
State definition for the car search LangGraph workflow.
TypedDict for type safety and clarity.
"""
from typing import TypedDict, List, Dict, Any, Optional


class SearchState(TypedDict, total=False):
    """
    State container for the 5-step car search workflow.
    
    Workflow steps:
    1. analyze_query - Extract features from natural language
    2. scrape_websites - Scrape AutoTrader and CarGurus
    3. store_cars - Save cars with embeddings to database
    4. find_similar - Find matching cars using vector search
    5. save_history - Save search history and update preferences
    """
    
    # Input
    user_id: Optional[int]
    query: str
    
    # Step 1: Analyze Query
    extracted_features: Dict[str, Any]
    query_embedding: List[float]
    
    # Step 2: Scrape Websites
    autotrader_cars: List[Dict[str, Any]]
    cargurus_cars: List[Dict[str, Any]]
    all_scraped_cars: List[Dict[str, Any]]
    
    # Step 3: Store Cars
    stored_car_ids: List[int]
    
    # Step 4: Find Similar
    matched_cars: List[Dict[str, Any]]
    match_scores: List[float]
    
    # Step 5: Save History
    search_id: int
    
    # Errors (if any)
    error: Optional[str]
