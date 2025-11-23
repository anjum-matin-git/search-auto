"""
Step 1: Analyze user query to extract car features and create embedding.
"""
from typing import Dict, Any

from agents.search.state import SearchState
from integrations.openai_client import OpenAIClient
from core.logging import get_logger

logger = get_logger(__name__)


async def analyze_query(state: SearchState) -> Dict[str, Any]:
    """
    Extract structured car features from natural language query.
    Also creates embedding for semantic search.
    
    Args:
        state: Current workflow state with 'query' field
    
    Returns:
        Updated state with 'extracted_features' and 'query_embedding'
    """
    logger.info("step_analyze_query_start", query=state["query"])
    
    openai_client = OpenAIClient()
    
    extracted_features = await openai_client.extract_features(state["query"])
    
    query_embedding = await openai_client.create_embedding(state["query"])
    
    logger.info(
        "step_analyze_query_complete",
        features=extracted_features,
        embedding_dimensions=len(query_embedding)
    )
    
    return {
        "extracted_features": extracted_features,
        "query_embedding": query_embedding,
    }
